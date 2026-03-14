export interface Song {
    id: string;
    title: string;
    artist: string;
    bpm?: number;
    content: string; // Lyrics with chords in ChordPro or bracket format
    key: string;
    originalKey?: string;
    bestSinger?: string;
    youtubeUrl?: string; // External Reference URL
    addedBy?: string;
    createdAt: number; // Timestamp
    updatedAt?: number;
}

/** Asignación de voz por línea: key = índice de línea como string, value = singerKey (ej. "red", "blue") */
export type VoiceAssignments = Record<string, string>;

/** Paleta de un cantante: color Tailwind completo para bg y texto */
export interface SingerColor {
    key: string;       // identificador único, ej. "red"
    label: string;     // nombre visible, ej. "Rojo"
    bg: string;        // clase Tailwind completa, ej. "bg-red-600"
    text: string;      // clase Tailwind completa, ej. "text-red-400"
    border: string;    // clase Tailwind completa, ej. "border-red-500"
    light: string;     // bg suave para highlight de línea, ej. "bg-red-600/20"
}

export interface Mix {
    id: string;
    title: string;
    date: number; // Timestamp
    description?: string;
    songs: string[]; // Array of Song IDs
    createdBy?: string;
}

export interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    role: 'admin' | 'editor' | 'viewer';
}

export interface Participant {
    name: string;
    role?: string; // e.g. "Guitarra", "Voz", "Batería"
}

export interface WorshipEvent {
    id: string;
    title: string;
    date: number;           // Timestamp (ms)
    time?: string;          // "10:00 AM"
    type: 'servicio' | 'ensayo' | 'otro';
    mixId?: string;         // Optional linked Mix
    participants: Participant[];
    notes?: string;
    createdAt: number;
}

// ─── Finanzas ────────────────────────────────────────────────────────────────

/** Una aportación semanal de un miembro */
export interface Contribution {
    id: string;
    memberName: string;     // Nombre del miembro que aportó
    amount: number;         // En lempiras (por defecto 50)
    weekLabel: string;      // Ej. "Semana 10 – Mar 2026"
    weekStart: number;      // Timestamp lunes de la semana
    notes?: string;
    createdAt: number;
}

/** Un gasto o compra de insumos */
export interface Expense {
    id: string;
    description: string;    // Qué se compró / en qué se gastó
    amount: number;         // En lempiras
    category: 'insumos' | 'equipamiento' | 'transporte' | 'alimentacion' | 'otro';
    receiptUrl?: string;    // URL foto de recibo (futuro)
    notes?: string;
    date: number;           // Timestamp del gasto
    registeredBy?: string;
    createdAt: number;
}

/** Resumen de deuda de un miembro, calculado en tiempo real */
export interface MemberDebt {
    memberName: string;
    totalPaid: number;        // Lempiras aportados en total
    debtAmount: number;       // Lempiras adeudados (semanas perdidas × L 50)
    missedWeeks: number;      // Número de semanas sin aportar
    paidWeeks: number;        // Número de semanas que sí aportó
    applicableWeeks: number;  // Total de semanas desde que se registró
    isUpToDate: boolean;      // true si no debe ninguna semana
    missedWeekLabels: string[]; // Etiquetas de las semanas adeudadas
}
