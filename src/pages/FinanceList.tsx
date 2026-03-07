import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useLiveSession } from '../contexts/LiveSessionContext';
import {
    Wallet, Plus, TrendingUp, TrendingDown, DollarSign,
    Trash2, ChevronDown, ChevronUp, ShoppingBag, Users,
    BarChart3, AlertCircle, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Contribution, Expense, MemberDebt } from '../types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<Expense['category'], string> = {
    insumos: 'Insumos',
    equipamiento: 'Equipamiento',
    transporte: 'Transporte',
    alimentacion: 'Alimentación',
    otro: 'Otro',
};

const CATEGORY_STYLES: Record<Expense['category'], { bg: string; text: string; icon: string }> = {
    insumos: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', icon: '🎸' },
    equipamiento: { bg: 'bg-purple-500/15', text: 'text-purple-400', icon: '🎛️' },
    transporte: { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: '🚗' },
    alimentacion: { bg: 'bg-green-500/15', text: 'text-green-400', icon: '🍽️' },
    otro: { bg: 'bg-white/10', text: 'text-text-muted', icon: '📦' },
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon: Icon,
    colorClass,
    sub,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    colorClass: string;
    sub?: string;
}) {
    return (
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorClass)}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-xs text-text-muted uppercase tracking-widest font-semibold">{label}</p>
                <p className="text-2xl font-black text-text-main mt-0.5">{value}</p>
                {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function ContributionRow({
    contribution,
    canDelete,
    onDelete,
}: {
    contribution: Contribution;
    canDelete: boolean;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/3 transition-colors group">
            <div className="w-8 h-8 bg-green-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                <Users size={14} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-text-main truncate">{contribution.memberName}</p>
                <p className="text-[11px] text-text-muted truncate">{contribution.weekLabel}</p>
                {contribution.notes && (
                    <p className="text-[11px] text-text-muted/70 italic truncate">{contribution.notes}</p>
                )}
            </div>
            <span className="text-green-400 font-bold text-sm flex-shrink-0">
                +L {contribution.amount.toFixed(2)}
            </span>
            {canDelete && (
                <button
                    onClick={() => onDelete(contribution.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/20 transition-all ml-1"
                    title="Eliminar aportación"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
}

function ExpenseRow({
    expense,
    canDelete,
    onDelete,
}: {
    expense: Expense;
    canDelete: boolean;
    onDelete: (id: string) => void;
}) {
    const style = CATEGORY_STYLES[expense.category];
    return (
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/3 transition-colors group">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base', style.bg)}>
                {style.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-text-main truncate">{expense.description}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full', style.bg, style.text)}>
                        {CATEGORY_LABELS[expense.category]}
                    </span>
                    <span className="text-[11px] text-text-muted">
                        {new Date(expense.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {expense.registeredBy && (
                        <span className="text-[11px] text-text-muted">· {expense.registeredBy}</span>
                    )}
                </div>
                {expense.notes && (
                    <p className="text-[11px] text-text-muted/70 italic truncate mt-0.5">{expense.notes}</p>
                )}
            </div>
            <span className="text-red-400 font-bold text-sm flex-shrink-0">
                -L {expense.amount.toFixed(2)}
            </span>
            {canDelete && (
                <button
                    onClick={() => onDelete(expense.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/20 transition-all ml-1"
                    title="Eliminar gasto"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
}

// ─── DebtCard ─────────────────────────────────────────────────────────────────

function DebtCard({ debt }: { debt: MemberDebt }) {
    const [expanded, setExpanded] = useState(false);
    const pct = debt.applicableWeeks > 0
        ? Math.round((debt.paidWeeks / debt.applicableWeeks) * 100)
        : 100;

    return (
        <div className={cn(
            'glass-panel rounded-2xl overflow-hidden transition-all',
            !debt.isUpToDate && 'border border-red-500/20'
        )}>
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/3 transition-colors text-left"
            >
                {/* Avatar inicial */}
                <div className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0',
                    debt.isUpToDate
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                )}>
                    {debt.memberName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-text-main truncate">{debt.memberName}</p>
                        {debt.isUpToDate ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                <CheckCircle2 size={10} /> Al día
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                <AlertCircle size={10} /> {debt.missedWeeks} sem.
                            </span>
                        )}
                    </div>

                    {/* Barra de cumplimiento */}
                    <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 bg-surface rounded-full h-1.5 overflow-hidden">
                            <div
                                className={cn(
                                    'h-1.5 rounded-full transition-all duration-500',
                                    debt.isUpToDate ? 'bg-green-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'
                                )}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-text-muted flex-shrink-0">
                            {debt.paidWeeks}/{debt.applicableWeeks} sem.
                        </span>
                    </div>
                </div>

                <div className="text-right flex-shrink-0">
                    {debt.isUpToDate ? (
                        <p className="text-green-400 font-bold text-sm">✓ L {debt.totalPaid.toFixed(0)}</p>
                    ) : (
                        <>
                            <p className="text-red-400 font-bold text-sm">-L {debt.debtAmount.toFixed(0)}</p>
                            <p className="text-[10px] text-text-muted">aportado: L {debt.totalPaid.toFixed(0)}</p>
                        </>
                    )}
                </div>

                <ChevronRight
                    size={16}
                    className={cn(
                        'text-white/20 transition-transform flex-shrink-0',
                        expanded && 'rotate-90'
                    )}
                />
            </button>

            {/* Detalle expandible: semanas adeudadas */}
            {expanded && !debt.isUpToDate && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">
                        Semanas pendientes ({debt.missedWeeks})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {debt.missedWeekLabels.map((label, i) => (
                            <span
                                key={i}
                                className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg font-medium"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                        Total adeudado: <span className="text-red-400 font-bold">L {debt.debtAmount.toFixed(2)}</span>
                    </p>
                </div>
            )}
            {expanded && debt.isUpToDate && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <p className="text-sm text-green-400 text-center py-2">
                        🎉 ¡Ha aportado todas las semanas!
                    </p>
                    <p className="text-xs text-text-muted text-center">
                        Total aportado: L {debt.totalPaid.toFixed(2)} en {debt.paidWeeks} semanas
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────

type ActiveTab = 'resumen' | 'aportaciones' | 'gastos' | 'deudas';

export function FinanceList() {
    const {
        contributions, expenses, loading,
        totalContributions, totalExpenses, balance,
        deleteContribution, deleteExpense,
        memberDebts, totalWeeks,
    } = useFinance();
    const { isDirector } = useLiveSession();

    const [activeTab, setActiveTab] = useState<ActiveTab>('resumen');
    const [showAllContributions, setShowAllContributions] = useState(false);
    const [showAllExpenses, setShowAllExpenses] = useState(false);

    // Miembros con deuda (para el badge)
    const debtCount = memberDebts.filter(d => !d.isUpToDate).length;

    // ── Agrupaciones para la vista Resumen ──────────────────────────────
    const byWeek = useMemo(() => {
        const map: Record<string, { label: string; start: number; contributions: Contribution[]; total: number }> = {};
        contributions.forEach(c => {
            const key = c.weekStart.toString();
            if (!map[key]) map[key] = { label: c.weekLabel, start: c.weekStart, contributions: [], total: 0 };
            map[key].contributions.push(c);
            map[key].total += c.amount;
        });
        return Object.values(map).sort((a, b) => b.start - a.start);
    }, [contributions]);

    // ── Gastos por categoría (para el mini-chart) ─────────────────────
    const expensesByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        expenses.forEach(e => {
            map[e.category] = (map[e.category] ?? 0) + e.amount;
        });
        return Object.entries(map)
            .map(([cat, total]) => ({ cat: cat as Expense['category'], total }))
            .sort((a, b) => b.total - a.total);
    }, [expenses]);

    const displayedContributions = showAllContributions ? contributions : contributions.slice(0, 8);
    const displayedExpenses = showAllExpenses ? expenses : expenses.slice(0, 8);

    const handleDeleteContribution = async (id: string) => {
        if (!confirm('¿Eliminar esta aportación?')) return;
        await deleteContribution(id);
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('¿Eliminar este gasto?')) return;
        await deleteExpense(id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-text-muted">
                Cargando finanzas…
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-24">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Wallet size={28} className="text-green-400" />
                        Finanzas
                    </h1>
                    <p className="text-text-muted mt-1">Aportaciones y gastos del ministerio</p>
                </div>
                {isDirector && (
                    <Link
                        to="/finanzas/add"
                        className="btn-primary flex items-center gap-2 text-sm shadow-xl shadow-primary/20"
                    >
                        <Plus size={18} />
                        <span>Registrar</span>
                    </Link>
                )}
            </div>

            {/* ── Stats cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Saldo disponible"
                    value={`L ${balance.toFixed(2)}`}
                    icon={DollarSign}
                    colorClass={balance >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                    sub={balance >= 0 ? 'Fondos en caja' : 'Déficit'}
                />
                <StatCard
                    label="Total aportado"
                    value={`L ${totalContributions.toFixed(2)}`}
                    icon={TrendingUp}
                    colorClass="bg-green-500/20 text-green-400"
                    sub={`${contributions.length} aportaciones`}
                />
                <StatCard
                    label="Total gastado"
                    value={`L ${totalExpenses.toFixed(2)}`}
                    icon={TrendingDown}
                    colorClass="bg-red-500/20 text-red-400"
                    sub={`${expenses.length} gastos registrados`}
                />
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────────── */}
            <div className="flex bg-surface border border-white/10 rounded-xl overflow-hidden w-fit flex-wrap">
                {([
                    { key: 'resumen', label: '📊 Resumen' },
                    { key: 'aportaciones', label: '💰 Aportaciones' },
                    { key: 'gastos', label: '🛒 Gastos' },
                    { key: 'deudas', label: '⚠️ Deudas', badge: debtCount > 0 ? debtCount : undefined },
                ] as { key: ActiveTab; label: string; badge?: number }[]).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'px-4 py-2 text-sm font-semibold transition-colors relative',
                            activeTab === tab.key
                                ? 'bg-primary text-white'
                                : 'text-text-muted hover:text-white hover:bg-white/5'
                        )}
                    >
                        {tab.label}
                        {tab.badge !== undefined && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab: Resumen ──────────────────────────────────────────────── */}
            {activeTab === 'resumen' && (
                <div className="space-y-6">

                    {/* Barra de progreso: aportado vs gastado */}
                    {totalContributions > 0 && (
                        <div className="glass-panel rounded-2xl p-5 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-text-main">
                                <BarChart3 size={16} className="text-primary" />
                                Uso del fondo
                            </div>
                            <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-3 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min((totalExpenses / totalContributions) * 100, 100)}%`,
                                        background: totalExpenses > totalContributions
                                            ? 'rgb(248 113 113)' // red-400
                                            : 'linear-gradient(to right, #22c55e, #06b6d4)',
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-text-muted">
                                <span>Gastado: L {totalExpenses.toFixed(2)}</span>
                                <span>{totalContributions > 0 ? ((totalExpenses / totalContributions) * 100).toFixed(1) : 0}%</span>
                                <span>Aportado: L {totalContributions.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Gastos por categoría */}
                    {expensesByCategory.length > 0 && (
                        <div className="glass-panel rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-text-main">
                                <ShoppingBag size={16} className="text-accent" />
                                Gastos por categoría
                            </div>
                            <div className="space-y-3">
                                {expensesByCategory.map(({ cat, total }) => {
                                    const style = CATEGORY_STYLES[cat];
                                    const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                                    return (
                                        <div key={cat} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className={cn('font-semibold', style.text)}>
                                                    {style.icon} {CATEGORY_LABELS[cat]}
                                                </span>
                                                <span className="text-text-muted">
                                                    L {total.toFixed(2)} ({pct.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-surface rounded-full h-1.5">
                                                <div
                                                    className={cn('h-1.5 rounded-full transition-all duration-500', style.bg.replace('/15', '/60'))}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Historial por semana */}
                    <div className="glass-panel rounded-2xl p-5 space-y-4">
                        <p className="text-sm font-bold text-text-main">Aportaciones por semana</p>
                        {byWeek.length === 0 ? (
                            <p className="text-text-muted text-sm italic text-center py-6">
                                Sin aportaciones registradas aún.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {byWeek.map((week) => (
                                    <div key={week.start} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {week.label}
                                            </span>
                                            <span className="text-green-400 font-bold text-sm">
                                                L {week.total.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {week.contributions.map(c => (
                                                <span
                                                    key={c.id}
                                                    className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-medium"
                                                >
                                                    {c.memberName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Aportaciones ────────────────────────────────────────── */}
            {activeTab === 'aportaciones' && (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <p className="font-bold text-sm text-text-main">
                            Aportaciones ({contributions.length})
                        </p>
                        {isDirector && (
                            <Link
                                to="/finanzas/add?tipo=aportacion"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <Plus size={12} /> Agregar
                            </Link>
                        )}
                    </div>
                    {contributions.length === 0 ? (
                        <div className="text-center py-12 text-text-muted text-sm">
                            Sin aportaciones registradas.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {displayedContributions.map(c => (
                                <ContributionRow
                                    key={c.id}
                                    contribution={c}
                                    canDelete={isDirector}
                                    onDelete={handleDeleteContribution}
                                />
                            ))}
                        </div>
                    )}
                    {contributions.length > 8 && (
                        <button
                            onClick={() => setShowAllContributions(v => !v)}
                            className="w-full py-3 text-xs text-text-muted hover:text-white transition-colors flex items-center justify-center gap-1 border-t border-white/5"
                        >
                            {showAllContributions ? (
                                <><ChevronUp size={14} /> Ver menos</>
                            ) : (
                                <><ChevronDown size={14} /> Ver {contributions.length - 8} más</>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* ── Tab: Gastos ──────────────────────────────────────────────── */}
            {activeTab === 'gastos' && (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <p className="font-bold text-sm text-text-main">
                            Gastos ({expenses.length})
                        </p>
                        {isDirector && (
                            <Link
                                to="/finanzas/add?tipo=gasto"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <Plus size={12} /> Agregar
                            </Link>
                        )}
                    </div>
                    {expenses.length === 0 ? (
                        <div className="text-center py-12 text-text-muted text-sm">
                            Sin gastos registrados.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {displayedExpenses.map(e => (
                                <ExpenseRow
                                    key={e.id}
                                    expense={e}
                                    canDelete={isDirector}
                                    onDelete={handleDeleteExpense}
                                />
                            ))}
                        </div>
                    )}
                    {expenses.length > 8 && (
                        <button
                            onClick={() => setShowAllExpenses(v => !v)}
                            className="w-full py-3 text-xs text-text-muted hover:text-white transition-colors flex items-center justify-center gap-1 border-t border-white/5"
                        >
                            {showAllExpenses ? (
                                <><ChevronUp size={14} /> Ver menos</>
                            ) : (
                                <><ChevronDown size={14} /> Ver {expenses.length - 8} más</>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* ── Tab: Deudas ──────────────────────────────────────────────── */}
            {activeTab === 'deudas' && (
                <div className="space-y-4">
                    {/* Resumen rápido de deudas */}
                    {memberDebts.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="glass-panel rounded-xl p-3 text-center">
                                <p className="text-xl font-black text-text-main">{memberDebts.length}</p>
                                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Miembros</p>
                            </div>
                            <div className="glass-panel rounded-xl p-3 text-center">
                                <p className="text-xl font-black text-red-400">{debtCount}</p>
                                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Con deuda</p>
                            </div>
                            <div className="glass-panel rounded-xl p-3 text-center">
                                <p className="text-xl font-black text-amber-400">
                                    L {memberDebts.reduce((s, d) => s + d.debtAmount, 0).toFixed(0)}
                                </p>
                                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Total pendiente</p>
                            </div>
                        </div>
                    )}

                    {/* Info de semanas */}
                    {totalWeeks > 0 && (
                        <div className="flex items-center gap-2 text-xs text-text-muted bg-surface/50 border border-white/5 rounded-xl px-4 py-2.5">
                            <BarChart3 size={14} className="text-primary flex-shrink-0" />
                            <span>
                                Sistema activo hace <span className="text-text-main font-bold">{totalWeeks} semana{totalWeeks !== 1 ? 's' : ''}</span>.
                                Aportación estándar: <span className="text-green-400 font-bold">L 50 / semana</span>.
                            </span>
                        </div>
                    )}

                    {/* Lista de miembros */}
                    {memberDebts.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="bg-surface w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-dashed border-white/20">
                                👥
                            </div>
                            <h3 className="text-lg font-bold text-text-main">Sin miembros aún</h3>
                            <p className="text-text-muted text-sm mt-1 max-w-xs mx-auto">
                                Una vez que registres aportaciones, aquí aparecerá el estado de cada miembro.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Miembros con deuda primero */}
                            {debtCount > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                                        <AlertCircle size={12} /> Con semanas pendientes ({debtCount})
                                    </p>
                                    {memberDebts.filter(d => !d.isUpToDate).map(d => (
                                        <DebtCard key={d.memberName} debt={d} />
                                    ))}
                                </div>
                            )}

                            {/* Miembros al día */}
                            {memberDebts.some(d => d.isUpToDate) && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-green-400 flex items-center gap-2">
                                        <CheckCircle2 size={12} /> Al día ({memberDebts.filter(d => d.isUpToDate).length})
                                    </p>
                                    {memberDebts.filter(d => d.isUpToDate).map(d => (
                                        <DebtCard key={d.memberName} debt={d} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Disclaimer */}
                    {memberDebts.length > 0 && (
                        <p className="text-[11px] text-text-muted/60 text-center pb-2">
                            * El cálculo es automático desde la semana de la primera aportación de cada miembro.
                        </p>
                    )}
                </div>
            )}

            {/* ── Estado vacío general ──────────────────────────────────────── */}
            {contributions.length === 0 && expenses.length === 0 && (
                <div className="text-center py-16">
                    <div className="bg-surface w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border border-dashed border-white/20">
                        💰
                    </div>
                    <h3 className="text-lg font-bold text-text-main">Sin registros aún</h3>
                    <p className="text-text-muted text-sm mt-1 max-w-xs mx-auto">
                        Registra las aportaciones semanales de L 50 y los gastos del ministerio.
                    </p>
                    {isDirector && (
                        <Link to="/finanzas/add" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                            <Plus size={16} /> Primer registro
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
