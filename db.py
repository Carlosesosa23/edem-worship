import os
import sqlite3

# Use local SQLite file
DB_FILE = 'worship.db'

import time

# Global pool variable
POOL = None

# Global pool variable
POOL = None

def get_conn(retry_count=0):
    url = os.environ.get('DATABASE_URL')
    if url:
        # Cloud / Postgres with Pooling
        global POOL
        if POOL is None:
            print("🌊 Initializing Threaded DB Pool...")
            from psycopg2 import pool
            # Use ThreadedConnectionPool for thread safety with gunicorn threads
            POOL = pool.ThreadedConnectionPool(1, 10, url)
        
        try:
            conn = POOL.getconn()
        except Exception as e:
            print(f"⚠️ Pool exhausted or error: {e}")
            # Fallback: create a temporary fresh connection if pool fails
            import psycopg2
            from psycopg2.extras import RealDictCursor
            return psycopg2.connect(url, cursor_factory=RealDictCursor)

        # Health Check: Verify connection involves no transaction and is open
        try:
            if conn.closed:
                print("♻️ Connection closed, getting a new one...")
                POOL.putconn(conn, close=True)
                if retry_count < 3:
                    return get_conn(retry_count + 1)
                else:
                    # After 3 retries, force a fresh non-pooled connection to survive
                    import psycopg2
                    from psycopg2.extras import RealDictCursor
                    return psycopg2.connect(url, cursor_factory=RealDictCursor)
        except Exception as e:
            print(f"⚠️ Connection bad ({e}), resetting...")
            try:
                POOL.putconn(conn, close=True)
            except:
                pass
            if retry_count < 3:
                return get_conn(retry_count + 1)
            else:
                 # Fallback
                import psycopg2
                from psycopg2.extras import RealDictCursor
                return psycopg2.connect(url, cursor_factory=RealDictCursor)
            
        return conn
    else:
        # Local / SQLite
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        return conn

def run_sql(sql, params=(), commit=False, fetch=None):
    """
    Generic runner to handle syntax diffs (? vs %s) and connection lifecycle.
    fetch: 'all', 'one', or None
    """
    start_time = time.time()
    url = os.environ.get('DATABASE_URL')
    
    try:
        conn = get_conn()
    except Exception as e:
        print(f"❌ Error getting connection: {e}")
        raise e
        
    conn_time = time.time()
    
    # Adapter for Postgres syntax
    if url:
        sql = sql.replace('?', '%s')
    
    # Prepare cursor options
    cur_args = {}
    if url:
        from psycopg2.extras import RealDictCursor
        cur_args['cursor_factory'] = RealDictCursor

    try:
        cur = conn.cursor(**cur_args)
        try:
            cur.execute(sql, params)
            
            exec_time = time.time()
            
            if commit:
                conn.commit()
                
            res = None
            if fetch == 'all':
                # Convert to pure dicts
                res = [dict(r) for r in cur.fetchall()]
            elif fetch == 'one':
                row = cur.fetchone()
                res = dict(row) if row else None
            
            end_time = time.time()
            total_duration = end_time - start_time
            if total_duration > 1.0:
                print(f"🐢 SLOW QUERY ({total_duration:.2f}s): {sql[:50]}...")
                print(f"   - GetConn: {conn_time - start_time:.4f}s")
                print(f"   - Execute: {exec_time - conn_time:.4f}s")
                print(f"   - Fetch/Commit: {end_time - exec_time:.4f}s")
                
            return res
        finally:
            cur.close()
    except Exception as e:
        # If error, rollback (important for pooled connections)
        print(f"❌ SQL Error: {e}")
        if url:
            conn.rollback()
        raise e
    finally:
        if url:
            # Return connection to pool
            POOL.putconn(conn)
        else:
            # Close local sqlite connection
            conn.close()

def init_db():
    url = os.environ.get('DATABASE_URL')
    
    # Table definitions vary slightly
    if url:
        # Postgres
        create_songs = '''
            CREATE TABLE IF NOT EXISTS songs (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                tones TEXT,
                best TEXT,
                lyrics TEXT,
                chords TEXT,
                audio_url TEXT
            );
        '''
        create_mixes = '''
            CREATE TABLE IF NOT EXISTS mixes (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                songs TEXT
            );
        '''
        
        # Migration for existing Postgres tables
        try:
            run_sql("ALTER TABLE songs ADD COLUMN audio_url TEXT", commit=True)
        except Exception as e:
            print(f"Migration: audio_url might already exist: {e}")
        create_mixes = '''
            CREATE TABLE IF NOT EXISTS mixes (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                songs TEXT
            );
        '''
    else:
        # SQLite
        create_songs = '''
            CREATE TABLE IF NOT EXISTS songs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                tones TEXT,
                best TEXT,
                lyrics TEXT,
                chords TEXT
            );
        '''
        create_mixes = '''
            CREATE TABLE IF NOT EXISTS mixes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                songs TEXT
            );
        '''

    run_sql(create_songs, commit=True)
    run_sql(create_mixes, commit=True)

    # Migrations (Simple column check)
    # This is trickier abstractly, so we do a quick check only if finding columns is easy
    # Or just try/except adding columns.
    
    # Safest simple migration strategy: Try to select the new columns, if fail, add them.
    # Note: 'ALTER TABLE ADD COLUMN' is compatible for simple types.
    
    try:
        run_sql("SELECT lyrics FROM songs LIMIT 1")
    except:
        # Fails if column doesn't exist (in SQLite at least, Postgres might handle differently depending on driver error)
        # Actually simpler: catch the specific error or just run ALTER and ignore "duplicate column" error
        # But letting Python crash is bad.
        
        # In SQLite pragma works. In Postgres:
        pass
        
    # Manual Migration Implementation for hybrid is complex. 
    # For now, we assume Cloud DB starts fresh so no migration needed immediately.
    # Local DB has it.
    # We will skip the automated 'ALTER' for now to avoid complexity, 
    # assuming cloud stays fresh or we manage migrations manually if needed.
    
    # (Checking local SQLite specific for backward compat)
    if not url:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(songs)")
        columns = [row['name'] for row in cur.fetchall()]
        if 'lyrics' not in columns:
            cur.execute("ALTER TABLE songs ADD COLUMN lyrics TEXT")
        if 'chords' not in columns:
            cur.execute("ALTER TABLE songs ADD COLUMN chords TEXT")
        if 'audio_url' not in columns:
            cur.execute("ALTER TABLE songs ADD COLUMN audio_url TEXT")
        conn.commit()
        conn.close()


def add_song(name, tones, best, lyrics="", chords="", audio_url=""):
    run_sql('INSERT INTO songs (name, tones, best, lyrics, chords, audio_url) VALUES (?, ?, ?, ?, ?, ?)', 
            (name, tones, best, lyrics, chords, audio_url), commit=True)

def get_songs():
    return run_sql('SELECT * FROM songs ORDER BY id DESC', fetch='all')

def get_songs_metadata():
    """Lightweight query for lists (skips lyrics/chords/audio_url)"""
    return run_sql('SELECT id, name, tones, best FROM songs ORDER BY id DESC', fetch='all')

def get_song(id):
    return run_sql('SELECT * FROM songs WHERE id = ?', (id,), fetch='one')

def add_mix(name, songs):
    run_sql('INSERT INTO mixes (name, songs) VALUES (?, ?)', (name, songs), commit=True)

def get_mixes():
    return run_sql('SELECT * FROM mixes ORDER BY id DESC', fetch='all')

def get_mix(id):
    return run_sql('SELECT * FROM mixes WHERE id = ?', (id,), fetch='one')

def delete_song(id):
    run_sql("DELETE FROM songs WHERE id = ?", (id,), commit=True)

def delete_mix(id):
    run_sql("DELETE FROM mixes WHERE id = ?", (id,), commit=True)
