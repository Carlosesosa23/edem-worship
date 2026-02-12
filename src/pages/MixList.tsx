import { Link } from 'react-router-dom';
import { useMixes } from '../contexts/MixesContext';
import { Plus, Calendar, ChevronRight, Disc } from 'lucide-react';

export function MixList() {
    const { mixes, loading } = useMixes();

    return (
        <div className="space-y-6 pb-24">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                        Mis Mixes
                    </h1>
                    <p className="text-text-muted mt-1">Listas para el servicio</p>
                </div>
                <Link to="/mixes/add" className="btn-primary flex items-center gap-2 text-sm shadow-xl shadow-primary/20">
                    <Plus size={18} />
                    <span>Nuevo Mix</span>
                </Link>
            </div>

            {loading ? (
                <div className="text-center text-text-muted py-10">Cargando mixes...</div>
            ) : (
                <div className="grid gap-3">
                    {mixes.map(mix => (
                        <Link
                            key={mix.id}
                            to={`/mixes/${mix.id}`}
                            className="glass-panel p-4 rounded-xl flex items-center justify-between group hover:bg-white/5 transition-all active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:text-white group-hover:bg-secondary transition-colors">
                                    <Disc size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-main group-hover:text-white transition-colors">{mix.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-text-muted">
                                        <Calendar size={14} />
                                        <span>{new Date(mix.date).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                        <span>{mix.songs.length} canciones</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="text-white/20 group-hover:text-white/50 transition-colors" />
                        </Link>
                    ))}

                    {mixes.length === 0 && (
                        <div className="text-center py-16">
                            <div className="bg-surface w-16 h-16 rounded-full flex items-center justify-center text-text-muted mx-auto mb-4 border border-dashed border-white/20">
                                <Link to="/mixes/add">
                                    <Plus size={32} className="text-text-muted hover:text-primary transition-colors" />
                                </Link>
                            </div>
                            <h3 className="text-lg font-bold text-text-main">No hay mixes creados</h3>
                            <Link to="/mixes/add" className="text-primary hover:underline mt-2 inline-block">
                                Crear mi primer mix
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
