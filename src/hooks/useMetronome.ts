import { useRef, useState, useCallback, useEffect } from 'react';

export type BeatType = 'strong' | 'weak' | 'idle';

interface UseMetronomeReturn {
    isPlaying: boolean;
    bpm: number;
    setBpm: (bpm: number) => void;
    currentBeat: number;       // 1-based beat index within the bar
    beatsPerBar: number;
    setBeatsPerBar: (b: number) => void;
    beatType: BeatType;        // current beat accent type (for visual flash)
    toggle: () => void;
    tap: () => void;           // tap tempo
}

const MIN_BPM = 30;
const MAX_BPM = 240;

export function useMetronome(initialBpm: number = 100): UseMetronomeReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpmState] = useState(() => Math.min(Math.max(initialBpm, MIN_BPM), MAX_BPM));
    const [beatsPerBar, setBeatsPerBar] = useState(4);
    const [currentBeat, setCurrentBeat] = useState(1);
    const [beatType, setBeatType] = useState<BeatType>('idle');

    // Refs so audio callbacks always see latest values without re-creating scheduler
    const bpmRef = useRef(bpm);
    const beatsPerBarRef = useRef(beatsPerBar);
    const isPlayingRef = useRef(false);
    const beatCountRef = useRef(0);         // absolute beat counter
    const nextBeatTimeRef = useRef(0);      // AudioContext time of next scheduled beat
    const schedulerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Tap tempo
    const tapTimesRef = useRef<number[]>([]);

    // Keep refs in sync
    useEffect(() => { bpmRef.current = bpm; }, [bpm]);
    useEffect(() => { beatsPerBarRef.current = beatsPerBar; }, [beatsPerBar]);

    // ── Audio helpers ────────────────────────────────────────────────────────

    const getAudioCtx = useCallback((): AudioContext => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new AudioContext();
        }
        return audioCtxRef.current;
    }, []);

    /**
     * Schedules a single click at `time` (AudioContext time in seconds).
     * Strong beat (beat 1): higher pitch, louder.
     * Weak beat: lower pitch, softer.
     */
    const scheduleClick = useCallback((time: number, isStrong: boolean) => {
        const ctx = getAudioCtx();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = isStrong ? 1000 : 800;
        gain.gain.setValueAtTime(isStrong ? 1.0 : 0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.start(time);
        osc.stop(time + 0.08);
    }, [getAudioCtx]);

    // ── Scheduler loop (look-ahead scheduling) ──────────────────────────────

    const scheduleAhead = 0.1;   // seconds to look ahead
    const scheduleInterval = 25; // ms between scheduler calls

    const scheduler = useCallback(() => {
        if (!isPlayingRef.current) return;

        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        while (nextBeatTimeRef.current < ctx.currentTime + scheduleAhead) {
            const beatInBar = (beatCountRef.current % beatsPerBarRef.current) + 1;
            const isStrong = beatInBar === 1;

            scheduleClick(nextBeatTimeRef.current, isStrong);

            // Schedule UI update slightly before the beat fires
            const delay = Math.max(0, (nextBeatTimeRef.current - ctx.currentTime) * 1000);
            const capturedBeat = beatInBar;
            const capturedType: BeatType = isStrong ? 'strong' : 'weak';
            setTimeout(() => {
                if (!isPlayingRef.current) return;
                setCurrentBeat(capturedBeat);
                setBeatType(capturedType);
                // Reset flash after short duration
                setTimeout(() => setBeatType('idle'), 80);
            }, delay);

            nextBeatTimeRef.current += 60 / bpmRef.current;
            beatCountRef.current += 1;
        }

        schedulerTimerRef.current = setTimeout(scheduler, scheduleInterval);
    }, [getAudioCtx, scheduleClick]);

    // ── Start / Stop ─────────────────────────────────────────────────────────

    const start = useCallback(() => {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        beatCountRef.current = 0;
        nextBeatTimeRef.current = ctx.currentTime + 0.05;
        isPlayingRef.current = true;
        setIsPlaying(true);
        setCurrentBeat(1);
        setBeatType('idle');
        scheduler();
    }, [getAudioCtx, scheduler]);

    const stop = useCallback(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setBeatType('idle');
        setCurrentBeat(1);
        if (schedulerTimerRef.current !== null) {
            clearTimeout(schedulerTimerRef.current);
            schedulerTimerRef.current = null;
        }
    }, []);

    const toggle = useCallback(() => {
        if (isPlayingRef.current) stop();
        else start();
    }, [start, stop]);

    // Restart when bpm or beatsPerBar changes while playing
    const setBpm = useCallback((newBpm: number) => {
        const clamped = Math.min(Math.max(Math.round(newBpm), MIN_BPM), MAX_BPM);
        setBpmState(clamped);
        bpmRef.current = clamped;
    }, []);

    const handleSetBeatsPerBar = useCallback((b: number) => {
        setBeatsPerBar(b);
        beatsPerBarRef.current = b;
        beatCountRef.current = 0; // reset bar position
    }, []);

    // ── Tap Tempo ────────────────────────────────────────────────────────────

    const tap = useCallback(() => {
        const now = performance.now();
        const taps = tapTimesRef.current;

        // Discard taps older than 3 seconds (new phrase)
        const recent = taps.filter(t => now - t < 3000);
        recent.push(now);
        tapTimesRef.current = recent;

        if (recent.length >= 2) {
            const intervals = recent.slice(1).map((t, i) => t - recent[i]);
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const tappedBpm = Math.round(60000 / avg);
            setBpm(tappedBpm);
        }
    }, [setBpm]);

    // ── Cleanup on unmount ───────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            stop();
            audioCtxRef.current?.close();
        };
    }, [stop]);

    return {
        isPlaying,
        bpm,
        setBpm,
        currentBeat,
        beatsPerBar,
        setBeatsPerBar: handleSetBeatsPerBar,
        beatType,
        toggle,
        tap,
    };
}
