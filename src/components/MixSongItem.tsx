import { useState, useMemo } from 'react';
import type { Song } from '../types/index';
import { transposeContent, MAJOR_KEYS, MINOR_KEYS, getSemitonesDifference } from '../lib/transpose';
import { Music, User, ChevronDown, Timer } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLiveSession, SINGER_COLORS } from '../contexts/LiveSessionContext';
import { Metronome } from './Metronome';

interface MixSongItemProps {
    song: Song;
    index: number;
    voiceMode: boolean;
    activeSinger: string | null;
}

export function MixSongItem({ song, index, voiceMode, activeSinger }: MixSongItemProps) {
    const { isDirector, setActiveSong, clearActiveSong, liveState, assignSingerToLines } = useLiveSession();

    const isActive = liveState.activeSongId === song.id;
    const voiceAssignments = liveState.voiceAssignments ?? {};

    const [selectedKey, setSelectedKey] = useState(song.key || 'C');
    const [metronomeOpen, setMetronomeOpen] = useState(false);

    const transposedContent = useMemo(() => {
        const semitones = getSemitonesDifference(song.key, selectedKey);
        if (semitones === 0) return song.content;
        return transposeContent(song.content, semitones, song.key);
    }, [song.content, song.key, selectedKey]);

    // Key format for voice assignments in a mix: "songId:lineIdx"
    const makeKey = (lineIdx: number) => `${song.id}:${lineIdx}`;

    const handleLineClick = (lineIdx: number) => {
        if (!isDirector || !voiceMode || activeSinger === null) return;
        const key = makeKey(lineIdx);
        const current = voiceAssignments[key];
        const newSingerKey = current === activeSinger ? null : activeSinger;
        assignSingerToLines([lineIdx], newSingerKey, song.id);
    };

    // Which singer colors are used in this song (for legend)
    const usedSingers = SINGER_COLORS.filter(s =>
        Object.entries(voiceAssignments).some(
            ([k, v]) => k.startsWith(`${song.id}:`) && v === s.key
        )
    );

    const renderLine = (line: string, lineIdx: number) => {
        const key = makeKey(lineIdx);
        const singerKey = voiceAssignments[key];
        const singerCfg = singerKey ? SINGER_COLORS.find(s => s.key === singerKey) : null;

        const highlightClass = singerCfg ? singerCfg.light : '';
        const borderClass = singerCfg
            ? `border-l-4 ${singerCfg.border}`
            : 'border-l-4 border-transparent';
        const interactiveClass = (isDirector && voiceMode && activeSinger !== null)
            ? 'cursor-pointer hover:opacity-75 select-none'
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
                        interactiveClass
                    )}
                >
                    {singerCfg && (
                        <span className={cn(
                            'self-center mr-2 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full leading-none flex-shrink-0',
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
                            <span className="text-text-main text-base leading-none whitespace-pre">
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
                    'mb-2 px-2 py-0.5 rounded-r-lg text-base leading-normal transition-all flex items-center gap-2',
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
        <div
            id={`song-${song.id}`}
            className={cn(
                "scroll-mt-32 border-b border-white/5 pb-12 last:border-0",
                isActive ? "bg-primary/5 -mx-4 px-4 rounded-xl border border-primary/20" : ""
            )}
        >
            {/* Song Header */}
            <div className="flex flex-col gap-3 mb-6 sticky top-20 bg-background/95 backdrop-blur-md z-10 py-4 -mx-2 px-2 border-b border-white/5">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="w-6 h-6 rounded-full bg-surface-highlight text-xs font-bold flex items-center justify-center text-text-muted flex-shrink-0">
                                {index + 1}
                            </span>
                            {isActive && (
                                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    EN VIVO
                                </span>
                            )}
                            {/* Per-song singer legend */}
                            {usedSingers.map(s => (
                                <span key={s.key} className={cn(
                                    'text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0',
                                    s.bg
                                )}>
                                    {s.label}
                                </span>
                            ))}
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-text-main to-text-muted bg-clip-text text-transparent truncate">
                            {song.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1">
                            <span className="flex items-center gap-1"><User size={12} /> {song.artist}</span>
                            {song.bpm && <span className="flex items-center gap-1"><Music size={12} /> {song.bpm} BPM</span>}
                        </div>
                    </div>

                    {/* Transpose Controls + Metronome */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1">
                            {/* Metronome toggle */}
                            <button
                                onClick={() => setMetronomeOpen(o => !o)}
                                title="Metrónomo"
                                className={cn(
                                    'p-1.5 rounded-lg transition-all',
                                    metronomeOpen
                                        ? 'bg-primary/20 text-primary'
                                        : 'text-text-muted hover:text-text-main hover:bg-white/10'
                                )}
                            >
                                <Timer size={16} />
                            </button>

                            {/* Key selector */}
                            <div className="flex items-center bg-surface rounded-lg overflow-hidden border border-white/10 shadow-sm relative">
                                <select
                                    value={selectedKey}
                                    onChange={(e) => setSelectedKey(e.target.value)}
                                    className="bg-transparent text-secondary font-bold text-sm py-1 pl-3 pr-6 appearance-none cursor-pointer focus:outline-none min-w-[4rem]"
                                >
                                    <optgroup label="Mayores">
                                        {MAJOR_KEYS.map(k => <option key={k} value={k} className="bg-surface text-text-main">{k}</option>)}
                                    </optgroup>
                                    <optgroup label="Menores">
                                        {MINOR_KEYS.map(k => <option key={k} value={k} className="bg-surface text-text-main">{k}</option>)}
                                    </optgroup>
                                </select>
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                    <ChevronDown size={12} />
                                </div>
                            </div>
                        </div>

                        {isDirector && (
                            <button
                                onClick={() => {
                                    if (isActive) {
                                        clearActiveSong();
                                    } else {
                                        setActiveSong(song.id);
                                    }
                                }}
                                className={cn(
                                    "text-xs px-2 py-1 rounded-md border transition-all",
                                    isActive
                                        ? "bg-primary text-white border-primary hover:bg-red-500 hover:border-red-500"
                                        : "border-white/10 text-text-muted hover:text-white"
                                )}
                            >
                                {isActive ? "Detener" : "Poner En Vivo"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Metronome panel — expands inline below song header */}
            {metronomeOpen && (
                <div className="mb-4 max-w-sm">
                    <Metronome
                        initialBpm={song.bpm ?? 100}
                        onClose={() => setMetronomeOpen(false)}
                    />
                </div>
            )}

            {/* Content */}
            <div translate="no" className="notranslate font-mono text-base text-text-main px-1">
                {transposedContent.split('\n').map((line, lineIdx) => renderLine(line, lineIdx))}
            </div>
        </div>
    );
}
