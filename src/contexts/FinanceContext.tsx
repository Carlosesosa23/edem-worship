import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import type { Contribution, Expense, MemberDebt } from '../types';
import {
    collection, onSnapshot, addDoc, deleteDoc,
    doc, query, orderBy,
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../lib/firebase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Devuelve el lunes (00:00:00 local) de la semana que contiene `ts` */
function getWeekStart(ts: number): number {
    const d = new Date(ts);
    const day = d.getDay(); // 0 = dom
    const diff = day === 0 ? -6 : 1 - day; // retrocede al lunes
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/** Etiqueta legible para una semana, ej. "Semana 10 – Mar 2026" */
export function weekLabel(ts: number): string {
    const d = new Date(ts);
    const start = new Date(getWeekStart(ts));
    const weekNum = Math.ceil(
        ((start.getTime() - new Date(start.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
    );
    const month = d.toLocaleDateString('es', { month: 'short' });
    const year = d.getFullYear();
    return `Semana ${weekNum} – ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
}

/**
 * Dado el timestamp del lunes de inicio del sistema y el lunes de esta semana,
 * devuelve un array con los timestamps de cada semana transcurrida (lunes a lunes).
 * No incluye la semana actual si aún no ha pasado.
 */
function getPastWeeks(firstWeekStart: number, todayWeekStart: number): number[] {
    const weeks: number[] = [];
    let cursor = firstWeekStart;
    // Incluimos hasta la semana actual (la gente puede aportar en la semana en curso)
    while (cursor <= todayWeekStart) {
        weeks.push(cursor);
        cursor += 7 * 24 * 60 * 60 * 1000; // +7 días
    }
    return weeks;
}

// ─── Context types ────────────────────────────────────────────────────────────

interface FinanceContextType {
    contributions: Contribution[];
    expenses: Expense[];
    loading: boolean;
    /** Agrega una aportación. Retorna el id generado. */
    addContribution: (c: Omit<Contribution, 'id' | 'createdAt'>) => Promise<string>;
    /** Elimina una aportación */
    deleteContribution: (id: string) => Promise<void>;
    /** Agrega un gasto. Retorna el id generado. */
    addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => Promise<string>;
    /** Elimina un gasto */
    deleteExpense: (id: string) => Promise<void>;
    /** Lempiras totales aportados */
    totalContributions: number;
    /** Lempiras totales gastados */
    totalExpenses: number;
    /** Saldo disponible */
    balance: number;
    /** Deuda calculada por miembro */
    memberDebts: MemberDebt[];
    /** Semanas registradas desde la primera aportación */
    totalWeeks: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function FinanceProvider({ children }: { children: ReactNode }) {
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Carga inicial ──────────────────────────────────────────────────────
    useEffect(() => {
        if (isFirebaseEnabled && db) {
            const qC = query(collection(db, 'contributions'), orderBy('weekStart', 'desc'));
            const unsubC = onSnapshot(qC, (snap) => {
                setContributions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Contribution[]);
            }, (err) => console.error('Error fetching contributions:', err));

            const qE = query(collection(db, 'expenses'), orderBy('date', 'desc'));
            const unsubE = onSnapshot(qE, (snap) => {
                setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[]);
                setLoading(false);
            }, (err) => {
                console.error('Error fetching expenses:', err);
                setLoading(false);
            });

            return () => { unsubC(); unsubE(); };
        } else {
            // localStorage fallback
            const rawC = localStorage.getItem('edem_contributions');
            const rawE = localStorage.getItem('edem_expenses');
            if (rawC) setContributions(JSON.parse(rawC));
            if (rawE) setExpenses(JSON.parse(rawE));
            setLoading(false);
        }
    }, []);

    // ── Helpers locales ────────────────────────────────────────────────────
    const saveLocalContributions = (updated: Contribution[]) => {
        setContributions(updated);
        localStorage.setItem('edem_contributions', JSON.stringify(updated));
    };

    const saveLocalExpenses = (updated: Expense[]) => {
        setExpenses(updated);
        localStorage.setItem('edem_expenses', JSON.stringify(updated));
    };

    // ── CRUD Contribuciones ────────────────────────────────────────────────
    const addContribution = async (c: Omit<Contribution, 'id' | 'createdAt'>): Promise<string> => {
        if (isFirebaseEnabled && db) {
            const sanitized = Object.fromEntries(
                Object.entries({ ...c, createdAt: Date.now() }).filter(([, v]) => v !== undefined)
            );
            try {
                const ref = await addDoc(collection(db, 'contributions'), sanitized);
                return ref.id;
            } catch (error) {
                console.error('Error adding contribution:', error);
                throw error;
            }
        } else {
            const newC: Contribution = { ...c, id: crypto.randomUUID(), createdAt: Date.now() };
            saveLocalContributions(
                [...contributions, newC].sort((a, b) => b.weekStart - a.weekStart)
            );
            return newC.id;
        }
    };

    const deleteContribution = async (id: string) => {
        if (isFirebaseEnabled && db) {
            try {
                await deleteDoc(doc(db, 'contributions', id));
            } catch (error) {
                console.error('Error deleting contribution:', error);
                throw error;
            }
        } else {
            saveLocalContributions(contributions.filter(c => c.id !== id));
        }
    };

    // ── CRUD Gastos ────────────────────────────────────────────────────────
    const addExpense = async (e: Omit<Expense, 'id' | 'createdAt'>): Promise<string> => {
        if (isFirebaseEnabled && db) {
            const sanitized = Object.fromEntries(
                Object.entries({ ...e, createdAt: Date.now() }).filter(([, v]) => v !== undefined)
            );
            try {
                const ref = await addDoc(collection(db, 'expenses'), sanitized);
                return ref.id;
            } catch (error) {
                console.error('Error adding expense:', error);
                throw error;
            }
        } else {
            const newE: Expense = { ...e, id: crypto.randomUUID(), createdAt: Date.now() };
            saveLocalExpenses(
                [...expenses, newE].sort((a, b) => b.date - a.date)
            );
            return newE.id;
        }
    };

    const deleteExpense = async (id: string) => {
        if (isFirebaseEnabled && db) {
            try {
                await deleteDoc(doc(db, 'expenses', id));
            } catch (error) {
                console.error('Error deleting expense:', error);
                throw error;
            }
        } else {
            saveLocalExpenses(expenses.filter(e => e.id !== id));
        }
    };

    // ── Totales derivados ──────────────────────────────────────────────────
    const totalContributions = contributions.reduce((s, c) => s + c.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const balance = totalContributions - totalExpenses;

    // ── Deudas por miembro ─────────────────────────────────────────────────
    const { memberDebts, totalWeeks } = useMemo((): { memberDebts: MemberDebt[]; totalWeeks: number } => {
        if (contributions.length === 0) return { memberDebts: [], totalWeeks: 0 };

        const WEEKLY_AMOUNT = 50; // L 50 por semana
        const todayWeekStart = getWeekStart(Date.now());

        // Semana más antigua registrada en el sistema
        const firstWeekStart = Math.min(...contributions.map(c => c.weekStart));
        const allWeeks = getPastWeeks(firstWeekStart, todayWeekStart);
        const totalWeeks = allWeeks.length;

        // Construir mapa: memberName → Set de weekStart que han pagado
        const paidMap: Record<string, Set<number>> = {};
        contributions.forEach(c => {
            const name = c.memberName.trim();
            if (!paidMap[name]) paidMap[name] = new Set();
            paidMap[name].add(c.weekStart);
        });

        // Semanas únicas con alguna aportación (sirve para saber desde cuándo existe cada miembro)
        // La "fecha de inicio" de cada miembro es la semana de su primera aportación
        const memberFirstWeek: Record<string, number> = {};
        contributions.forEach(c => {
            const name = c.memberName.trim();
            if (memberFirstWeek[name] === undefined || c.weekStart < memberFirstWeek[name]) {
                memberFirstWeek[name] = c.weekStart;
            }
        });

        const debts: MemberDebt[] = Object.keys(paidMap).map(name => {
            const memberStart = memberFirstWeek[name];
            // Semanas que aplican para este miembro (desde que empezó a aportar)
            const applicableWeeks = allWeeks.filter(w => w >= memberStart);
            const paidWeeks = paidMap[name];

            const missedWeeks = applicableWeeks.filter(w => !paidWeeks.has(w));
            const paidCount = applicableWeeks.filter(w => paidWeeks.has(w)).length;
            const missedCount = missedWeeks.length;
            const totalPaid = paidCount * WEEKLY_AMOUNT;
            const debtAmount = missedCount * WEEKLY_AMOUNT;
            const isUpToDate = missedCount === 0;

            return {
                memberName: name,
                totalPaid,
                debtAmount,
                missedWeeks: missedWeeks.length,
                paidWeeks: paidCount,
                applicableWeeks: applicableWeeks.length,
                isUpToDate,
                missedWeekLabels: missedWeeks.map(w => weekLabel(w)),
            };
        });

        // Ordenar: primero los que tienen deuda (desc por monto), luego al día
        debts.sort((a, b) => {
            if (a.isUpToDate !== b.isUpToDate) return a.isUpToDate ? 1 : -1;
            return b.debtAmount - a.debtAmount;
        });

        return { memberDebts: debts, totalWeeks };
    }, [contributions]);

    return (
        <FinanceContext.Provider value={{
            contributions, expenses, loading,
            addContribution, deleteContribution,
            addExpense, deleteExpense,
            totalContributions, totalExpenses, balance,
            memberDebts, totalWeeks,
        }}>
            {children}
        </FinanceContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFinance() {
    const ctx = useContext(FinanceContext);
    if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
    return ctx;
}

// ─── Re-export helpers ────────────────────────────────────────────────────────
export { getWeekStart };
