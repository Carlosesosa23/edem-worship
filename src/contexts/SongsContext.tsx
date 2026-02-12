import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Song } from '../types/index';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../lib/firebase';

interface SongsContextType {
    songs: Song[];
    loading: boolean;
    addSong: (song: Omit<Song, 'id' | 'createdAt'>) => Promise<void>;
    updateSong: (id: string, updates: Partial<Song>) => Promise<void>;
    deleteSong: (id: string) => Promise<void>;
}

const SongsContext = createContext<SongsContextType | undefined>(undefined);

export function SongsProvider({ children }: { children: ReactNode }) {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isFirebaseEnabled && db) {
            // Real-time subscription to Firestore
            const q = query(collection(db, 'songs'), orderBy('title'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const loadedSongs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Song[];
                setSongs(loadedSongs);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching songs:", error);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            // Local Storage Mode
            const localSongs = localStorage.getItem('edem_songs');
            if (localSongs) {
                setSongs(JSON.parse(localSongs));
            } else {
                // Create a demo song if empty
                const demoSong: Song = {
                    id: 'demo-1',
                    title: 'Sublime Gracia (Demo)',
                    artist: 'Himnario',
                    key: 'C',
                    content: '[C] Sublime gracia [F] del Señor\n[C] Que a un infeliz [G] salvó\n[C] Fui ciego mas [F] hoy miro yo\n[C] Per-[G]-dido y él me [C] halló',
                    createdAt: Date.now()
                };
                setSongs([demoSong]);
                localStorage.setItem('edem_songs', JSON.stringify([demoSong]));
            }
            setLoading(false);
        }
    }, []);

    const addSong = async (song: Omit<Song, 'id' | 'createdAt'>) => {
        if (isFirebaseEnabled && db) {
            try {
                // Ensure no undefined values are sent to Firestore
                const sanitizedSong = Object.fromEntries(
                    Object.entries(song).filter(([_, v]) => v !== undefined)
                );

                await addDoc(collection(db, 'songs'), {
                    ...sanitizedSong,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            } catch (error: any) {
                console.error("Error adding song to Firebase:", error);
                if (error.code === 'permission-denied') {
                    alert("Error: Permisos insuficientes. Revisa las Reglas de Firestore en la consola.");
                } else {
                    alert(`Error al guardar: ${error.message}`);
                }
                throw error;
            }
        } else {
            const newSong: Song = {
                ...song,
                id: crypto.randomUUID(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            const updatedSongs = [...songs, newSong];
            setSongs(updatedSongs);
            localStorage.setItem('edem_songs', JSON.stringify(updatedSongs));
        }
    };

    const updateSong = async (id: string, updates: Partial<Song>) => {
        if (isFirebaseEnabled && db) {
            try {
                const songRef = doc(db, 'songs', id);
                // Ensure no undefined values are sent to Firestore
                const sanitizedUpdates = Object.fromEntries(
                    Object.entries(updates).filter(([_, v]) => v !== undefined)
                );

                await updateDoc(songRef, {
                    ...sanitizedUpdates,
                    updatedAt: Date.now()
                });
            } catch (error) {
                console.error("Error updating song:", error);
                throw error;
            }
        } else {
            const updatedSongs = songs.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s);
            setSongs(updatedSongs);
            localStorage.setItem('edem_songs', JSON.stringify(updatedSongs));
        }
    };

    const deleteSong = async (id: string) => {
        if (isFirebaseEnabled && db) {
            try {
                await deleteDoc(doc(db, 'songs', id));
            } catch (error) {
                console.error("Error deleting song:", error);
                throw error;
            }
        } else {
            const updatedSongs = songs.filter(s => s.id !== id);
            setSongs(updatedSongs);
            localStorage.setItem('edem_songs', JSON.stringify(updatedSongs));
        }
    };

    return (
        <SongsContext.Provider value={{ songs, loading, addSong, updateSong, deleteSong }}>
            {children}
        </SongsContext.Provider>
    );
}

export function useSongs() {
    const context = useContext(SongsContext);
    if (context === undefined) {
        throw new Error('useSongs must be used within a SongsProvider');
    }
    return context;
}
