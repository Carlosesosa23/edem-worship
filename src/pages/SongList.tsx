import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSongs } from '../contexts/SongsContext';
import { Search, Loader2, Music } from 'lucide-react';

export function SongList() {
    const { songs, loading } = useSongs();
    const [search, setSearch] = useState('');

    const filteredSongs = songs.filter(song =>
        song.title.toLowerCase().includes(search.toLowerCase()) ||
        song.artist.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-24">
            {/* Sticky Search Header */}
            <div className="sticky top-0 bg-background/80 backdrop-blur-md pt-4 pb-4 z-10 -mx-4 px-4 md:static md:bg-transparent md:p-0">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar canción por título o artista..."
                        className="input-field pl-16"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                    <Loader2 className="animate-spin mb-4 text-primary" size={40} />
                    <p>Cargando repertorio...</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filteredSongs.map(song => (
                        <Link
                            key={song.id}
                            to={`/songs/${song.id}`}
                            className="glass-panel p-4 rounded-xl flex items-center justify-between group hover:bg-white/5 transition-all active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-surface-highlight flex items-center justify-center text-text-muted group-hover:text-primary transition-colors shrink-0">
                                    <Music size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg text-text-main truncate pr-2">{song.title}</h3>
                                    <p className="text-sm text-text-muted truncate">{song.artist}</p>
                                </div>
                            </div>

                            <div className="bg-surface border border-white/5 px-3 py-1 rounded-lg text-sm font-mono text-secondary font-bold shrink-0">
                                {song.key}
                            </div>
                        </Link>
                    ))}

                    {filteredSongs.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <div className="bg-surface w-16 h-16 rounded-full flex items-center justify-center text-text-muted mx-auto mb-4">
                                <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-text-main">No se encontraron canciones</h3>
                            <p className="text-text-muted">Intenta con otro término de búsqueda</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
