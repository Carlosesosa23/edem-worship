import { Link } from 'react-router-dom';
import { useSongs } from '../contexts/SongsContext';
import { useMixes } from '../contexts/MixesContext';
import { useLiveSession } from '../contexts/LiveSessionContext';
import { Music, Disc, Plus, Calendar, ArrowRight, Mic2 } from 'lucide-react';

export function HomePage() {
    const { songs } = useSongs();
    const { mixes } = useMixes();
    const { isDirector, toggleDirectorMode } = useLiveSession();

    const recentSongs = [...songs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
    const upcomingMix = mixes[0]; // Assuming sorted by date desc, but typically we'd filter for future dates

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Hola, Músico
                    </h1>
                    <p className="text-text-muted mt-1">¿Qué vamos a tocar hoy?</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={toggleDirectorMode}
                        className={`p-2 rounded-xl transition-all ${isDirector ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface hover:bg-white/5 text-text-muted'}`}
                        title={isDirector ? "Desactivar Modo Director" : "Activar Modo Director"}
                    >
                        <Mic2 size={20} />
                    </button>
                    <Link to="/songs/add" className="btn-primary flex items-center gap-2 text-sm">
                        <Plus size={18} />
                        <span className="hidden sm:inline">Nueva Canción</span>
                    </Link>
                </div>
            </div>

            {/* Quick Stats / Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/songs" className="glass-panel p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="bg-primary/20 w-10 h-10 rounded-full flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                        <Music size={20} />
                    </div>
                    <div className="text-2xl font-bold">{songs.length}</div>
                    <div className="text-xs text-text-muted">Canciones</div>
                </Link>

                <Link to="/mixes" className="glass-panel p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="bg-secondary/20 w-10 h-10 rounded-full flex items-center justify-center text-secondary mb-3 group-hover:scale-110 transition-transform">
                        <Disc size={20} />
                    </div>
                    <div className="text-2xl font-bold">{mixes.length}</div>
                    <div className="text-xs text-text-muted">Mixes</div>
                </Link>

                <Link to="/mixes/add" className="glass-panel p-4 rounded-2xl hover:bg-white/5 transition-colors group col-span-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-accent/20 w-10 h-10 rounded-full flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                            <Plus size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold">Crear Nuevo Mix</div>
                            <div className="text-xs text-text-muted">Preparar servicio dominical</div>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-text-muted" />
                </Link>
            </div>

            {/* Featured Section: Upcoming Mix or Recent Songs */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Songs */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Recientes</h2>
                        <Link to="/songs" className="text-xs text-primary hover:underline">Ver todas</Link>
                    </div>
                    <div className="space-y-3">
                        {recentSongs.map(song => (
                            <Link key={song.id} to={`/songs/${song.id}`} className="glass-panel p-3 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="bg-surface-highlight w-10 h-10 rounded-lg flex items-center justify-center text-text-muted font-bold text-sm">
                                    {song.key}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{song.title}</div>
                                    <div className="text-xs text-text-muted truncate">{song.artist}</div>
                                </div>
                            </Link>
                        ))}
                        {recentSongs.length === 0 && (
                            <div className="text-center py-8 text-text-muted text-sm">No hay canciones recientes.</div>
                        )}
                    </div>
                </div>

                {/* Next Mix Teaser */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Próximo Evento</h2>
                    {upcomingMix ? (
                        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-secondary relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Calendar size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-sm text-secondary font-bold mb-1 uppercase tracking-wider">Próximo Mix</div>
                                <h3 className="text-2xl font-bold mb-2">{upcomingMix.title}</h3>
                                <p className="text-text-muted mb-6 flex items-center gap-2">
                                    <Calendar size={16} />
                                    {new Date(upcomingMix.date).toLocaleDateString()}
                                </p>
                                <Link to={`/mixes/${upcomingMix.id}`} className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2">
                                    Ver Repertorio <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-white/10">
                            <div className="bg-surface w-16 h-16 rounded-full flex items-center justify-center text-text-muted">
                                <Calendar size={32} />
                            </div>
                            <div>
                                <p className="font-medium">No hay mixes próximos</p>
                                <p className="text-xs text-text-muted mt-1">Crea uno para organizar el servicio</p>
                            </div>
                            <Link to="/mixes/add" className="text-primary text-sm font-bold hover:underline">
                                Crear Mix
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
