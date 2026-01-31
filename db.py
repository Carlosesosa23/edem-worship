import os
import sqlite3

# Use local SQLite file
DB_FILE = 'worship.db'

def get_conn():
    url = os.environ.get('DATABASE_URL')
    if url:
        # Cloud / Postgres
        import psycopg2
        from psycopg2.extras import RealDictCursor
        return psycopg2.connect(url, cursor_factory=RealDictCursor)
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
    conn = get_conn()
    
    # Adapter for Postgres syntax
    if os.environ.get('DATABASE_URL'):
        sql = sql.replace('?', '%s')
    
    cur = conn.cursor()
    
    try:
        cur.execute(sql, params)
        if commit:
            conn.commit()
            
        res = None
        if fetch == 'all':
            # Convert to pure dicts
            res = [dict(r) for r in cur.fetchall()]
        elif fetch == 'one':
            row = cur.fetchone()
            res = dict(row) if row else None
            
        return res
    finally:
        cur.close()
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
                chords TEXT
            );
        '''
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
        conn.commit()
        conn.close()


def add_song(name, tones, best, lyrics="", chords=""):
    run_sql('INSERT INTO songs (name, tones, best, lyrics, chords) VALUES (?, ?, ?, ?, ?)', 
            (name, tones, best, lyrics, chords), commit=True)

def get_songs():
    return run_sql('SELECT * FROM songs ORDER BY id DESC', fetch='all')

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
