import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useFinance, weekLabel, getWeekStart } from '../contexts/FinanceContext';
import { ArrowLeft, Wallet, Users, ShoppingBag, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Expense } from '../types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES: { value: Expense['category']; label: string; icon: string }[] = [
    { value: 'insumos', label: 'Insumos', icon: '🎸' },
    { value: 'equipamiento', label: 'Equipamiento', icon: '🎛️' },
    { value: 'transporte', label: 'Transporte', icon: '🚗' },
    { value: 'alimentacion', label: 'Alimentación', icon: '🍽️' },
    { value: 'otro', label: 'Otro', icon: '📦' },
];

const DEFAULT_CONTRIBUTION_AMOUNT = 50;

// ─── Formulario de Aportación ────────────────────────────────────────────────

function ContributionForm({ onSave }: { onSave: () => void }) {
    const { addContribution } = useFinance();
    const [memberName, setMemberName] = useState('');
    const [amount, setAmount] = useState(DEFAULT_CONTRIBUTION_AMOUNT.toString());
    const [notes, setNotes] = useState('');
    const [weekTs, setWeekTs] = useState(() => {
        // por defecto: lunes de la semana actual en formato YYYY-MM-DD
        const start = getWeekStart(Date.now());
        return new Date(start).toISOString().slice(0, 10);
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!memberName.trim()) { setError('El nombre del miembro es obligatorio.'); return; }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('El monto debe ser mayor a 0.'); return; }

        const weekStart = new Date(weekTs + 'T00:00:00').getTime();
        setSaving(true);
        try {
            await addContribution({
                memberName: memberName.trim(),
                amount: parsedAmount,
                weekLabel: weekLabel(weekStart),
                weekStart,
                notes: notes.trim() || undefined,
            });
            onSave();
        } catch {
            setError('Error al guardar. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="glass-panel rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-green-400 font-bold text-sm mb-2">
                    <Users size={16} />
                    Datos de la aportación
                </div>

                {/* Nombre del miembro */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Nombre del miembro *
                    </label>
                    <input
                        type="text"
                        value={memberName}
                        onChange={e => setMemberName(e.target.value)}
                        placeholder="Ej. Carlos Hernández"
                        className="input-field w-full"
                        autoFocus
                    />
                </div>

                {/* Monto */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Monto (Lempiras) *
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">L</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min="1"
                            step="0.01"
                            className="input-field w-full pl-8"
                        />
                    </div>
                    <p className="text-[11px] text-text-muted">Aportación estándar: L 50.00 por semana</p>
                </div>

                {/* Semana */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Semana de la aportación
                    </label>
                    <input
                        type="date"
                        value={weekTs}
                        onChange={e => setWeekTs(e.target.value)}
                        className="input-field w-full"
                    />
                    <p className="text-[11px] text-text-muted">
                        → {weekLabel(new Date(weekTs + 'T00:00:00').getTime())}
                    </p>
                </div>

                {/* Notas */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Notas (opcional)
                    </label>
                    <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Ej. Aportó por dos semanas"
                        className="input-field w-full"
                    />
                </div>
            </div>

            {error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
                type="submit"
                disabled={saving}
                className={cn('btn-primary w-full flex items-center justify-center gap-2', saving && 'opacity-60 cursor-not-allowed')}
            >
                <Save size={18} />
                {saving ? 'Guardando…' : 'Guardar aportación'}
            </button>
        </form>
    );
}

// ─── Formulario de Gasto ─────────────────────────────────────────────────────

function ExpenseForm({ onSave }: { onSave: () => void }) {
    const { addExpense } = useFinance();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<Expense['category']>('insumos');
    const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
    const [registeredBy, setRegisteredBy] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!description.trim()) { setError('La descripción es obligatoria.'); return; }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('El monto debe ser mayor a 0.'); return; }

        setSaving(true);
        try {
            await addExpense({
                description: description.trim(),
                amount: parsedAmount,
                category,
                date: new Date(dateStr + 'T12:00:00').getTime(),
                registeredBy: registeredBy.trim() || undefined,
                notes: notes.trim() || undefined,
            });
            onSave();
        } catch {
            setError('Error al guardar. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="glass-panel rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-2">
                    <ShoppingBag size={16} />
                    Datos del gasto
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Descripción *
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Ej. Cuerdas de guitarra, cables, etc."
                        className="input-field w-full"
                        autoFocus
                    />
                </div>

                {/* Monto */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Monto (Lempiras) *
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">L</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min="1"
                            step="0.01"
                            placeholder="0.00"
                            className="input-field w-full pl-8"
                        />
                    </div>
                </div>

                {/* Categoría */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Categoría
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setCategory(cat.value)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium',
                                    category === cat.value
                                        ? 'bg-primary/20 border-primary text-white'
                                        : 'border-white/10 text-text-muted hover:border-white/20 hover:text-white'
                                )}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fecha */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Fecha del gasto
                    </label>
                    <input
                        type="date"
                        value={dateStr}
                        onChange={e => setDateStr(e.target.value)}
                        className="input-field w-full"
                    />
                </div>

                {/* Registrado por */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Registrado por (opcional)
                    </label>
                    <input
                        type="text"
                        value={registeredBy}
                        onChange={e => setRegisteredBy(e.target.value)}
                        placeholder="Tu nombre"
                        className="input-field w-full"
                    />
                </div>

                {/* Notas */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Notas (opcional)
                    </label>
                    <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Detalles adicionales"
                        className="input-field w-full"
                    />
                </div>
            </div>

            {error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
                type="submit"
                disabled={saving}
                className={cn('btn-primary w-full flex items-center justify-center gap-2', saving && 'opacity-60 cursor-not-allowed')}
            >
                <Save size={18} />
                {saving ? 'Guardando…' : 'Guardar gasto'}
            </button>
        </form>
    );
}

// ─── Página principal del editor ─────────────────────────────────────────────

export function FinanceEditor() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialType = searchParams.get('tipo') === 'gasto' ? 'gasto' : 'aportacion';
    const [tipo, setTipo] = useState<'aportacion' | 'gasto'>(initialType);

    const handleSave = () => navigate('/finanzas');

    return (
        <div className="min-h-screen bg-background text-text-main">
            {/* Sticky header */}
            <header className="sticky top-0 z-30 glass-panel border-b border-white/5 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
                <Link
                    to="/finanzas"
                    className="p-2 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-2">
                    <Wallet size={20} className="text-green-400" />
                    <h1 className="font-bold text-lg">Nuevo registro</h1>
                </div>
            </header>

            <div className="max-w-lg mx-auto p-4 space-y-5 pb-24">
                {/* Selector de tipo */}
                <div className="flex bg-surface border border-white/10 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setTipo('aportacion')}
                        className={cn(
                            'flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors',
                            tipo === 'aportacion'
                                ? 'bg-green-600 text-white'
                                : 'text-text-muted hover:text-white hover:bg-white/5'
                        )}
                    >
                        <Users size={16} />
                        Aportación
                    </button>
                    <button
                        onClick={() => setTipo('gasto')}
                        className={cn(
                            'flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors',
                            tipo === 'gasto'
                                ? 'bg-red-600 text-white'
                                : 'text-text-muted hover:text-white hover:bg-white/5'
                        )}
                    >
                        <ShoppingBag size={16} />
                        Gasto
                    </button>
                </div>

                {tipo === 'aportacion' ? (
                    <ContributionForm onSave={handleSave} />
                ) : (
                    <ExpenseForm onSave={handleSave} />
                )}
            </div>
        </div>
    );
}
