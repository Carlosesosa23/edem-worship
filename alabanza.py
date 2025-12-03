import tkinter as tk
from tkinter import ttk, filedialog
import ttkbootstrap as tb
import json
import pygame

class SongManager:
    def __init__(self):
        self.songs = {}

    def add_song(self, name, tones, best_singer, audio):
        self.songs[name] = {"tones": tones, "best": best_singer, "audio": audio}

    def get_songs(self):
        return dict(sorted(self.songs.items()))

class MixManager:
    def __init__(self):
        self.mixes = {}

    def create_mix(self, name, songs):
        self.mixes[name] = songs

class App:
    def __init__(self, root):
        self.root = root
        self.root.title("EDEM WORSHIP")
        self.song_manager = SongManager()
        self.mix_manager = MixManager()
        pygame.mixer.init()

        frame = ttk.Frame(root, padding=20)
        frame.pack(fill="both", expand=True)

        ttk.Label(frame, text="Canciones").grid(row=0, column=0)
        self.song_listbox = tk.Listbox(frame, width=50, height=10, font=("Segoe UI", 12))
        self.song_listbox.grid(row=1, column=0)
        ttk.Button(frame, text="Agregar Canción", command=self.add_song_window).grid(row=2, column=0, pady=10)
        ttk.Button(frame, text="Reproducir", command=self.play_song).grid(row=3, column=0, pady=5)

        ttk.Label(frame, text="Mixes").grid(row=4, column=0, pady=5)
        self.mix_listbox = tk.Listbox(frame, width=50, height=10, font=("Segoe UI", 12))
        self.mix_listbox.grid(row=5, column=0)
        ttk.Button(frame, text="Crear Mix", command=self.create_mix_window).grid(row=6, column=0, pady=5)

        ttk.Button(frame, text="Guardar Datos", command=self.save_data).grid(row=7, column=0, pady=5)
        ttk.Button(frame, text="Cargar Datos", command=self.load_data).grid(row=8, column=0, pady=5)

    def refresh_songs(self):
        self.song_listbox.delete(0, tk.END)
        for name, info in self.song_manager.get_songs().items():
            display = f"{name} | Tonos: {', '.join(info['tones'])} | Mejor: {info['best']}"
            self.song_listbox.insert(tk.END, display)

    def refresh_mixes(self):
        self.mix_listbox.delete(0, tk.END)
        for name, songs in self.mix_manager.mixes.items():
            self.mix_listbox.insert(tk.END, f"{name}: {', '.join(songs)}")

    def play_song(self):
        sel = self.song_listbox.curselection()
        if not sel:
            return
        index = sel[0]
        name = list(self.song_manager.get_songs().keys())[index]
        audio = self.song_manager.songs[name]["audio"]
        if audio:
            pygame.mixer.music.load(audio)
            pygame.mixer.music.play()

    def add_song_window(self):
        win = tk.Toplevel(self.root)
        win.title("Agregar Canción")
        win.geometry("400x350")

        ttk.Label(win, text="Nombre:").pack()
        name_entry = ttk.Entry(win)
        name_entry.pack()

        ttk.Label(win, text="Tonalidades:").pack()
        tone_entry = ttk.Entry(win)
        tone_entry.pack()

        ttk.Label(win, text="Cantante:").pack()
        singer_combo = ttk.Combobox(win, values=["Ana", "María", "Camila", "Sara", "Julia"])
        singer_combo.pack()

        ttk.Label(win, text="Archivo de audio:").pack()
        audio_entry = ttk.Entry(win)
        audio_entry.pack()

        def load_audio():
            path = filedialog.askopenfilename(filetypes=[("MP3", "*.mp3")])
            audio_entry.delete(0, tk.END)
            audio_entry.insert(0, path)

        ttk.Button(win, text="Buscar audio", command=load_audio).pack()

        def save():
            name = name_entry.get()
            tones = [t.strip() for t in tone_entry.get().split(",")]
            best = singer_combo.get()
            audio = audio_entry.get()
            if name:
                self.song_manager.add_song(name, tones, best, audio)
                self.refresh_songs()
                win.destroy()

        ttk.Button(win, text="Guardar", command=save).pack(pady=10)

    def create_mix_window(self):
        win = tk.Toplevel(self.root)
        win.title("Crear Mix")
        win.geometry("350x350")

        ttk.Label(win, text="Nombre del mix:").pack()
        mix_entry = ttk.Entry(win)
        mix_entry.pack()

        song_vars = []
        ttk.Label(win, text="Seleccionar canciones:").pack()
        mix_entry = ttk.Entry(win)
        mix_entry.pack()
        win.geometry("300x400")

        for name in self.song_manager.get_songs().keys():
            var = tk.BooleanVar()
            chk = ttk.Checkbutton(win, text=name, variable=var)
            chk.pack(anchor="w")
            song_vars.append((name, var))

        def save_mix():
            name = mix_entry.get()
            selected = [song for song, var in song_vars if var.get()]
            if name and selected:
                self.mix_manager.create_mix(name, selected)
                self.refresh_mixes()
                win.destroy()

        ttk.Button(win, text="Guardar Mix", command=save_mix).pack(pady=10)

    def save_data(self):
        data = {"songs": self.song_manager.songs, "mixes": self.mix_manager.mixes}
        with open("alabanza.json", "w") as f:
            json.dump(data, f)

    def load_data(self):
        try:
            with open("alabanza.json", "r") as f:
                data = json.load(f)
                self.song_manager.songs = data["songs"]
                self.mix_manager.mixes = data["mixes"]
                self.refresh_songs()
                self.refresh_mixes()
        except:
            pass

root = tb.Window(themename="darkly")
app = App(root)
root.mainloop()
