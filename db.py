import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS songs (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            tones TEXT,
            best TEXT
        );
        CREATE TABLE IF NOT EXISTS mixes (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            songs TEXT
        );
    ''')
    conn.commit()
    cur.close()
    conn.close()

def add_song(name, tones, best):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('INSERT INTO songs (name, tones, best) VALUES (%s, %s, %s)', (name, tones, best))
    conn.commit()
    cur.close()
    conn.close()

def get_songs():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT * FROM songs ORDER BY id DESC')
    songs = cur.fetchall()
    cur.close()
    conn.close()
    return songs

def add_mix(name, songs):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('INSERT INTO mixes (name, songs) VALUES (%s, %s)', (name, songs))
    conn.commit()
    cur.close()
    conn.close()

def get_mixes():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT * FROM mixes ORDER BY id DESC')
    mixes = cur.fetchall()
    cur.close()
    conn.close()
    return mixes
