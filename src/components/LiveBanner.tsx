import { useEffect, useState } from 'react';
import { useLiveSession, SIGNALS } from '../contexts/LiveSessionContext';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function LiveBanner() {
    const { liveState } = useLiveSession();
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-navigate to active song if we're not already there
    useEffect(() => {
        if (liveState.activeSongId) {
            const currentPath = location.pathname;
            const targetPath = `/songs/${liveState.activeSongId}`;

            // Only suggest or navigate if we are not editing
            if (!currentPath.includes('/edit') && currentPath !== targetPath) {
                // For now, we'll just show a "Go to Song" button in the banner or silently navigate
                // Let's silently navigate for "Seamless" experience if user is on list or home
                if (currentPath === '/' || currentPath === '/songs' || currentPath.startsWith('/songs/')) {
                    // navigate(targetPath); // Uncomment to force navigation
                }
            }
        }
    }, [liveState.activeSongId, location.pathname, navigate]);

    useEffect(() => {
        if (liveState.currentSignal) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [liveState.currentSignal]);

    if (!liveState.currentSignal || !isVisible) return null;

    const signalConfig = SIGNALS.find(s => s.label === liveState.currentSignal);
    const bgColor = signalConfig?.color || "bg-primary";

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
                    <motion.div
                        key={`${liveState.currentSignal}-${liveState.timestamp}`} // Restart animation on EVERY update
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            filter: ["brightness(1)", "brightness(2)", "brightness(1)", "brightness(2)", "brightness(1)"] // Flash effect
                        }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className={cn(
                            "p-4 rounded-xl flex items-center justify-between border-2 border-white/40 backdrop-blur-md text-white shadow-2xl",
                            bgColor
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/30 p-2 rounded-full animate-bounce">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold opacity-90 uppercase tracking-widest text-white/80">Director dice:</p>
                                <h2 className="text-3xl font-black tracking-tighter drop-shadow-md">{liveState.currentSignal}</h2>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
