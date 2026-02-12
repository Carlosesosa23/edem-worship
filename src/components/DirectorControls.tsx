import { useState } from 'react';
import { useLiveSession, SIGNALS } from '../contexts/LiveSessionContext';
import { X, Mic2, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export function DirectorControls() {
    const { isDirector, sendSignal, clearSignal, liveState } = useLiveSession();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!isDirector) return null;

    return (
        <>
            {/* Toggle Button - Always visible when director mode is active */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="fixed bottom-24 right-4 z-50 bg-accent text-white p-3 rounded-full shadow-lg shadow-accent/30 flex items-center justify-center hover:scale-105 transition-transform"
                title="Controles de Director"
            >
                {isExpanded ? <X size={24} /> : <Activity size={24} />}
            </button>

            {/* Controls Panel */}
            <div className={cn(
                "fixed bottom-36 right-4 z-50 bg-surface/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl w-64 transition-all duration-300 origin-bottom-right",
                isExpanded ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
            )}>
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Mic2 size={16} className="text-secondary" />
                        Modo Director
                    </h3>
                    <button onClick={clearSignal} className="text-xs text-text-muted hover:text-white">
                        Limpiar Alerta
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {SIGNALS.map((signal) => (
                        <button
                            key={signal.label}
                            onClick={() => sendSignal(signal.label)}
                            className={cn(
                                "p-2 rounded-lg text-xs font-bold text-white transition-all active:scale-95 shadow-md truncate",
                                signal.color,
                                liveState.currentSignal === signal.label ? "ring-2 ring-white/50 scale-105" : "opacity-90 hover:opacity-100"
                            )}
                        >
                            {signal.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-center">
                    <p className="text-[10px] text-text-muted">
                        Tus señales se muestran a todo el equipo
                    </p>
                </div>
            </div>
        </>
    );
}
