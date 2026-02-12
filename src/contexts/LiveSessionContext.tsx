import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db, isFirebaseEnabled } from '../lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

interface LiveState {
    activeSongId: string | null;
    activeMixId: string | null;
    currentSignal: string | null;
    timestamp: number;
}

interface LiveSessionContextType {
    liveState: LiveState;
    isDirector: boolean;
    toggleDirectorMode: () => void;
    setActiveSong: (songId: string) => Promise<void>;
    sendSignal: (signal: string) => Promise<void>;
    clearSignal: () => Promise<void>;
    clearActiveSong: () => Promise<void>;
}

const LiveSessionContext = createContext<LiveSessionContextType | undefined>(undefined);

export const SIGNALS = [
    { label: "Ministrar", color: "bg-purple-600" },
    { label: "Fluir", color: "bg-blue-600" },
    { label: "Coro", color: "bg-indigo-600" },
    { label: "Intro", color: "bg-emerald-600" },
    { label: "Verso", color: "bg-slate-600" },
    { label: "Puente", color: "bg-orange-600" },
    { label: "TERMINAR", color: "bg-red-600 font-bold" },
    { label: "Predicador subiendo", color: "bg-yellow-600" },
    { label: "Nueva Canción Solicitada", color: "bg-pink-600" },
];

const INITIAL_STATE: LiveState = {
    activeSongId: null,
    activeMixId: null,
    currentSignal: null,
    timestamp: Date.now()
};

export function LiveSessionProvider({ children }: { children: ReactNode }) {
    const [liveState, setLiveState] = useState<LiveState>(INITIAL_STATE);
    const [isDirector, setIsDirector] = useState(() => {
        return localStorage.getItem('edem_is_director') === 'true';
    });

    // Load state from source (Firebase or Local)
    useEffect(() => {
        if (isFirebaseEnabled && db) {
            // Firebase Realtime Listener
            const unsub = onSnapshot(doc(db, 'sessions', 'live'), (doc) => {
                if (doc.exists()) {
                    setLiveState(doc.data() as LiveState);
                }
            });
            return () => unsub();
        } else {
            // Local Storage Listener (Tab Sync)
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'edem_live_session' && e.newValue) {
                    setLiveState(JSON.parse(e.newValue));
                }
            };
            window.addEventListener('storage', handleStorageChange);

            // Initial load
            const stored = localStorage.getItem('edem_live_session');
            if (stored) setLiveState(JSON.parse(stored));

            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, []);

    const toggleDirectorMode = () => {
        const newState = !isDirector;
        setIsDirector(newState);
        localStorage.setItem('edem_is_director', String(newState));
    };

    const updateState = async (updates: Partial<LiveState>) => {
        const newState = { ...liveState, ...updates, timestamp: Date.now() };

        // Optimistic update
        setLiveState(newState);

        if (isFirebaseEnabled && db) {
            await setDoc(doc(db, 'sessions', 'live'), {
                ...newState,
                updatedAt: serverTimestamp()
            });
        } else {
            localStorage.setItem('edem_live_session', JSON.stringify(newState));
            // Manually trigger storage event for current tab (storage event only fires on OTHER tabs)
            // But since we use React state, current tab is already updated.
        }
    };

    const setActiveSong = async (songId: string) => {
        await updateState({ activeSongId: songId });
    };

    const sendSignal = async (signal: string) => {
        await updateState({ currentSignal: signal });

        // Auto-clear transient signals after 5 seconds if needed, 
        // but user might want them to persist. Let's keep them persistent until changed 
        // or explicitly cleared, but "Predicador subiendo" sounds like a state.
        // "Intro", "Verso" are states.
    };

    const clearSignal = async () => {
        await updateState({ currentSignal: null });
    };

    const clearActiveSong = async () => {
        await updateState({ activeSongId: null });
    };

    return (
        <LiveSessionContext.Provider value={{
            liveState,
            isDirector,
            toggleDirectorMode,
            setActiveSong,
            sendSignal,
            clearSignal,
            clearActiveSong
        }}>
            {children}
        </LiveSessionContext.Provider>
    );
}

export const useLiveSession = () => {
    const context = useContext(LiveSessionContext);
    if (!context) throw new Error('useLiveSession must be used within LiveSessionProvider');
    return context;
};
