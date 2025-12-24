from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os

# ====== ADDED FOR AUTH ONLY ======
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
# ================================

app = Flask(__name__)
CORS(app)

# ====== SQLITE DATABASE (AUTH ONLY) ======
DATABASE = 'users.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()
# ========================================


# --- YOUR DATABASE OF 10 SONGS (UNCHANGED) ---
songs_db = [
    {
        "id": 1,
        "title": "As It Was",
        "artist": "Harry Styles",
        "filename": "asitwas.mp3",
        "lyrics": "Holdin' me back, gravity's holdin' me back."
    },
    {
        "id": 2,
        "title": "Attention",
        "artist": "Charlie Puth",
        "filename": "attention.mp3",
        "lyrics": "You just want attention, you don't want my heart."
    },
    {
        "id": 3,
        "title": "Blinding Lights",
        "artist": "The Weeknd",
        "filename": "blindinglights.mp3",
        "lyrics": "I said, ooh, I'm blinded by the lights."
    },
    {
        "id": 4,
        "title": "Bad Guy",
        "artist": "Billie Eilish",
        "filename": "badguy.mp3",
        "lyrics": "So you're a tough guy, like it really rough guy."
    },
    {
        "id": 5,
        "title": "Cruel Summer",
        "artist": "Taylor Swift",
        "filename": "cruelsummer.mp3",
        "lyrics": "It's new, the shape of your body. It's blue."
    },
    {
        "id": 6,
        "title": "Cheap Thrills",
        "artist": "Sia",
        "filename": "cheapthrills.mp3",
        "lyrics": "Baby I don't need dollar bills to have fun tonight."
    },
    {
        "id": 7,
        "title": "Dandelions",
        "artist": "Ruth B",
        "filename": "dandelions.mp3",
        "lyrics": "I'm in a field of dandelions, wishing on every one."
    },
    {
        "id": 8,
        "title": "Dancing Queen",
        "artist": "ABBA",
        "filename": "dancingqueen.mp3",
        "lyrics": "You are the dancing queen, young and sweet."
    },
    {
        "id": 9,
        "title": "Espresso",
        "artist": "Sabrina Carpenter",
        "filename": "espresso.mp3",
        "lyrics": "Now he's thinkin' 'bout me every night, oh."
    },
    {
        "id": 10,
        "title": "Enemy",
        "artist": "Imagine Dragons",
        "filename": "enemy.mp3",
        "lyrics": "Oh, the misery. Everybody wants to be my enemy."
    }
]

# 1. Route to get ALL songs (UNCHANGED)
@app.route('/songs', methods=['GET'])
def get_songs():
    return jsonify(songs_db)

# 2. Route to Search songs (UNCHANGED)
@app.route('/search', methods=['GET'])
def search_song():
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])

    results = []
    for song in songs_db:
        score = 0
        if query in song['title'].lower():
            score += 5
        elif query in song['artist'].lower():
            score += 3
        elif query in song['lyrics'].lower():
            score += 2

        if score > 0:
            results.append({**song, "score": score})

    results.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(results)

# 3. Route to Stream Audio (UNCHANGED)
@app.route('/stream/<filename>')
def stream_music(filename):
    return send_from_directory('.', filename)

# ====== AUTH ROUTES (ADDED ONLY) ======

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, hashed_password)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Account created successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409


@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    ).fetchone()
    conn.close()

    if user and check_password_hash(user['password'], password):
        return jsonify({"message": "Login successful"}), 200

    return jsonify({"error": "Invalid credentials"}), 401

# =====================================

if __name__ == '__main__':
    app.run(debug=True, port=5000)
