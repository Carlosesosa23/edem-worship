import { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMixes } from '../contexts/MixesContext';
import { useSongs } from '../contexts/SongsContext';
import { ArrowLeft, Calendar, Music, List, Trash2, Radio, Palette, X, Edit, Share2, Copy, Check } from 'lucide-react';
import { MixSongItem } from '../components/MixSongItem';
import { LiveBanner } from '../components/LiveBanner';
import { DirectorControls } from '../components/DirectorControls';
import { NowPlayingBar } from '../components/NowPlayingBar';
import { useLiveSession, SINGER_COLORS } from '../contexts/LiveSessionContext';
import { useShareMix } from '../hooks/useShareMix';
import { cn } from '../lib/utils';

export function MixViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { mixes, deleteMix } = useMixes();
    const { songs } = useSongs();
    const { liveState, isDirector, clearVoiceAssignments } = useLiveSession();

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Voice assignment mode — director only
    const [voiceMode, setVoiceMode] = useState(false);
    const [activeSinger, setActiveSinger] = useState<string | null>(null);

    // Share mix
    const { share: shareMix, status: shareStatus } = useShareMix();

    const mix = mixes.find(m => m.id === id);

    if (!mix) {
        return <div className="p-8 text-center text-text-muted">Mix no encontrado</div>;
    }

    const mixSongs = mix.songs.map(songId => songs.find(s => s.id === songId)).filter(Boolean);

    const scrollToSong = (songId: string) => {
        const element = document.getElementById(`song-${songId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="bg-background min-h-screen text-text-main pb-32 font-sans" ref={scrollContainerRef}>
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 glass-panel border-b border-white/5 shadow-2xl backdrop-blur-xl">
                <NowPlayingBar />

                <div className="px-4 py-3">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold truncate">{mix.title}</h2>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                                <Calendar size={12} />
                                <span>{new Date(mix.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Voice assignment toggle — director only */}
                            {isDirector && (
                                <button
                                    onClick={() => { setVoiceMode(v => !v); setActiveSinger(null); }}
                                    className={cn(
                                        'p-2 rounded-lg transition-colors',
                                        voiceMode
                                            ? 'bg-primary text-white'
                                            : 'text-text-muted hover:text-text-main hover:bg-white/10'
                                    )}
                                    title="Asignar voces por línea"
                                >
                                    <Palette size={20} />
                                </button>
                            )}

                            {/* Compartir repertorio */}
                            <button
                                onClick={() => shareMix(mix, songs)}
                                title={shareStatus === 'copied' ? '¡Copiado!' : shareStatus === 'shared' ? '¡Compartido!' : 'Compartir repertorio'}
                                className={cn(
                                    'p-2 rounded-lg transition-all',
                                    shareStatus === 'idle'
                                        ? 'text-text-muted hover:text-white hover:bg-white/10'
                                        : 'text-green-400 bg-green-500/15'
                                )}
                            >
                                {shareStatus === 'copied' || shareStatus === 'shared' ? (
                                    <Check size={20} />
                                ) : (
                                    'share' in navigator ? <Share2 size={20} /> : <Copy size={20} />
                                )}
                            </button>

                            {/* Edit button */}
                            <Link
                                to={`/mixes/edit/${mix.id}`}
                                className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-main transition-colors"
                                title="Editar mix"
                            >
                                <Edit size={20} />
                            </Link>
                            <button
                                onClick={async () => {
                                    if (window.confirm('¿Estás seguro que deseas ELIMINAR este mix permanentemente?')) {
                                        try {
                                            await deleteMix(mix.id);
                                            navigate('/mixes');
                                        } catch {
                                            alert('Error al eliminar');
                                        }
                                    }
                                }}
                                className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-500 rounded-lg transition-colors"
                                title="Eliminar mix"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Jump Bar */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 mask-fade-right">
                        {mixSongs.map((song, idx) => song && (
                            <button
                                key={song.id}
                                onClick={() => scrollToSong(song.id)}
                                className={cn(
                                    'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5',
                                    liveState.activeSongId === song.id
                                        ? 'bg-primary text-white border-2 border-white/40 shadow-lg shadow-primary/40 ring-2 ring-primary/50 animate-pulse'
                                        : 'bg-surface/50 border border-white/10 hover:bg-primary/20 hover:border-primary/30'
                                )}
                            >
                                {liveState.activeSongId === song.id && (
                                    <Radio size={10} className="flex-shrink-0" />
                                )}
                                <span className={cn('font-bold mr-0.5', liveState.activeSongId === song.id ? 'text-white/80' : 'text-secondary')}>
                                    {idx + 1}.
                                </span>
                                {song.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Voice Assignment Toolbar — director only, visible when voiceMode is on */}
                {isDirector && voiceMode && (
                    <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-text-muted font-semibold uppercase tracking-widest mr-1">Asignar a:</span>
                        {SINGER_COLORS.map(s => (
                            <button
                                key={s.key}
                                onClick={() => setActiveSinger(prev => prev === s.key ? null : s.key)}
                                className={cn(
                                    'px-3 py-1 rounded-full text-xs font-bold text-white transition-all active:scale-95',
                                    s.bg,
                                    activeSinger === s.key
                                        ? 'ring-2 ring-white scale-105 shadow-lg'
                                        : 'opacity-70 hover:opacity-100'
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                        <button
                            onClick={clearVoiceAssignments}
                            className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Limpiar todas las asignaciones"
                        >
                            <X size={14} /> Limpiar todo
                        </button>
                        <p className="w-full text-[10px] text-text-muted mt-0.5">
                            {activeSinger
                                ? 'Toca una línea para asignarla · Toca de nuevo para quitar'
                                : 'Selecciona un cantante para empezar a asignar líneas'}
                        </p>
                    </div>
                )}
            </div>

            <div className="p-4 max-w-2xl mx-auto space-y-12">
                {mixSongs.map((song, index) => {
                    if (!song) return null;
                    return (
                        <MixSongItem
                            key={`${mix.id}-${song.id}-${index}`}
                            song={song}
                            index={index}
                            voiceMode={voiceMode}
                            activeSinger={activeSinger}
                        />
                    );
                })}

                {mixSongs.length === 0 && (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                            <Music className="text-text-muted opacity-50" size={32} />
                        </div>
                        <p className="text-text-muted mb-4">Este mix está vacío.</p>
                        <Link to={`/mixes/edit/${mix.id}`} className="btn-primary inline-flex items-center gap-2">
                            <List size={18} />
                            Editar Repertorio
                        </Link>
                    </div>
                )}

                {mixSongs.length > 0 && (
                    <div className="text-center pt-12 pb-8 border-t border-white/5">
                        <p className="text-text-muted text-sm italic">Fin del servicio</p>
                    </div>
                )}
            </div>

            {/* Live Session Overlays */}
            <LiveBanner />
            <DirectorControls />
        </div>
    );
}
