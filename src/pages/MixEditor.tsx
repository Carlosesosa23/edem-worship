import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMixes } from '../contexts/MixesContext';
import { useSongs } from '../contexts/SongsContext';
import { Save, ArrowLeft, Plus, X, Search, Check } from 'lucide-react';

import { clsx } from 'clsx';

export function MixEditor() {
    const navigate = useNavigate();
    const { addMix } = useMixes();
    const { songs } = useSongs();

    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [isSelecting, setIsSelecting] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addMix({
                title,
                date: new Date(date).getTime(),
                songs: selectedSongIds,
                description: ''
            });
            navigate('/mixes');
        } catch (error) {
            alert('Error al guardar el mix');
        } finally {
            setLoading(false);
        }
    };

    const toggleSong = (id: string) => {
        if (selectedSongIds.includes(id)) {
            setSelectedSongIds(prev => prev.filter(s => s !== id));
        } else {
            setSelectedSongIds(prev => [...prev, id]);
        }
    };

    const filteredSongs = songs.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-background min-h-screen text-text-main pb-24 font-sans">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3 flex items-center gap-4 shadow-lg backdrop-blur-xl mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                    Nuevo Mix
                </h2>
            </div>

            <div className="p-4 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">Título del Servicio</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ej. Domingo de Resurrección"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">Fecha</label>
                        <input
                            type="date"
                            required
                            className="input-field [color-scheme:dark]"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3 px-1">
                            <label className="block text-sm font-medium text-text-muted">Canciones ({selectedSongIds.length})</label>
                            <button
                                type="button"
                                onClick={() => setIsSelecting(!isSelecting)}
                                className="text-sm text-secondary hover:text-white font-bold flex items-center gap-1 transition-colors"
                            >
                                <Plus size={16} /> Agregar Canciones
                            </button>
                        </div>

                        {/* Selected Songs List */}
                        <div className="space-y-2">
                            {selectedSongIds.map((id, index) => {
                                const song = songs.find(s => s.id === id);
                                if (!song) return null;
                                return (
                                    <div key={id} className="glass-panel p-3 rounded-xl flex justify-between items-center border border-white/5 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-surface-highlight flex items-center justify-center text-xs font-bold text-text-muted">
                                                {index + 1}
                                            </div>
                                            <span className="font-medium text-text-main">{song.title}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSongIds(prev => prev.filter(s => s !== id))}
                                            className="text-text-muted hover:text-accent p-2 rounded-full hover:bg-white/5 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                            {selectedSongIds.length === 0 && (
                                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-text-muted text-sm">
                                    No hay canciones seleccionadas
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Song Selector Modal */}
                    {isSelecting && (
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col p-4 animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-text-main">Seleccionar Canciones</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsSelecting(false)}
                                    className="p-2 bg-surface rounded-full hover:bg-surface-highlight transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="input-field pl-16"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pb-20">
                                {filteredSongs.map(song => {
                                    const isSelected = selectedSongIds.includes(song.id);
                                    return (
                                        <button
                                            key={song.id}
                                            type="button"
                                            onClick={() => toggleSong(song.id)}
                                            className={clsx(
                                                "w-full text-left p-4 rounded-xl transition-all border flex items-center justify-between group",
                                                isSelected
                                                    ? "bg-secondary/10 border-secondary text-white"
                                                    : "bg-surface border-white/5 text-text-muted hover:bg-surface-highlight"
                                            )}
                                        >
                                            <div>
                                                <div className={clsx("font-bold", isSelected && "text-secondary")}>{song.title}</div>
                                                <div className="text-xs opacity-70">{song.artist} • {song.key}</div>
                                            </div>
                                            {isSelected && <Check size={20} className="text-secondary" />}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="fixed bottom-4 left-4 right-4">
                                <button
                                    type="button"
                                    onClick={() => setIsSelecting(false)}
                                    className="w-full bg-secondary text-white py-3 rounded-xl font-bold shadow-lg shadow-secondary/20"
                                >
                                    Listo ({selectedSongIds.length})
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        {loading ? 'Guardando...' : 'Guardar Mix'}
                    </button>
                </form>
            </div>
        </div>
    );
}
