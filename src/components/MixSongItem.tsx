import { useState, useMemo } from 'react';
import type { Song } from '../types/index';
import { transposeContent, normalizeContent, MAJOR_KEYS, MINOR_KEYS, getSemitonesDifference } from '../lib/transpose';
import { Music, User, ChevronDown, Timer } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLiveSession, SINGER_COLORS } from '../contexts/LiveSessionContext';
import { Metronome } from './Metronome';
import { SongContent } from './SongContent';

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
        // Normalize first: converts plain chord lines to bracket notation for SongContent
        const normalized = normalizeContent(song.content);
        const semitones = getSemitonesDifference(song.key, selectedKey);
        if (semitones === 0) return normalized;
        return transposeContent(normalized, semitones, song.key);
    }, [song.content, song.key, selectedKey]);

    const handleLineClick = (lineIdx: number) => {
        if (!isDirector || !voiceMode || activeSinger === null) return;
        const key = `${song.id}:${lineIdx}`;
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
            <SongContent
                content={transposedContent}
                voiceAssignments={voiceAssignments}
                singerColors={SINGER_COLORS}
                keyPrefix={song.id}
                onLineClick={handleLineClick}
                interactive={isDirector && voiceMode && activeSinger !== null}
                size="sm"
            />
        </div>
    );
}
