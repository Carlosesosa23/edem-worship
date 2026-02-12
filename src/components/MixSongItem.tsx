import { useState, useMemo } from 'react';
import type { Song } from '../types/index';
import { transposeContent, NOTES, getNoteIndex, MAJOR_KEYS, MINOR_KEYS, getSemitonesDifference } from '../lib/transpose';
import { Music, User, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLiveSession } from '../contexts/LiveSessionContext';

interface MixSongItemProps {
    song: Song;
    index: number;
}

export function MixSongItem({ song, index }: MixSongItemProps) {
    const [transpose, setTranspose] = useState(0);
    const { isDirector, setActiveSong, clearActiveSong, liveState } = useLiveSession();

    // Check if this is the active song in live session
    const isActive = liveState.activeSongId === song.id;

    const transposedContent = useMemo(() => {
        return transposeContent(song.content, transpose, song.key);
    }, [song.content, transpose, song.key]);

    const baseIndex = getNoteIndex(song.key);
    const currentKeyIndex = baseIndex === -1 ? -1 : (baseIndex + transpose) % 12;
    const currentKey = currentKeyIndex === -1 ? '?' : NOTES[currentKeyIndex < 0 ? currentKeyIndex + 12 : currentKeyIndex];

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
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-full bg-surface-highlight text-xs font-bold flex items-center justify-center text-text-muted">
                                {index + 1}
                            </span>
                            {isActive && (
                                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    EN VIVO
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-text-main to-text-muted bg-clip-text text-transparent">
                            {song.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1">
                            <span className="flex items-center gap-1"><User size={12} /> {song.artist}</span>
                            {song.bpm && <span className="flex items-center gap-1"><Music size={12} /> {song.bpm} BPM</span>}
                        </div>
                    </div>

                    {/* Transpose Controls */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center bg-surface rounded-lg overflow-hidden border border-white/10 shadow-sm relative">
                            <select
                                value={currentKey}
                                onChange={(e) => {
                                    const newKey = e.target.value;
                                    const diff = getSemitonesDifference(song.key, newKey);
                                    setTranspose(diff);
                                }}
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

            {/* Content */}
            <div className="whitespace-pre-wrap font-mono text-base leading-loose text-text-main px-1">
                {transposedContent.split('\n').map((line, i) => {
                    const hasChords = line.includes('[');

                    if (hasChords) {
                        const parts = line.split(/(\[.*?\])/g);
                        return (
                            <div key={i} className="min-h-[2.2em] relative mb-2">
                                {parts.map((part, j) => {
                                    if (part.startsWith('[') && part.endsWith(']')) {
                                        return (
                                            <span key={j} className="text-secondary font-bold text-sm inline-block px-1 rounded -translate-y-3 transform select-none">
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
                        <div key={i} className="min-h-[1.5em] mb-2 opacity-90">
                            {line}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
