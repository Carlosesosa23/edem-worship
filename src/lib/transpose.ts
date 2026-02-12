// Extended Note Definitions
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const NOTES = NOTES_SHARP; // Default export for backwards compat

export function getNoteIndex(note: string): number {
    // Normalize: remove accidental suffix logic if customized later, currently exact match or generic lookup
    // Handle double flats/sharps if needed? user didn't ask but good to know.
    // Simplifying to find semitone index 0-11

    // Normalize flats/sharps for index finding
    // 'Cb' = 'B', 'E#' = 'F', 'Fb' = 'E', 'B#' = 'C'
    const n = note.replace('Cb', 'B').replace('E#', 'F').replace('Fb', 'E').replace('B#', 'C');

    let index = NOTES_SHARP.indexOf(n);
    if (index === -1) index = NOTES_FLAT.indexOf(n);

    return index;
}

// Logic to determine if we should use Sharps or Flats based on the target key
function shouldUseFlats(root: string, semitones: number): boolean {
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm'];
    const currentKeyIndex = getNoteIndex(root);
    if (currentKeyIndex === -1) return false;

    let targetIndex = (currentKeyIndex + semitones) % 12;
    if (targetIndex < 0) targetIndex += 12;

    const targetRoot = NOTES_FLAT[targetIndex];
    return flatKeys.includes(targetRoot) || flatKeys.includes(targetRoot + 'm');
}

export function transposeNote(note: string, semitones: number, useFlats?: boolean): string {
    const index = getNoteIndex(note);
    if (index === -1) return note;

    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    // Use explicit preference or default heuristic
    if (useFlats) return NOTES_FLAT[newIndex];

    // If no preference, we need a default.
    // Usually sharps are default unless specific keys.
    return NOTES_SHARP[newIndex];
}

export function transposeContent(content: string, semitones: number, originalKey: string = 'C'): string {
    // Determine target key to decide on flats/sharps globally for the song
    const targetFlats = shouldUseFlats(originalKey, semitones);

    // Process line by line to detect unbracketed chord lines
    const lines = content.split('\n');
    return lines.map(line => {
        // If line is empty, return empty
        if (!line.trim()) return line;

        // If line already has brackets, use existing logic
        if (line.includes('[')) {
            return transposeLine(line, semitones, targetFlats);
        }

        // Check if line is a "Chord Line" (mostly valid chords)
        const tokens = line.split(/\s+/).filter(t => t.trim());
        if (tokens.length === 0) return line;

        // Pattern for valid chords like C#m7, F/G, Dsus4
        const chordPattern = /^[A-G][#b]?(m|min|maj|dim|aug|sus|add|[0-9])*(\/[A-G][#b]?)?$/;
        const validChordCount = tokens.filter(t => chordPattern.test(t)).length;

        // If > 50% of tokens are chords, treat as a chord line
        if (validChordCount / tokens.length >= 0.5) {
            // Split preserving whitespace
            const parts = line.split(/(\s+)/);
            return parts.map(part => {
                if (!part.trim()) return part; // return whitespace as is

                // If part matches chord pattern, transpose and bracket it
                if (chordPattern.test(part)) {
                    // We wrap in brackets to signal it's a chord for view logic
                    // And transpose correctly
                    return transposeLine(`[${part}]`, semitones, targetFlats);
                }
                return part;
            }).join('');
        }

        // Regular text line
        return line;
    }).join('\n');
}

// Helper to transpose a single bracketed string (extracted from original transposeContent)
function transposeLine(line: string, semitones: number, targetFlats: boolean): string {
    return line.replace(/\[([A-G][#b]?)(.*?)\]/g, (_match: string, root: string, suffix: string) => {
        if (suffix.includes('/')) {
            const [mainSuffix, bass] = suffix.split('/');
            const transposedRoot = transposeNote(root, semitones, targetFlats);
            const bassMatch = bass.match(/^([A-G][#b]?)(.*)$/);
            if (bassMatch) {
                const transposedBass = transposeNote(bassMatch[1], semitones, targetFlats);
                return `[${transposedRoot}${mainSuffix}/${transposedBass}${bassMatch[2]}]`;
            }
            return `[${transposedRoot}${suffix}]`;
        }
        const transposedRoot = transposeNote(root, semitones, targetFlats);
        return `[${transposedRoot}${suffix}]`;
    });
}

export const ALL_KEYS = [
    'C', 'C#', 'Db', 'D', 'Eb', 'D#', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'G#', 'A', 'Bb', 'A#', 'B',
    'Cm', 'C#m', 'Dbm', 'Dm', 'Ebm', 'D#m', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'Abm', 'G#m', 'Am', 'Bbm', 'A#m', 'Bm'
];

export const MAJOR_KEYS = [
    'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'Gb'
];

export const MINOR_KEYS = [
    'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'A#m'
];

export function getSemitonesDifference(originalKey: string, targetKey: string): number {
    const index1 = getNoteIndex(originalKey.replace(/m$/, ''));
    const index2 = getNoteIndex(targetKey.replace(/m$/, ''));

    if (index1 === -1 || index2 === -1) return 0;

    let diff = index2 - index1;
    // Normalize to easiest direction? Or just positive mod?
    return diff;
}
