import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSongs } from '../contexts/SongsContext';
import { transposeContent, MAJOR_KEYS, MINOR_KEYS, getSemitonesDifference } from '../lib/transpose';
import { ArrowLeft, Edit, Music, User, Mic, Youtube, Trash2, Palette, X, Share2, Copy, Check, Timer } from 'lucide-react';
import { LiveBanner } from '../components/LiveBanner';
import { DirectorControls } from '../components/DirectorControls';
import { Metronome } from '../components/Metronome';
import { useLiveSession, SINGER_COLORS } from '../contexts/LiveSessionContext';
import { cn } from '../lib/utils';
import { useShareSong } from '../hooks/useShareSong';

function getYouTubeID(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function SongViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { songs, deleteSong } = useSongs();
    const { isDirector, liveState, assignSingerToLines, clearVoiceAssignments } = useLiveSession();

    const song = songs.find(s => s.id === id);

    const [selectedKey, setSelectedKey] = useState(song?.key || 'C');

    // Director voice assignment mode
    const [voiceMode, setVoiceMode] = useState(false);
    const [activeSinger, setActiveSinger] = useState<string | null>(null);
    // Lines selected in current drag/tap gesture (director only)
    const [pendingLines, setPendingLines] = useState<Set<number>>(new Set());

    // Metronome panel
    const [metronomeOpen, setMetronomeOpen] = useState(false);

    // Share / copy
    const { share, status: shareStatus } = useShareSong();

    const transposedContent = useMemo(() => {
        if (!song) return '';
        const semitones = getSemitonesDifference(song.key, selectedKey);
        if (semitones === 0) return song.content;
        return transposeContent(song.content, semitones, song.key);
    }, [song, selectedKey]);

    if (!song) {
        return <div className="p-8 text-center text-text-muted">Canción no encontrada</div>;
    }

    const isTransposed = selectedKey !== song.key;
    const voiceAssignments = liveState.voiceAssignments ?? {};

    // ── Director: toggle a line assignment ──────────────────────────────────
    const handleLineClick = (lineIdx: number) => {
        if (!isDirector || !voiceMode || activeSinger === null) return;
        const current = voiceAssignments[String(lineIdx)];
        // If line already has this singer → remove it; else assign
        const newKey = current === activeSinger ? null : activeSinger;
        assignSingerToLines([lineIdx], newKey);
    };

    // ── Render a single content line ─────────────────────────────────────────
    const renderLine = (line: string, lineIdx: number) => {
        const singerKey = voiceAssignments[String(lineIdx)];
        const singerCfg = singerKey ? SINGER_COLORS.find(s => s.key === singerKey) : null;

        // Highlight style for this line
        const highlightClass = singerCfg ? singerCfg.light : '';
        const borderClass = singerCfg ? `border-l-4 ${singerCfg.border}` : 'border-l-4 border-transparent';

        // Director interaction classes
        const interactiveClass = (isDirector && voiceMode && activeSinger !== null)
            ? 'cursor-pointer hover:opacity-80 select-none'
            : '';

        const hasChords = line.includes('[');

        if (hasChords) {
            const parts = line.split(/(\[[^\]]*\])/g);
            type Segment = { chord: string; text: string };
            const segments: Segment[] = [];
            let idx = 0;
            while (idx < parts.length) {
                const part = parts[idx];
                if (part.startsWith('[') && part.endsWith(']')) {
                    const chord = part.replace(/[\[\]]/g, '');
                    const text = parts[idx + 1] ?? '';
                    segments.push({ chord, text });
                    idx += 2;
                } else {
                    if (part !== '') segments.push({ chord: '', text: part });
                    idx += 1;
                }
            }

            return (
                <div
                    key={lineIdx}
                    onClick={() => handleLineClick(lineIdx)}
                    className={cn(
                        'flex flex-wrap items-end mb-2 px-2 py-0.5 rounded-r-lg transition-all',
                        highlightClass,
                        borderClass,
                        interactiveClass,
                        pendingLines.has(lineIdx) && 'opacity-60'
                    )}
                >
                    {/* Singer badge */}
                    {singerCfg && (
                        <span className={cn(
                            'self-center mr-2 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full leading-none',
                            singerCfg.bg, 'text-white'
                        )}>
                            {singerCfg.label}
                        </span>
                    )}
                    {segments.map((seg, j) => (
                        <span key={j} className="inline-flex flex-col items-start mr-0.5">
                            <span className={cn(
                                'font-bold text-sm leading-none mb-1',
                                singerCfg ? singerCfg.text : 'text-secondary',
                                !seg.chord && 'invisible'
                            )}>
                                {seg.chord || '\u00A0'}
                            </span>
                            <span className="text-text-main text-lg leading-none whitespace-pre">
                                {seg.text || '\u00A0'}
                            </span>
                        </span>
                    ))}
                </div>
            );
        }

        return (
            <div
                key={lineIdx}
                onClick={() => handleLineClick(lineIdx)}
                className={cn(
                    'mb-2 px-2 py-0.5 rounded-r-lg text-lg leading-normal transition-all flex items-center gap-2',
                    highlightClass,
                    borderClass,
                    interactiveClass
                )}
            >
                {singerCfg && (
                    <span className={cn(
                        'flex-shrink-0 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full leading-none',
                        singerCfg.bg, 'text-white'
                    )}>
                        {singerCfg.label}
                    </span>
                )}
                <span>{line || '\u00A0'}</span>
            </div>
        );
    };

    return (
        <div className="bg-background min-h-screen pb-24 font-sans text-text-main">
            {/* Header Sticky */}
            <div className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3 flex justify-between items-center shadow-lg backdrop-blur-xl">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex gap-2 items-center">
                    {/* Transpose Controls */}
                    <div className="flex items-center bg-surface rounded-lg overflow-hidden border border-white/10">
                        <select
                            value={selectedKey}
                            onChange={(e) => setSelectedKey(e.target.value)}
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

                    {/* Voice assignment toggle — director only */}
                    {isDirector && (
                        <button
                            onClick={() => { setVoiceMode(v => !v); setActiveSinger(null); setPendingLines(new Set()); }}
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

                    {/* Metrónomo */}
                    <button
                        onClick={() => setMetronomeOpen(o => !o)}
                        title="Metrónomo"
                        className={cn(
                            'p-2 rounded-lg transition-all',
                            metronomeOpen
                                ? 'bg-primary/20 text-primary'
                                : 'text-text-muted hover:text-text-main hover:bg-white/10'
                        )}
                    >
                        <Timer size={20} />
                    </button>

                    {/* Compartir / Copiar canción */}
                    <button
                        onClick={() => share(song, selectedKey)}
                        title={shareStatus === 'copied' ? '¡Copiado!' : shareStatus === 'shared' ? '¡Compartido!' : 'Compartir canción'}
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
                            // Muestra Share2 si el dispositivo soporta Web Share API, Copy si no
                            'share' in navigator ? <Share2 size={20} /> : <Copy size={20} />
                        )}
                    </button>

                    <Link to={`/edit/${song.id}`} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-main transition-colors">
                        <Edit size={20} />
                    </Link>
                    <button
                        onClick={async () => {
                            if (window.confirm('¿Estás seguro que deseas ELIMINAR esta canción permanentemente?')) {
                                try {
                                    await deleteSong(song.id);
                                    navigate('/songs');
                                } catch {
                                    alert('Error al eliminar');
                                }
                            }
                        }}
                        className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Eliminar canción"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Voice Assignment Toolbar — director only, visible when voiceMode is on */}
            {isDirector && voiceMode && (
                <div className="sticky top-[57px] z-10 glass-panel border-b border-white/5 px-4 py-2 flex items-center gap-2 flex-wrap shadow-md backdrop-blur-xl">
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
                        <X size={14} /> Limpiar
                    </button>
                    {activeSinger && (
                        <p className="w-full text-[10px] text-text-muted mt-1">
                            Toca una línea para asignarla · Toca de nuevo para quitar
                        </p>
                    )}
                    {!activeSinger && (
                        <p className="w-full text-[10px] text-text-muted mt-1">
                            Selecciona un cantante para empezar a asignar líneas
                        </p>
                    )}
                </div>
            )}

            {/* Metronome panel — collapses below header */}
            {metronomeOpen && (
                <div className="px-4 pt-3 pb-1 max-w-sm mx-auto">
                    <Metronome
                        initialBpm={song.bpm ?? 100}
                        onClose={() => setMetronomeOpen(false)}
                    />
                </div>
            )}

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

                    {/* Legend — visible when there are voice assignments */}
                    {Object.keys(voiceAssignments).length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {SINGER_COLORS.filter(s =>
                                Object.values(voiceAssignments).includes(s.key)
                            ).map(s => (
                                <span key={s.key} className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white',
                                    s.bg
                                )}>
                                    {s.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div translate="no" className="notranslate font-mono text-lg text-text-main song-content">
                    {transposedContent.split('\n').map((line, lineIdx) => renderLine(line, lineIdx))}
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
            {isTransposed && (
                <button
                    onClick={() => setSelectedKey(song.key)}
                    className="fixed bottom-24 right-6 bg-accent text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-fade-in"
                >
                    Restablecer Tono
                </button>
            )}

            {/* Live Session Overlays */}
            <LiveBanner />
            <DirectorControls />
        </div>
    );
}
