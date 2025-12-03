from flask import Flask, render_template, request, redirect
import db
import os

app = Flask(__name__)

@app.before_first_request
def setup():
    db.init_db()

@app.route("/")
def index():
    songs = db.get_songs()
    mixes = db.get_mixes()
    # Convert mixes songs from text to list
    for m in mixes:
        m['songs'] = m['songs'].split(',') if m['songs'] else []
    for s in songs:
        s['tones'] = s['tones'].split(',') if s['tones'] else []
    return render_template("index.html", songs={s['name']:s for s in songs}, mixes={m['name']:m['songs'] for m in mixes})

@app.route("/add_song", methods=["POST"])
def add_song():
    name = request.form["name"]
    tones = request.form["tones"]
    best = request.form["best"]
    db.add_song(name, tones, best)
    return redirect("/")

@app.route("/add_mix", methods=["POST"])
def add_mix():
    name = request.form["mix_name"]
    selected = request.form.getlist("songs")
    db.add_mix(name, ','.join(selected))
    return redirect("/")

if __name__ == "__main__":
    app.run(debug=True)
