import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSongs } from '../contexts/SongsContext';
import { transposeContent, NOTES, getNoteIndex, MAJOR_KEYS, MINOR_KEYS, getSemitonesDifference } from '../lib/transpose';
import { ArrowLeft, Edit, Music, User, Mic, Youtube } from 'lucide-react';
import { LiveBanner } from '../components/LiveBanner';
import { DirectorControls } from '../components/DirectorControls';

function getYouTubeID(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function SongViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { songs } = useSongs();

    const song = songs.find(s => s.id === id);
    const [transpose, setTranspose] = useState(0);

    const transposedContent = useMemo(() => {
        if (!song) return '';
        return transposeContent(song.content, transpose, song.key);
    }, [song, transpose]);

    if (!song) {
        return <div className="p-8 text-center text-text-muted">Canción no encontrada</div>;
    }

    const baseIndex = getNoteIndex(song.key);
    const currentKeyIndex = baseIndex === -1 ? -1 : (baseIndex + transpose) % 12;
    const currentKey = currentKeyIndex === -1 ? '?' : NOTES[currentKeyIndex < 0 ? currentKeyIndex + 12 : currentKeyIndex];

    return (
        <div className="bg-background min-h-screen pb-24 font-sans text-text-main">
            {/* Header Sticky */}
            <div className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3 flex justify-between items-center shadow-lg backdrop-blur-xl">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex gap-2">
                    {/* Transpose Controls */}
                    <div className="flex items-center bg-surface rounded-lg overflow-hidden border border-white/10">
                        <select
                            value={currentKey}
                            onChange={(e) => {
                                const newKey = e.target.value;
                                const diff = getSemitonesDifference(song.key, newKey);
                                setTranspose(diff);
                            }}
                            className="bg-transparent text-secondary font-bold text-lg py-1 px-3 appearance-none cursor-pointer focus:outline-none text-center min-w-[3rem]"
                        >
                            <optgroup label="Mayores">
                                {MAJOR_KEYS.map(k => <option key={k} value={k} className="bg-surface text-text-main">{k}</option>)}
                            </optgroup>
                            <optgroup label="Menores">
                                {MINOR_KEYS.map(k => <option key={k} value={k} className="bg-surface text-text-main">{k}</option>)}
                            </optgroup>
                        </select>
                        <div className="border-l border-white/10 px-2 pointer-events-none">
                            <span className="text-[10px] text-text-muted">key</span>
                        </div>
                    </div>
                    {song.youtubeUrl && (
                        <a
                            href={song.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Ver en YouTube"
                        >
                            <Youtube size={24} />
                        </a>
                    )}
                    <Link to={`/edit/${song.id}`} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-main transition-colors">
                        <Edit size={20} />
                    </Link>
                </div>
            </div>

            <div className="p-6 max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-text-main to-text-muted bg-clip-text text-transparent">{song.title}</h1>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-text-muted text-sm">
                        <span className="flex items-center gap-1"><User size={14} /> {song.artist}</span>
                        {song.bpm && <span className="flex items-center gap-1"><Music size={14} /> {song.bpm} BPM</span>}
                    </div>
                    {song.bestSinger && (
                        <div className="mt-4 inline-flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            <Mic size={12} /> Sugerido: {song.bestSinger}
                        </div>
                    )}
                </div>

                <div className="whitespace-pre-wrap font-mono text-lg leading-loose text-text-main song-content">
                    {transposedContent.split('\n').map((line, i) => {
                        // Line contains chords if it has brackets
                        const hasChords = line.includes('[');

                        if (hasChords) {
                            const parts = line.split(/(\[.*?\])/g);
                            return (
                                <div key={i} className="min-h-[2em] relative mb-1">
                                    {parts.map((part, j) => {
                                        if (part.startsWith('[') && part.endsWith(']')) {
                                            return (
                                                <span key={j} className="text-secondary font-bold text-base inline-block px-1 rounded -translate-y-3 transform">
                                                    {part.replace(/[\[\]]/g, '')}
                                                </span>
                                            );
                                        }
                                        return <span key={j} className="text-text-main">{part}</span>;
                                    })}
                                </div>
                            );
                        }

                        return (
                            <div key={i} className="min-h-[1.5em] mb-1">
                                {line}
                            </div>
                        );
                    })}
                </div>

                {song.youtubeUrl && (
                    <div className="mt-12 mb-8 border-t border-white/10 pt-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Youtube className="text-red-500" />
                            Referencia
                        </h3>
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 shadow-2xl">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${getYouTubeID(song.youtubeUrl)}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <p className="text-xs text-text-muted mt-2 text-center">
                            Video reproducido desde YouTube (No alojado en la app)
                        </p>
                    </div>
                )}
            </div>

            {/* Floating Transpose Reset if modified */}
            {
                transpose !== 0 && (
                    <button
                        onClick={() => setTranspose(0)}
                        className="fixed bottom-24 right-6 bg-accent text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-fade-in"
                    >
                        Restablecer Tono
                    </button>
                )
            }
            {/* Live Session Overlays */}
            <LiveBanner />
            <DirectorControls />
        </div >
    );
}
