import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMixes } from '../contexts/MixesContext';
import { useSongs } from '../contexts/SongsContext';
import { ArrowLeft, Calendar, Music, List, Trash2 } from 'lucide-react';
import { MixSongItem } from '../components/MixSongItem';
import { Link } from 'react-router-dom';
import { LiveBanner } from '../components/LiveBanner';
import { DirectorControls } from '../components/DirectorControls';

export function MixViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { mixes, deleteMix } = useMixes();
    const { songs } = useSongs();

    // Create Refs for quick scrolling
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
            <div className="sticky top-0 z-30 glass-panel border-b border-white/5 px-4 py-3 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold truncate">
                            {mix.title}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                            <Calendar size={12} />
                            <span>{new Date(mix.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            if (window.confirm('¿Estás seguro que deseas ELIMINAR este mix permanentemente?')) {
                                try {
                                    await deleteMix(mix.id);
                                    navigate('/mixes');
                                } catch (error) {
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

                {/* Quick Jump Bar */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 mask-fade-right">
                    {mixSongs.map((song, idx) => song && (
                        <button
                            key={song.id}
                            onClick={() => scrollToSong(song.id)}
                            className="flex-shrink-0 bg-surface/50 border border-white/10 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap hover:bg-primary/20 hover:border-primary/30 transition-all active:scale-95"
                        >
                            <span className="text-secondary font-bold mr-1">{idx + 1}.</span>
                            {song.title}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto space-y-12">
                {mixSongs.map((song, index) => {
                    if (!song) return null;
                    return (
                        <MixSongItem
                            key={`${mix.id}-${song.id}-${index}`}
                            song={song}
                            index={index}
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
        </div >
    );
}
