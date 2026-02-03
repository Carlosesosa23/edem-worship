from flask import Flask, render_template, request, redirect, url_for, flash
from flask_socketio import SocketIO, emit
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import db
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key_change_in_prod') # Important for sessions

# Login Manager Setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# SocketIO Setup
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# --- User Model & Mock DB (For simplicity - upgrade to SQL later if needed) ---
# En production we should use a real DB table, but for this file-based app, simple dict is okay for now.
# Default Users:
# admin / admin123
# musico / edem2024

users_db = {
    "admin": {"password": generate_password_hash("admin123"), "role": "admin"},
    "musico": {"password": generate_password_hash("edem2026"), "role": "musico"}
}

class User(UserMixin):
    def __init__(self, id, role):
        self.id = id
        self.role = role

@login_manager.user_loader
def load_user(user_id):
    if user_id in users_db:
        return User(user_id, users_db[user_id]['role'])
    return None

# --- Routes ---

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username").lower()
        password = request.form.get("password")
        remember = True if request.form.get("remember") else False
        
        if username in users_db and check_password_hash(users_db[username]["password"], password):
            user = User(username, users_db[username]["role"])
            login_user(user, remember=remember)
            return redirect(url_for("index"))
        
        flash("Usuario o contraseña incorrectos")
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

# Initialize DB on startup
with app.app_context():
    db.init_db()

@app.route("/")
@login_required
def index():
    songs = db.get_songs()
    mixes = db.get_mixes()
    # Process mixes to have list of song names
    for m in mixes:
        m['songs'] = m['songs'].split(',') if m['songs'] else []
        m['song_count'] = len(m['songs'])
    
    # Process songs tones
    for s in songs:
        s['tones'] = s['tones'].split(',') if s['tones'] else []
        
    return render_template("index.html", songs=songs, mixes=mixes, current_user=current_user)

@app.route("/song/<int:id>")
@login_required
def view_song(id):
    song = db.get_song(id)
    if song:
        return render_template("song.html", song=song)
    return redirect("/")

@app.route("/mix/<int:id>")
@login_required
def view_mix(id):
    mix = db.get_mix(id)
    if not mix:
        return redirect("/")
    
    # Get all songs to lookup details
    all_songs = db.get_songs()
    song_map = {s['name']: s for s in all_songs}
    
    mix_songs_names = mix['songs'].split(',') if mix['songs'] else []
    mix_songs_details = []
    
    for name in mix_songs_names:
        if name in song_map:
            mix_songs_details.append(song_map[name])
            
    return render_template("mix.html", mix=mix, songs=mix_songs_details)

@app.route("/add_song", methods=["POST"])
@login_required
def add_song():
    if current_user.role != 'admin':
        return "Acceso Denegado", 403
    name = request.form["name"]
    tones = request.form["tones"]
    best = request.form["best"]
    lyrics = request.form.get("lyrics", "")
    chords = request.form.get("chords", "")
    audio_url = request.form.get("audio_url", "")
    db.add_song(name, tones, best, lyrics, chords, audio_url)
    return redirect("/")

@app.route("/add_mix", methods=["POST"])
@login_required
def add_mix():
    if current_user.role != 'admin':
        return "Acceso Denegado", 403
    name = request.form["mix_name"]
    # Check for ordered list first
    ordered = request.form.get("ordered_songs")
    if ordered:
        selected_str = ordered
    else:
        # Fallback to checkboxes
        selected = request.form.getlist("songs")
        selected_str = ','.join(selected)
    
    db.add_mix(name, selected_str)
    return redirect("/")

@app.route("/delete_song/<int:id>", methods=["POST"])
@login_required
def delete_song_route(id):
    if current_user.role != 'admin':
        return "Acceso Denegado", 403
    db.delete_song(id)
    return redirect("/")

@app.route("/delete_mix/<int:id>", methods=["POST"])
@login_required
def delete_mix_route(id):
    if current_user.role != 'admin':
        return "Acceso Denegado", 403
    db.delete_mix(id)
    return redirect("/")

@app.route("/builder")
@login_required
def builder():
    if current_user.role != 'admin':
        return "Solo administradores pueden crear mixes", 403
    songs = db.get_songs()
    for s in songs:
        s['tones'] = s['tones'].split(',') if s['tones'] else []
    return render_template("builder.html", songs=songs)

# Live Alerts Routes & Events
@app.route("/director")
@login_required
def director():
    if current_user.role != 'admin':
        return "Solo el director tiene acceso", 403
    return render_template("director.html")

@socketio.on('send_alert')
def handle_alert(data):
    # data = {'type': 'structure', 'message': 'CORO', 'color': 'blue'}
    # Optionally check if current_user.is_authenticated and is admin via flask-socketio context, 
    # but for now standard reliance on the director page protection is okay.
    print(f"Alert received: {data}")
    emit('alert', data, broadcast=True)

if __name__ == "__main__":
    # host='0.0.0.0' allows other devices on the network to connect
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
