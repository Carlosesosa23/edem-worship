import os
import json
import tkinter as tk
from tkinter import filedialog, messagebox
import ttkbootstrap as tb
import tkinter.ttk as ttk
import pygame
try:
    from PIL import Image, ImageTk
    PIL_AVAILABLE = True
except:
    PIL_AVAILABLE = False
class SongManager:
    def __init__(self):
        self.songs = {}
    def add_song(self, name, tones, best, audio, cover):
        self.songs[name] = {"tones": tones, "best": best, "audio": audio, "cover": cover}
    def remove_song(self, name):
        if name in self.songs:
            del self.songs[name]
    def get_songs(self):
        return dict(sorted(self.songs.items()))
class MixManager:
    def __init__(self):
        self.mixes = {}
    def create_mix(self, name, songs):
        self.mixes[name] = songs
    def remove_mix(self, name):
        if name in self.mixes:
            del self.mixes[name]
class App:
    def __init__(self, root):
        self.root = root
        self.root.title('Ministerio de Alabanza - Dark Worship')
        self.root.geometry('1000x650')
        self.song_manager = SongManager()
        self.mix_manager = MixManager()
        pygame.mixer.init()
        self.singers = ['Ana Canaca', 'Ana Bogran', 'Ruth Funez', 'Maru', 'Katherine Portillo']
        self.logo_path = None
        self.setup_ui()
        self.data_file = 'alabanza_data.json'
        self.load_data()
    def setup_ui(self):
        style = tb.Style(theme='darkly')
        container = ttk.Frame(self.root)
        container.pack(fill='both', expand=True)
        sidebar = ttk.Frame(container, width=220)
        sidebar.pack(side='left', fill='y')
        logo_frame = ttk.Frame(sidebar)
        logo_frame.pack(pady=20)
        self.logo_label = ttk.Label(logo_frame, text='LOGO', anchor='center', width=18)
        self.logo_label.pack()
        ttk.Button(sidebar, text='Cargar logo', command=self.load_logo).pack(pady=8, fill='x', padx=12)
        ttk.Separator(sidebar).pack(fill='x', pady=10, padx=8)
        ttk.Label(sidebar, text='Cantantes').pack(padx=12)
        self.singer_listbox = tk.Listbox(sidebar, height=8)
        for s in self.singers:
            self.singer_listbox.insert(tk.END, s)
        self.singer_listbox.pack(padx=12, pady=6, fill='x')
        ttk.Separator(sidebar).pack(fill='x', pady=10, padx=8)
        ttk.Button(sidebar, text='Guardar datos', command=self.save_data).pack(padx=12, pady=6, fill='x')
        ttk.Button(sidebar, text='Cargar datos', command=self.load_data).pack(padx=12, pady=6, fill='x')
        ttk.Button(sidebar, text='Exportar mixes (.m3u)', command=self.export_mixes).pack(padx=12, pady=6, fill='x')
        main = ttk.Frame(container)
        main.pack(side='left', fill='both', expand=True)
        topbar = ttk.Frame(main)
        topbar.pack(fill='x', pady=10, padx=10)
        ttk.Label(topbar, text='Ministerio de Alabanza', font=('Segoe UI', 20)).pack(side='left')
        control_frame = ttk.Frame(topbar)
        control_frame.pack(side='right')
        ttk.Button(control_frame, text='Agregar canción', command=self.open_add_song).pack(side='left', padx=6)
        ttk.Button(control_frame, text='Editar canción', command=self.open_edit_song).pack(side='left', padx=6)
        ttk.Button(control_frame, text='Eliminar canción', command=self.delete_song).pack(side='left', padx=6)
        content = ttk.Frame(main)
        content.pack(fill='both', expand=True, padx=10, pady=6)
        left = ttk.Frame(content)
        left.pack(side='left', fill='both', expand=True)
        right = ttk.Frame(content, width=320)
        right.pack(side='right', fill='y')
        self.tree = ttk.Treeview(left, columns=('tones','best'), show='headings', selectmode='browse')
        self.tree.heading('tones', text='Tonalidades')
        self.tree.heading('best', text='Mejor cantante')
        self.tree.pack(fill='both', expand=True, side='top')
        self.tree.bind('<<TreeviewSelect>>', self.on_select_song)
        play_frame = ttk.Frame(left)
        play_frame.pack(fill='x', pady=8)
        ttk.Button(play_frame, text='Reproducir', command=self.play_selected).pack(side='left', padx=6)
        ttk.Button(play_frame, text='Pausar/Continuar', command=self.pause_resume).pack(side='left', padx=6)
        ttk.Button(play_frame, text='Detener', command=self.stop).pack(side='left', padx=6)
        ttk.Separator(right).pack(fill='x', pady=8)
        ttk.Label(right, text='Vista canción', font=('Segoe UI', 14)).pack(pady=6)
        self.cover_label = ttk.Label(right, text='Sin portada', width=30)
        self.cover_label.pack(pady=6)
        self.info_label = ttk.Label(right, text='Selecciona una canción', wraplength=280)
        self.info_label.pack(pady=6)
        ttk.Separator(right).pack(fill='x', pady=8)
        ttk.Label(right, text='Editor de mixes', font=('Segoe UI', 14)).pack(pady=6)
        ttk.Button(right, text='Crear mix', command=self.open_create_mix).pack(fill='x', padx=10)
        self.mix_list = tk.Listbox(right, height=8)
        self.mix_list.pack(fill='both', padx=10, pady=6)
        mix_btns = ttk.Frame(right)
        mix_btns.pack(fill='x')
        ttk.Button(mix_btns, text='Eliminar mix', command=self.delete_mix).pack(side='left', padx=6, pady=6)
        ttk.Button(mix_btns, text='Exportar mix (.m3u)', command=self.export_mix).pack(side='left', padx=6, pady=6)
    def load_logo(self):
        p = filedialog.askopenfilename(filetypes=[('PNG','*.png'),('JPG','*.jpg'),('All','*.*')])
        if not p:
            return
        self.logo_path = p
        if PIL_AVAILABLE:
            img = Image.open(p)
            img.thumbnail((160,120))
            tkimg = ImageTk.PhotoImage(img)
            self.logo_label.config(image=tkimg, text='')
            self.logo_label.image = tkimg
        else:
            self.logo_label.config(text=os.path.basename(p))
    def refresh_ui(self):
        for i in self.tree.get_children():
            self.tree.delete(i)
        for name, info in self.song_manager.get_songs().items():
            tones = ', '.join(info['tones'])
            best = info.get('best','')
            self.tree.insert('', 'end', iid=name, values=(tones,best))
        self.mix_list.delete(0, tk.END)
        for m, s in self.mix_manager.mixes.items():
            self.mix_list.insert(tk.END, f"{m}: {len(s)} canciones")
    def open_add_song(self):
        win = tk.Toplevel(self.root)
        win.title('Agregar canción')
        win.geometry('420x380')
        ttk.Label(win, text='Nombre').pack(pady=6)
        name = ttk.Entry(win)
        name.pack(fill='x', padx=12)
        ttk.Label(win, text='Tonalidades (separadas por coma)').pack(pady=6)
        tones = ttk.Entry(win)
        tones.pack(fill='x', padx=12)
        ttk.Label(win, text='Mejor cantante').pack(pady=6)
        best = ttk.Combobox(win, values=self.singers)
        best.pack(fill='x', padx=12)
        ttk.Label(win, text='Archivo de audio (mp3)').pack(pady=6)
        audio = ttk.Entry(win)
        audio.pack(fill='x', padx=12)
        def browse_audio():
            p = filedialog.askopenfilename(filetypes=[('MP3','*.mp3'),('WAV','*.wav'),('All','*.*')])
            if p:
                audio.delete(0, tk.END)
                audio.insert(0, p)
        ttk.Button(win, text='Buscar audio', command=browse_audio).pack(pady=6)
        ttk.Label(win, text='Portada (opcional)').pack(pady=6)
        cover = ttk.Entry(win)
        cover.pack(fill='x', padx=12)
        def browse_cover():
            p = filedialog.askopenfilename(filetypes=[('Images','*.png;*.jpg;*.jpeg'),('All','*.*')])
            if p:
                cover.delete(0, tk.END)
                cover.insert(0, p)
        ttk.Button(win, text='Buscar portada', command=browse_cover).pack(pady=6)
        def save():
            n = name.get().strip()
            if not n:
                messagebox.showwarning('Atención','Nombre vacío')
                return
            t = [x.strip() for x in tones.get().split(',') if x.strip()]
            b = best.get().strip()
            a = audio.get().strip()
            c = cover.get().strip()
            self.song_manager.add_song(n,t,b,a,c)
            self.refresh_ui()
            win.destroy()
        ttk.Button(win, text='Guardar', command=save).pack(pady=10)
    def open_edit_song(self):
        sel = self.tree.selection()
        if not sel:
            return
        name = sel[0]
        info = self.song_manager.songs.get(name)
        if not info:
            return
        win = tk.Toplevel(self.root)
        win.title('Editar canción')
        win.geometry('420x380')
        ttk.Label(win, text='Nombre').pack(pady=6)
        name_e = ttk.Entry(win)
        name_e.insert(0, name)
        name_e.pack(fill='x', padx=12)
        ttk.Label(win, text='Tonalidades (separadas por coma)').pack(pady=6)
        tones = ttk.Entry(win)
        tones.insert(0, ', '.join(info.get('tones',[])))
        tones.pack(fill='x', padx=12)
        ttk.Label(win, text='Mejor cantante').pack(pady=6)
        best = ttk.Combobox(win, values=self.singers)
        best.set(info.get('best',''))
        best.pack(fill='x', padx=12)
        ttk.Label(win, text='Archivo de audio (mp3)').pack(pady=6)
        audio = ttk.Entry(win)
        audio.insert(0, info.get('audio',''))
        audio.pack(fill='x', padx=12)
        def browse_audio():
            p = filedialog.askopenfilename(filetypes=[('MP3','*.mp3'),('WAV','*.wav'),('All','*.*')])
            if p:
                audio.delete(0, tk.END)
                audio.insert(0, p)
        ttk.Button(win, text='Buscar audio', command=browse_audio).pack(pady=6)
        ttk.Label(win, text='Portada (opcional)').pack(pady=6)
        cover = ttk.Entry(win)
        cover.insert(0, info.get('cover',''))
        cover.pack(fill='x', padx=12)
        def browse_cover():
            p = filedialog.askopenfilename(filetypes=[('Images','*.png;*.jpg;*.jpeg'),('All','*.*')])
            if p:
                cover.delete(0, tk.END)
                cover.insert(0, p)
        ttk.Button(win, text='Buscar portada', command=browse_cover).pack(pady=6)
        def save():
            n = name_e.get().strip()
            if not n:
                messagebox.showwarning('Atención','Nombre vacío')
                return
            t = [x.strip() for x in tones.get().split(',') if x.strip()]
            b = best.get().strip()
            a = audio.get().strip()
            c = cover.get().strip()
            self.song_manager.remove_song(name)
            self.song_manager.add_song(n,t,b,a,c)
            self.refresh_ui()
            win.destroy()
        ttk.Button(win, text='Guardar cambios', command=save).pack(pady=10)
    def delete_song(self):
        sel = self.tree.selection()
        if not sel:
            return
        name = sel[0]
        if messagebox.askyesno('Confirmar','Eliminar canción?'):
            self.song_manager.remove_song(name)
            self.refresh_ui()
    def on_select_song(self, event=None):
        sel = self.tree.selection()
        if not sel:
            self.info_label.config(text='Selecciona una canción')
            self.cover_label.config(text='Sin portada')
            return
        name = sel[0]
        info = self.song_manager.songs.get(name, {})
        tones = ', '.join(info.get('tones',[]))
        best = info.get('best','')
        audio = info.get('audio','')
        cover = info.get('cover','')
        txt = f"{name}\nTonalidades: {tones}\nMejor cantante: {best}\nArchivo: {os.path.basename(audio) if audio else 'N/A'}"
        self.info_label.config(text=txt)
        if cover and PIL_AVAILABLE and os.path.exists(cover):
            img = Image.open(cover)
            img.thumbnail((260,180))
            tkimg = ImageTk.PhotoImage(img)
            self.cover_label.config(image=tkimg, text='')
            self.cover_label.image = tkimg
        else:
            self.cover_label.config(image='', text='Sin portada')
    def play_selected(self):
        sel = self.tree.selection()
        if not sel:
            return
        name = sel[0]
        info = self.song_manager.songs.get(name, {})
        audio = info.get('audio','')
        if audio and os.path.exists(audio):
            try:
                pygame.mixer.music.load(audio)
                pygame.mixer.music.play()
            except Exception as e:
                messagebox.showerror('Error','No se pudo reproducir')
    def pause_resume(self):
        if pygame.mixer.music.get_busy():
            pygame.mixer.music.pause()
        else:
            pygame.mixer.music.unpause()
    def stop(self):
        pygame.mixer.music.stop()
    def open_create_mix(self):
        win = tk.Toplevel(self.root)
        win.title('Crear mix')
        win.geometry('420x480')
        ttk.Label(win, text='Nombre del mix').pack(pady=6)
        name = ttk.Entry(win)
        name.pack(fill='x', padx=12)
        ttk.Label(win, text='Seleccionar canciones').pack(pady=6)
        cvs = ttk.Frame(win)
        cvs.pack(fill='both', expand=True, padx=12)
        vars = []
        for n in self.song_manager.get_songs().keys():
            v = tk.BooleanVar()
            chk = ttk.Checkbutton(cvs, text=n, variable=v)
            chk.pack(anchor='w')
            vars.append((n,v))
        def save():
            nm = name.get().strip()
            if not nm:
                messagebox.showwarning('Atención','Nombre vacío')
                return
            sel = [n for n,v in vars if v.get()]
            if not sel:
                messagebox.showwarning('Atención','Seleccioná al menos una canción')
                return
            self.mix_manager.create_mix(nm, sel)
            self.refresh_ui()
            win.destroy()
        ttk.Button(win, text='Guardar mix', command=save).pack(pady=10)
    def delete_mix(self):
        sel = self.mix_list.curselection()
        if not sel:
            return
        idx = sel[0]
        text = self.mix_list.get(idx)
        name = text.split(':')[0]
        if messagebox.askyesno('Confirmar','Eliminar mix?'):
            self.mix_manager.remove_mix(name)
            self.refresh_ui()
    def export_mix(self):
        sel = self.mix_list.curselection()
        if not sel:
            return
        idx = sel[0]
        text = self.mix_list.get(idx)
        name = text.split(':')[0]
        songs = self.mix_manager.mixes.get(name, [])
        p = filedialog.asksaveasfilename(defaultextension='.m3u', filetypes=[('M3U','*.m3u')])
        if not p:
            return
        with open(p, 'w', encoding='utf-8') as f:
            for s in songs:
                info = self.song_manager.songs.get(s, {})
                a = info.get('audio','')
                if a:
                    f.write(a + '\n')
        messagebox.showinfo('Exportado','Mix exportado')
    def export_mixes(self):
        p = filedialog.asksaveasfilename(defaultextension='.zip', filetypes=[('ZIP','*.zip')])
        if not p:
            return
        messagebox.showinfo('Info','Función de exportar múltiple no implementada aún')
    def save_data(self):
        data = {'songs': self.song_manager.songs, 'mixes': self.mix_manager.mixes, 'logo': self.logo_path}
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        messagebox.showinfo('Guardado','Datos guardados')
    def load_data(self):
        if not os.path.exists(self.data_file):
            return
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.song_manager.songs = data.get('songs',{})
            self.mix_manager.mixes = data.get('mixes',{})
            self.logo_path = data.get('logo')
            if self.logo_path and os.path.exists(self.logo_path) and PIL_AVAILABLE:
                img = Image.open(self.logo_path)
                img.thumbnail((160,120))
                tkimg = ImageTk.PhotoImage(img)
                self.logo_label.config(image=tkimg, text='')
                self.logo_label.image = tkimg
            self.refresh_ui()
        except Exception as e:
            messagebox.showerror('Error','No se pudo cargar datos')
if __name__ == '__main__':
    root = tb.Window(themename='darkly')
    app = App(root)
    root.mainloop()
