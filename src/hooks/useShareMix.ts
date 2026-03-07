import { useState, useCallback } from 'react';
import type { Mix, Song } from '../types';

type ShareStatus = 'idle' | 'copied' | 'shared' | 'error';

/**
 * Genera el texto plano del repertorio completo de un mix.
 * Formato limpio y legible para WhatsApp / clipboard.
 */
function buildMixText(mix: Mix, songs: Song[]): string {
    const date = new Date(mix.date).toLocaleDateString('es-HN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Capitalizar primera letra de la fecha
    const dateStr = date.charAt(0).toUpperCase() + date.slice(1);

    const songLines = mix.songs
        .map((songId, idx) => {
            const song = songs.find(s => s.id === songId);
            if (!song) return null;
            const bpmPart = song.bpm ? `  •  ${song.bpm} BPM` : '';
            return `${idx + 1}. ${song.title}  🎵 ${song.key}${bpmPart}`;
        })
        .filter(Boolean)
        .join('\n');

    const totalSongs = mix.songs.filter(id => songs.find(s => s.id === id)).length;
    const separator = '─'.repeat(30);

    const lines: string[] = [
        `📋 REPERTORIO`,
        mix.title,
        `📅 ${dateStr}`,
        '',
        songLines,
        '',
        separator,
        `${totalSongs} canción${totalSongs !== 1 ? 'es' : ''} · EDEM Worship`,
    ];

    if (mix.description) {
        lines.splice(3, 0, `📝 ${mix.description}`);
    }

    return lines.join('\n');
}

async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
}

export function useShareMix() {
    const [status, setStatus] = useState<ShareStatus>('idle');

    const share = useCallback(async (mix: Mix, songs: Song[]) => {
        const text = buildMixText(mix, songs);
        const title = mix.title;

        if (navigator.share) {
            try {
                await navigator.share({ title, text });
                setStatus('shared');
                setTimeout(() => setStatus('idle'), 2500);
            } catch (err) {
                const isCancelled = err instanceof DOMException && err.name === 'AbortError';
                if (!isCancelled) {
                    await copyToClipboard(text);
                    setStatus('copied');
                    setTimeout(() => setStatus('idle'), 2500);
                }
            }
        } else {
            await copyToClipboard(text);
            setStatus('copied');
            setTimeout(() => setStatus('idle'), 2500);
        }
    }, []);

    return { share, status };
}
