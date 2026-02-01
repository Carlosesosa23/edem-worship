from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
import db
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!' # Required for sessions in socketio (even if minimal)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Initialize DB on startup
with app.app_context():
    db.init_db()

@app.route("/")
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
        
    return render_template("index.html", songs=songs, mixes=mixes)

@app.route("/song/<int:id>")
def view_song(id):
    song = db.get_song(id)
    if song:
        return render_template("song.html", song=song)
    return redirect("/")

@app.route("/mix/<int:id>")
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
def add_song():
    name = request.form["name"]
    tones = request.form["tones"]
    best = request.form["best"]
    lyrics = request.form.get("lyrics", "")
    chords = request.form.get("chords", "")
    db.add_song(name, tones, best, lyrics, chords)
    return redirect("/")

@app.route("/add_mix", methods=["POST"])
def add_mix():
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
def delete_song_route(id):
    db.delete_song(id)
    return redirect("/")

@app.route("/delete_mix/<int:id>", methods=["POST"])
def delete_mix_route(id):
    db.delete_mix(id)
    return redirect("/")

@app.route("/builder")
def builder():
    songs = db.get_songs()
    for s in songs:
        s['tones'] = s['tones'].split(',') if s['tones'] else []
    return render_template("builder.html", songs=songs)

# Live Alerts Routes & Events
@app.route("/director")
def director():
    return render_template("director.html")

@socketio.on('send_alert')
def handle_alert(data):
    # data = {'type': 'structure', 'message': 'CORO', 'color': 'blue'}
    print(f"Alert received: {data}")
    emit('alert', data, broadcast=True)

if __name__ == "__main__":
    # host='0.0.0.0' allows other devices on the network to connect
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
