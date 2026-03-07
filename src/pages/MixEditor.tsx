import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMixes } from '../contexts/MixesContext';
import { useSongs } from '../contexts/SongsContext';
import { Save, ArrowLeft, Plus, X, Search, Check, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

export function MixEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addMix, updateMix, mixes } = useMixes();
    const { songs } = useSongs();

    const isEditing = Boolean(id);
    const existingMix = id ? mixes.find(m => m.id === id) : null;

    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [isSelecting, setIsSelecting] = useState(false);
    const [loading, setLoading] = useState(false);

    // Populate form when editing an existing mix
    useEffect(() => {
        if (existingMix) {
            setTitle(existingMix.title);
            setDate(new Date(existingMix.date).toISOString().substring(0, 10));
            setSelectedSongIds([...existingMix.songs]);
        }
    }, [existingMix?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                title,
                date: new Date(date).getTime(),
                songs: selectedSongIds,
                description: existingMix?.description ?? '',
            };

            if (isEditing && id) {
                await updateMix(id, payload);
                navigate(`/mixes/${id}`, { replace: true });
            } else {
                const newId = await addMix(payload);
                navigate(`/mixes/${newId}`, { replace: true });
            }
        } catch {
            alert('Error al guardar el mix');
        } finally {
            setLoading(false);
        }
    };

    const toggleSong = (songId: string) => {
        if (selectedSongIds.includes(songId)) {
            setSelectedSongIds(prev => prev.filter(s => s !== songId));
        } else {
            setSelectedSongIds(prev => [...prev, songId]);
        }
    };

    // ── Reorder helpers ──────────────────────────────────────────────────────
    const moveSong = (index: number, direction: 'up' | 'down') => {
        const newList = [...selectedSongIds];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= newList.length) return;
        [newList[index], newList[target]] = [newList[target], newList[index]];
        setSelectedSongIds(newList);
    };

    const removeSong = (songId: string) => {
        setSelectedSongIds(prev => prev.filter(s => s !== songId));
    };

    const filteredSongs = songs.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-background min-h-screen text-text-main pb-24 font-sans">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3 flex items-center gap-4 shadow-lg backdrop-blur-xl mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                    {isEditing ? 'Editar Mix' : 'Nuevo Mix'}
                </h2>
            </div>

            <div className="p-4 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">
                            Título del Servicio
                        </label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ej. Domingo de Resurrección"
                        />
                    </div>

                    {/* Date */}
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

                    {/* Songs section */}
                    <div>
                        <div className="flex justify-between items-center mb-3 px-1">
                            <label className="block text-sm font-medium text-text-muted">
                                Canciones ({selectedSongIds.length})
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsSelecting(true)}
                                className="text-sm text-secondary hover:text-white font-bold flex items-center gap-1 transition-colors"
                            >
                                <Plus size={16} /> Agregar Canciones
                            </button>
                        </div>

                        {/* Selected songs list — with reorder controls */}
                        <div className="space-y-2">
                            {selectedSongIds.length === 0 ? (
                                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-text-muted text-sm">
                                    No hay canciones seleccionadas
                                </div>
                            ) : (
                                selectedSongIds.map((songId, index) => {
                                    const song = songs.find(s => s.id === songId);
                                    if (!song) return null;
                                    return (
                                        <div
                                            key={songId}
                                            className="glass-panel rounded-xl border border-white/5 flex items-center gap-2 px-3 py-2.5 group"
                                        >
                                            {/* Drag handle visual (decorative) */}
                                            <GripVertical
                                                size={16}
                                                className="text-white/20 flex-shrink-0 group-hover:text-white/40 transition-colors"
                                            />

                                            {/* Position number */}
                                            <span className="w-6 h-6 rounded-full bg-surface-highlight flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
                                                {index + 1}
                                            </span>

                                            {/* Song info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-text-main truncate">{song.title}</p>
                                                <p className="text-xs text-text-muted truncate">
                                                    {song.artist}
                                                    <span className="ml-1.5 font-mono text-secondary">{song.key}</span>
                                                </p>
                                            </div>

                                            {/* Reorder buttons */}
                                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => moveSong(index, 'up')}
                                                    disabled={index === 0}
                                                    className={cn(
                                                        'p-1 rounded transition-colors',
                                                        index === 0
                                                            ? 'text-white/10 cursor-not-allowed'
                                                            : 'text-text-muted hover:text-white hover:bg-white/10'
                                                    )}
                                                    title="Mover arriba"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveSong(index, 'down')}
                                                    disabled={index === selectedSongIds.length - 1}
                                                    className={cn(
                                                        'p-1 rounded transition-colors',
                                                        index === selectedSongIds.length - 1
                                                            ? 'text-white/10 cursor-not-allowed'
                                                            : 'text-text-muted hover:text-white hover:bg-white/10'
                                                    )}
                                                    title="Mover abajo"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                type="button"
                                                onClick={() => removeSong(songId)}
                                                className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                                                title="Quitar canción"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Save button */}
                    <button
                        type="submit"
                        disabled={loading || !title.trim()}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Save size={20} />
                        {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Mix'}
                    </button>
                </form>
            </div>

            {/* Song Selector Modal */}
            {isSelecting && (
                <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex flex-col p-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-text-main">Seleccionar Canciones</h3>
                        <button
                            type="button"
                            onClick={() => { setIsSelecting(false); setSearch(''); }}
                            className="p-2 bg-surface rounded-full hover:bg-surface-highlight transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por título o artista..."
                            className="input-field pl-12"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pb-24">
                        {filteredSongs.map(song => {
                            const isSelected = selectedSongIds.includes(song.id);
                            return (
                                <button
                                    key={song.id}
                                    type="button"
                                    onClick={() => toggleSong(song.id)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl transition-all border flex items-center justify-between",
                                        isSelected
                                            ? "bg-secondary/10 border-secondary"
                                            : "bg-surface border-white/5 hover:bg-surface-highlight"
                                    )}
                                >
                                    <div className="min-w-0">
                                        <p className={cn("font-bold truncate", isSelected ? "text-secondary" : "text-text-main")}>
                                            {song.title}
                                        </p>
                                        <p className="text-xs text-text-muted truncate">
                                            {song.artist}
                                            <span className="ml-1.5 font-mono">{song.key}</span>
                                        </p>
                                    </div>
                                    {isSelected && <Check size={20} className="text-secondary flex-shrink-0 ml-3" />}
                                </button>
                            );
                        })}

                        {filteredSongs.length === 0 && (
                            <p className="text-center text-text-muted py-10 text-sm">
                                No se encontraron canciones
                            </p>
                        )}
                    </div>

                    <div className="fixed bottom-4 left-4 right-4">
                        <button
                            type="button"
                            onClick={() => { setIsSelecting(false); setSearch(''); }}
                            className="w-full bg-secondary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-secondary/20 text-base"
                        >
                            Listo — {selectedSongIds.length} {selectedSongIds.length === 1 ? 'canción' : 'canciones'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
