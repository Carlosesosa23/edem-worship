import { useState, useCallback } from 'react';
import type { Song } from '../types';
import { transposeContent, getSemitonesDifference } from '../lib/transpose';

/** Estado del botón compartir */
type ShareStatus = 'idle' | 'copied' | 'shared' | 'error';

/**
 * Genera el texto plano de una canción (letra + acordes en bracket notation)
 * con el tono transpuesto si es necesario, listo para compartir/copiar.
 */
function buildSongText(song: Song, displayKey: string): string {
    const semitones = getSemitonesDifference(song.key, displayKey);
    const content = semitones !== 0
        ? transposeContent(song.content, semitones, song.key)
        : song.content;

    const keyLine = displayKey !== song.key
        ? `Tono: ${displayKey} (original: ${song.key})`
        : `Tono: ${song.key}`;

    const meta = [
        `🎵 ${song.title}`,
        `Artista: ${song.artist}`,
        keyLine,
        song.bpm ? `BPM: ${song.bpm}` : null,
    ].filter(Boolean).join('\n');

    return `${meta}\n\n${content}\n\n— Compartido desde EDEM Worship`;
}

/**
 * Hook que expone `share(song, displayKey)` y el estado del botón.
 *
 * Estrategia:
 *  1. Si el navegador soporta `navigator.share` → abre el diálogo nativo (móvil)
 *  2. Si no → copia al portapapeles y muestra feedback "Copiado"
 */
export function useShareSong() {
    const [status, setStatus] = useState<ShareStatus>('idle');

    const share = useCallback(async (song: Song, displayKey: string) => {
        const text = buildSongText(song, displayKey);
        const title = `${song.title} – ${song.artist}`;

        // Intenta Web Share API (funciona en móvil y algunos desktop modernos)
        if (navigator.share) {
            try {
                await navigator.share({ title, text });
                setStatus('shared');
                setTimeout(() => setStatus('idle'), 2500);
            } catch (err) {
                // El usuario canceló el diálogo nativo — no es un error real
                const isCancelled = err instanceof DOMException && err.name === 'AbortError';
                if (!isCancelled) {
                    // Fallback a clipboard si share falla por otra razón
                    await copyToClipboard(text);
                    setStatus('copied');
                    setTimeout(() => setStatus('idle'), 2500);
                }
                // Si canceló, no hacer nada
            }
        } else {
            // Fallback: copiar al portapapeles
            await copyToClipboard(text);
            setStatus('copied');
            setTimeout(() => setStatus('idle'), 2500);
        }
    }, []);

    return { share, status };
}

async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return 'copied';
    } catch {
        // clipboard API no disponible (HTTP sin HTTPS) — fallback execCommand
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return 'copied';
    }
}
