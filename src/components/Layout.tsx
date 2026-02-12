import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Music, Disc } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { LiveBanner } from './LiveBanner';
import { DirectorControls } from './DirectorControls';

export function Layout() {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Inicio', path: '/' },
        { icon: Music, label: 'Canciones', path: '/songs' },
        { icon: Disc, label: 'Mixes', path: '/mixes' },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background text-text-main">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/5 m-4 rounded-2xl">
                <div className="p-8 flex items-center justify-center gap-3">
                    <img src="/logo.png" alt="Edem Logo" className="w-10 h-10 object-contain" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tighter">
                        EDEM WORSHIP
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                                    : "text-text-muted hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4">
                    <div className="bg-surface rounded-xl p-4 border border-white/5">
                        <p className="text-xs text-text-muted text-center">Edem Worship v1.0</p>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 z-50 pb-safe">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => clsx(
                                "flex flex-col items-center justify-center w-full h-full transition-colors",
                                isActive ? "text-primary" : "text-text-muted"
                            )}
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className={clsx("p-1 rounded-full", location.pathname === item.path && "bg-primary/10")}
                            >
                                <item.icon size={24} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
                            </motion.div>
                            <span className="text-[10px] font-medium mt-1">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth pb-20 md:pb-0">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>

            {/* Live Session Overlays */}
            <LiveBanner />
            <DirectorControls />
        </div>
    );
}
