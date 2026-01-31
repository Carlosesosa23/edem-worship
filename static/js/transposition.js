// Basic Chromatic Map for Indexing
const NOTE_TO_INDEX = {
    'C': 0, 'B#': 0,
    'C#': 1, 'Db': 1,
    'D': 2,
    'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4,
    'F': 5, 'E#': 5,
    'F#': 6, 'Gb': 6,
    'G': 7,
    'G#': 8, 'Ab': 8,
    'A': 9,
    'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11
};

const INDEX_TO_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const INDEX_TO_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// 1. Define User's Scales explicitly
const USER_SCALES = {
    // MAYORES
    'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
    'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    'Gb': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],

    // MENORES
    'Am': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    'Em': ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    'Bm': ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
    'F#m': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
    'C#m': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
    'G#m': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
    'Dm': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
    'Gm': ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
    'Cm': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    'Fm': ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
    'Bbm': ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
    'Ebm': ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],

    // EXTRA SCALES
    'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
    'D#': ['D#', 'E#', 'F#', 'G#', 'A#', 'B#', 'C#'],
    'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
    'G#': ['G#', 'A#', 'B#', 'C#', 'D#', 'E#', 'F#'],
    'A#': ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G#'],

    'Cb': ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
    'Fb': ['Fb', 'Gb', 'Ab', 'Bbb', 'Cb', 'Db', 'Eb']
};

const INDEX_TO_KEY_NAME_MAJOR = {};
const INDEX_TO_KEY_NAME_MINOR = {};

function initKeyMaps() {
    for (let key in USER_SCALES) {
        let isMinor = key.includes('m');
        let root = key.replace('m', '');
        let idx = NOTE_TO_INDEX[root];

        if (idx === undefined) continue;

        if (isMinor) {
            if (!INDEX_TO_KEY_NAME_MINOR[idx]) INDEX_TO_KEY_NAME_MINOR[idx] = key;
        } else {
            if (!INDEX_TO_KEY_NAME_MAJOR[idx]) INDEX_TO_KEY_NAME_MAJOR[idx] = key;
        }
    }
    // Fallbacks
    for (let i = 0; i < 12; i++) {
        if (!INDEX_TO_KEY_NAME_MAJOR[i]) INDEX_TO_KEY_NAME_MAJOR[i] = INDEX_TO_SHARP[i];
        if (!INDEX_TO_KEY_NAME_MINOR[i]) INDEX_TO_KEY_NAME_MINOR[i] = INDEX_TO_SHARP[i] + 'm';
    }
}
initKeyMaps();

function getRootFromKey(key) {
    let match = key.match(/^([A-G](?:#|b)?)/);
    return match ? match[1] : null;
}

function getKeyIndex(key) {
    let root = getRootFromKey(key);
    return root ? NOTE_TO_INDEX[root] : -1;
}

function getNextKeyName(originalKey, semitones) {
    if (!originalKey) return null;
    let isMinor = originalKey.includes('m');
    let idx = getKeyIndex(originalKey);
    if (idx === -1) return null;

    let newIdx = (idx + semitones) % 12;
    if (newIdx < 0) newIdx += 12;

    return isMinor ? INDEX_TO_KEY_NAME_MINOR[newIdx] : INDEX_TO_KEY_NAME_MAJOR[newIdx];
}

function spellNoteForKey(noteIndex, targetKeyName) {
    let scale = USER_SCALES[targetKeyName];
    if (scale) {
        for (let note of scale) {
            if (NOTE_TO_INDEX[note] === noteIndex) {
                return note;
            }
        }
    }
    // Fallback logic
    let preferFlats = targetKeyName.includes('b') || targetKeyName === 'F' || targetKeyName === 'Dm' || targetKeyName === 'Gm' || targetKeyName === 'Cm' || targetKeyName === 'Fm';
    return preferFlats ? INDEX_TO_FLAT[noteIndex] : INDEX_TO_SHARP[noteIndex];
}

const CHORD_REGEX = /\b([A-G](?:#|b)?)(m|maj|min|sus|aug|dim|add|M)?(\d{0,2})(?:\/([A-G](?:#|b)?))?\b/g;

// Heuristic to check if a line is a "Chord Line" vs "Lyrics"
function isChordLine(line) {
    if (!line.trim()) return false;

    let tokens = line.trim().split(/\s+/);
    let chordCount = 0;
    let lyricWordCount = 0;

    for (let t of tokens) {
        // Remove common punctuation for checks
        let clean = t.replace(/[.,:;\[\]\(\)\|\-]/g, '');
        if (!clean) continue; // Skip straight punctuation

        // Strict Chord Regex Start
        // Must accept simpler chords too. 
        // User chords might be "G", "C#", "Am7", "G/B"
        if (clean.match(/^[A-G](?:#|b|x)?(?:m|maj|min|sus|aug|dim|add|M|o|ø|\d)*(?:\/[A-G](?:#|b)?)?$/)) {
            chordCount++;
        } else {
            // It's not a chord. Is it a word?
            // If it has lowercase vowels, it's likely a word.
            if (clean.match(/[aeiouáéíóú]/i) && clean.length > 1) {
                lyricWordCount++;
            }
        }
    }

    // Debug logic creation
    // console.log(`Line: "${line.substring(0, 20)}..." | Chords: ${chordCount}, Words: ${lyricWordCount}`);

    // If more chords than words, or 0 words and some chords -> It's a chord line
    if (lyricWordCount === 0 && chordCount > 0) return true;

    // If we have mixed content, we heavily favor treating it as "Lyrics" to avoid breaking text 
    // UNLESS the ratio is overwhelming (e.g. Intro: C G D A -> 1 word, 4 chords)
    if (chordCount > lyricWordCount) return true;

    return false;
}

function transposeLine(line, semitones, currentKey, targetKey) {
    // console.log("Transposing Line:", line);
    return line.replace(CHORD_REGEX, (match, root, quality, ext, bass) => {
        let rootIdx = NOTE_TO_INDEX[root];
        if (rootIdx === undefined) return match;

        let newRootIdx = (rootIdx + semitones) % 12;
        if (newRootIdx < 0) newRootIdx += 12;

        let newRoot = spellNoteForKey(newRootIdx, targetKey);

        // Restore suffix
        let suffix = (quality || '') + (ext || '');
        if (bass) {
            let bassIdx = NOTE_TO_INDEX[bass];
            if (bassIdx !== undefined) {
                let newBassIdx = (bassIdx + semitones) % 12;
                if (newBassIdx < 0) newBassIdx += 12;
                let newBass = spellNoteForKey(newBassIdx, targetKey);
                // Important: Ensure the slash remains
                return `<span class="chord-highlight">${newRoot}${suffix}/${newBass}</span>`;
            }
        }
        return `<span class="chord-highlight">${newRoot}${suffix}</span>`;
    });
}

function transposeText(text, semitones, currentKey, targetKey) {
    // Process line by line
    let lines = text.split('\n');
    let output = [];

    for (let line of lines) {
        if (isChordLine(line)) {
            output.push(transposeLine(line, semitones, currentKey, targetKey));
        } else {
            output.push(line); // Keep lyrics as is
        }
    }
    return output.join('\n');
}

function applyTransposition(elementId, semitones) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // console.log("Transposing", elementId, "Original Key:", el.dataset.key);

    // Store original text if not stored
    if (!el.dataset.original) {
        el.dataset.original = el.innerText;
        el.dataset.currentShift = 0;
    }

    const originalKey = el.dataset.key || '';
    let currentShift = parseInt(el.dataset.currentShift) + semitones;

    // Calculate new target Key
    let targetKey = getNextKeyName(originalKey, currentShift);

    if (!targetKey) {
        targetKey = originalKey;
    }

    // USE INNERHTML now because we return spans
    el.innerHTML = transposeText(el.dataset.original, currentShift, originalKey, targetKey);
    el.dataset.currentShift = currentShift;

    // Badge update (if exits, though dropdown replaces it visually)
    const badge = document.getElementById(elementId + '-badge');
    if (badge) {
        badge.innerText = `(Tono: ${targetKey})`;
        badge.style.opacity = 0.5;
    }
}

// NEW: Dropdown Logic
function populateKeySelectors() {
    const selectors = document.querySelectorAll('.key-selector');
    if (!selectors.length) return;

    // Create Options HTML
    let majorOpts = '<optgroup label="Mayores">';
    let minorOpts = '<optgroup label="Menores">';

    const majorKeys = Object.keys(USER_SCALES).filter(k => !k.includes('m') && k.length < 3).sort();
    // Sort logic could be improved (C, C#, D...) but alpha is fine/fast
    // Or use PREFERRED lists

    // Let's use specific order for better UX
    const ORDER_MAJOR = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const ORDER_MINOR = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'];

    ORDER_MAJOR.forEach(k => {
        if (USER_SCALES[k]) majorOpts += `<option value="${k}">${k}</option>`;
    });
    ORDER_MINOR.forEach(k => {
        if (USER_SCALES[k]) minorOpts += `<option value="${k}">${k}</option>`;
    });

    majorOpts += '</optgroup>';
    minorOpts += '</optgroup>';

    selectors.forEach(sel => {
        // preserve current selection if any
        const currentVal = sel.value;
        sel.innerHTML = `<option value="">Original</option>` + majorOpts + minorOpts;

        // Try to set value to current key of the song
        const targetId = sel.dataset.target;
        const el = document.getElementById(targetId);
        if (el && el.dataset.key) {
            // Clean key?
            sel.value = el.dataset.key;
        }
    });
}

function transposeToSpecificKey(elementId, targetKey) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // If "Original" selected
    if (!targetKey) {
        // Revert but keep formatting if needed? 
        // Actually revert to original text is safest, then highlight it
        if (el.dataset.original) {
            // We want to highlight even the original, so we run transpose with 0 shift
            el.innerHTML = transposeText(el.dataset.original, 0, el.dataset.key, el.dataset.key);
        }
        el.dataset.currentShift = 0;
        return;
    }

    if (!el.dataset.original) {
        el.dataset.original = el.innerText;
        el.dataset.currentShift = 0;
    }
    const originalKey = el.dataset.key;
    if (!originalKey) return; // Can't calc distance without origin

    let idxOrigin = getKeyIndex(originalKey);
    let idxTarget = getKeyIndex(targetKey);

    if (idxOrigin === -1 || idxTarget === -1) return;

    let semitones = idxTarget - idxOrigin;

    el.innerHTML = transposeText(el.dataset.original, semitones, originalKey, targetKey);
    el.dataset.currentShift = semitones;
}

function initChordColoring() {
    // Determine all chord blocks and run a 0-shift transpose to trigger highlighting
    const blocks = document.querySelectorAll('.code-font[id^="chords-"]');
    blocks.forEach(block => {
        if (!block.dataset.original) {
            block.dataset.original = block.innerText; // Store clean text
        }
        const key = block.dataset.key || 'C';
        block.innerHTML = transposeText(block.dataset.original, 0, key, key);
    });
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    populateKeySelectors();
    initChordColoring();
});
