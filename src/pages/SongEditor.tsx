import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSongs } from '../contexts/SongsContext';
import { Save, ArrowLeft } from 'lucide-react';

export function SongEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addSong, songs } = useSongs();

    const existingSong = id ? songs.find(s => s.id === id) : null;

    const [title, setTitle] = useState(existingSong?.title || '');
    const [artist, setArtist] = useState(existingSong?.artist || '');
    const [key, setKey] = useState(existingSong?.key || 'C');
    const [bpm, setBpm] = useState<number | ''>(existingSong?.bpm || '');
    const [content, setContent] = useState(existingSong?.content || '');
    const [bestSinger, setBestSinger] = useState(existingSong?.bestSinger || '');
    const [youtubeUrl, setYoutubeUrl] = useState(existingSong?.youtubeUrl || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addSong({
                title,
                artist,
                key,
                bpm: Number(bpm) || undefined,
                content,
                bestSinger,
                youtubeUrl: youtubeUrl || undefined,
                addedBy: 'User' // TODO: Replace with auth user
            });
            navigate('/songs');
        } catch (error) {
            console.error(error);
            alert('Error al guardar la canción');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background min-h-screen text-text-main pb-24 font-sans">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3 flex items-center gap-4 shadow-lg backdrop-blur-xl mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {id ? 'Editar Canción' : 'Nueva Canción'}
                </h2>
            </div>

            <div className="p-4 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">Título</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ej. Sublime Gracia"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">Artista</label>
                            <input
                                type="text"
                                className="input-field"
                                value={artist}
                                onChange={e => setArtist(e.target.value)}
                                placeholder="Ej. Phil Wickham"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">Tono (Key)</label>
                            <select
                                className="input-field appearance-none cursor-pointer"
                                value={key}
                                onChange={e => setKey(e.target.value)}
                            >
                                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                                    <option key={k} value={k} className="bg-surface text-text-main">{k}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">BPM</label>
                            <input
                                type="number"
                                className="input-field"
                                value={bpm}
                                onChange={e => setBpm(Number(e.target.value))}
                                placeholder="Ej. 72"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">Voz Sugerida</label>
                            <input
                                type="text"
                                className="input-field"
                                value={bestSinger}
                                onChange={e => setBestSinger(e.target.value)}
                                placeholder="Ej. Ana"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">Link de YouTube (Opcional)</label>
                        <input
                            type="url"
                            className="input-field text-sm"
                            value={youtubeUrl}
                            onChange={e => setYoutubeUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">
                            Letra y Acordes
                            <span className="text-xs text-text-muted/60 ml-2">(Usa corchetes [C] o líneas separadas)</span>
                        </label>
                        <textarea
                            className="input-field h-64 font-mono text-sm leading-relaxed resize-none"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder={"[C] Sublime gracia [F] del Señor\n[C] Que a un infeliz [G] salvó"}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        {loading ? 'Guardando...' : 'Guardar Canción'}
                    </button>
                </form>
            </div>
        </div>
    );
}
