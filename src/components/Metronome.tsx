import { useEffect } from 'react';
import { Play, Square, Music2, Hand } from 'lucide-react';
import { useMetronome } from '../hooks/useMetronome';
import { cn } from '../lib/utils';

interface MetronomeProps {
    initialBpm?: number;
    onClose: () => void;
}

const BEATS_OPTIONS = [2, 3, 4, 6];

export function Metronome({ initialBpm = 100, onClose }: MetronomeProps) {
    const {
        isPlaying,
        bpm,
        setBpm,
        currentBeat,
        beatsPerBar,
        setBeatsPerBar,
        beatType,
        toggle,
        tap,
    } = useMetronome(initialBpm);

    // Stop metronome when component unmounts (e.g. user navigates away)
    useEffect(() => {
        return () => {
            // The hook itself cleans up on unmount — nothing extra needed here
        };
    }, []);

    const handleBpmInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBpm(Number(e.target.value));
    };

    const nudge = (delta: number) => setBpm(bpm + delta);

    return (
        <div className="glass-panel rounded-2xl p-5 space-y-5 animate-fade-in border border-white/10 shadow-2xl">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Music2 size={18} />
                    <span className="text-sm uppercase tracking-widest">Metrónomo</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-xs text-text-muted hover:text-text-main px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                    Cerrar
                </button>
            </div>

            {/* ── Beat dots ── */}
            <div className="flex justify-center gap-3">
                {Array.from({ length: beatsPerBar }, (_, i) => {
                    const beat = i + 1;
                    const isActive = isPlaying && currentBeat === beat;
                    const isStrong = beat === 1;
                    return (
                        <div
                            key={beat}
                            className={cn(
                                'rounded-full transition-all duration-75',
                                isStrong ? 'w-5 h-5' : 'w-4 h-4',
                                isActive && beatType === 'strong'
                                    ? 'bg-primary scale-125 shadow-lg shadow-primary/60'
                                    : isActive && beatType === 'weak'
                                        ? 'bg-secondary scale-110 shadow-md shadow-secondary/40'
                                        : isStrong
                                            ? 'bg-white/30'
                                            : 'bg-white/15'
                            )}
                        />
                    );
                })}
            </div>

            {/* ── BPM display + nudge ── */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={() => nudge(-5)}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-lg transition-all active:scale-90 flex items-center justify-center text-text-muted hover:text-text-main"
                >
                    −
                </button>

                <div className="text-center min-w-[7rem]">
                    <div className={cn(
                        'text-5xl font-black tabular-nums transition-all duration-75',
                        isPlaying && beatType !== 'idle' ? 'text-primary scale-105' : 'text-text-main'
                    )}>
                        {bpm}
                    </div>
                    <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">BPM</div>
                </div>

                <button
                    onClick={() => nudge(5)}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-lg transition-all active:scale-90 flex items-center justify-center text-text-muted hover:text-text-main"
                >
                    +
                </button>
            </div>

            {/* ── Slider ── */}
            <div className="px-1">
                <input
                    type="range"
                    min={30}
                    max={240}
                    value={bpm}
                    onChange={handleBpmInput}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                               bg-white/10
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-4
                               [&::-webkit-slider-thumb]:h-4
                               [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:bg-primary
                               [&::-webkit-slider-thumb]:shadow-lg
                               [&::-webkit-slider-thumb]:shadow-primary/50
                               [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-moz-range-thumb]:w-4
                               [&::-moz-range-thumb]:h-4
                               [&::-moz-range-thumb]:rounded-full
                               [&::-moz-range-thumb]:bg-primary
                               [&::-moz-range-thumb]:border-none"
                />
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                    <span>30</span>
                    <span>240</span>
                </div>
            </div>

            {/* ── Beats per bar ── */}
            <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-text-muted mr-1">Compás</span>
                {BEATS_OPTIONS.map(b => (
                    <button
                        key={b}
                        onClick={() => setBeatsPerBar(b)}
                        className={cn(
                            'w-9 h-9 rounded-xl text-sm font-bold transition-all active:scale-90',
                            beatsPerBar === b
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-white/5 hover:bg-white/10 text-text-muted border border-white/10'
                        )}
                    >
                        {b}/4
                    </button>
                ))}
            </div>

            {/* ── Controls: Tap + Play/Stop ── */}
            <div className="flex gap-3">
                {/* Tap Tempo */}
                <button
                    onClick={tap}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-text-muted hover:text-text-main font-semibold text-sm transition-all active:scale-95"
                >
                    <Hand size={16} />
                    Tap
                </button>

                {/* Play / Stop */}
                <button
                    onClick={toggle}
                    className={cn(
                        'flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95',
                        isPlaying
                            ? 'bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30'
                            : 'btn-primary'
                    )}
                >
                    {isPlaying ? (
                        <><Square size={16} fill="currentColor" /> Detener</>
                    ) : (
                        <><Play size={16} fill="currentColor" /> Iniciar</>
                    )}
                </button>
            </div>

            {/* ── Tempo label hint ── */}
            <p className="text-center text-[10px] text-text-muted">
                {bpm < 60 ? 'Largo' :
                 bpm < 76 ? 'Larghetto' :
                 bpm < 108 ? 'Andante' :
                 bpm < 120 ? 'Moderato' :
                 bpm < 156 ? 'Allegro' :
                 bpm < 176 ? 'Vivace' : 'Presto'}
                {' · '}{bpm} BPM
            </p>
        </div>
    );
}
