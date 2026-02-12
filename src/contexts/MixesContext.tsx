
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Mix } from '../types';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../lib/firebase';

interface MixesContextType {
    mixes: Mix[];
    loading: boolean;
    addMix: (mix: Omit<Mix, 'id'>) => Promise<string>;
    updateMix: (id: string, updates: Partial<Mix>) => Promise<void>;
    deleteMix: (id: string) => Promise<void>;
}

const MixesContext = createContext<MixesContextType | undefined>(undefined);

export function MixesProvider({ children }: { children: ReactNode }) {
    const [mixes, setMixes] = useState<Mix[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isFirebaseEnabled && db) {
            const q = query(collection(db, 'mixes'), orderBy('date', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const loadedMixes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Mix[];
                setMixes(loadedMixes);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching mixes:", error);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            // Local Storage
            const localMixes = localStorage.getItem('edem_mixes');
            if (localMixes) {
                setMixes(JSON.parse(localMixes));
            }
            setLoading(false);
        }
    }, []);

    const addMix = async (mix: Omit<Mix, 'id'>) => {
        if (isFirebaseEnabled && db) {
            try {
                const docRef = await addDoc(collection(db, 'mixes'), mix);
                return docRef.id;
            } catch (error) {
                console.error("Error adding mix:", error);
                throw error;
            }
        } else {
            const newMix: Mix = {
                ...mix,
                id: crypto.randomUUID()
            };
            const updatedMixes = [newMix, ...mixes];
            setMixes(updatedMixes);
            localStorage.setItem('edem_mixes', JSON.stringify(updatedMixes));
            return newMix.id;
        }
    };

    const updateMix = async (id: string, updates: Partial<Mix>) => {
        if (isFirebaseEnabled && db) {
            await updateDoc(doc(db, 'mixes', id), updates);
        } else {
            const updatedMixes = mixes.map(m => m.id === id ? { ...m, ...updates } : m);
            setMixes(updatedMixes);
            localStorage.setItem('edem_mixes', JSON.stringify(updatedMixes));
        }
    };

    const deleteMix = async (id: string) => {
        if (isFirebaseEnabled && db) {
            await deleteDoc(doc(db, 'mixes', id));
        } else {
            const updatedMixes = mixes.filter(m => m.id !== id);
            setMixes(updatedMixes);
            localStorage.setItem('edem_mixes', JSON.stringify(updatedMixes));
        }
    };

    return (
        <MixesContext.Provider value={{ mixes, loading, addMix, updateMix, deleteMix }}>
            {children}
        </MixesContext.Provider>
    );
}

export function useMixes() {
    const context = useContext(MixesContext);
    if (context === undefined) {
        throw new Error('useMixes must be used within a MixesProvider');
    }
    return context;
}
