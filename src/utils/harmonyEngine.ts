import chordsData from '../data/chords.json';

export interface ParsedChordNote {
  noteName: string;
  octave: number;
  midiNote: number;
  frequency: number;
  interval: number;
  label?: string;
  isBass?: boolean;
}

export interface InversionInfo {
  type: 'root' | 'first' | 'second' | 'third' | 'slash';
  name: string;
  bassNote: string;
  bassInterval: number;
  description: string;
}

export interface ParsedChord {
  cifraOriginal: string;
  rootNote: string;
  variationStr: string;
  bassNote: string | null;
  inversion: InversionInfo | null;
  intervals: number[];
  notes: ParsedChordNote[];
  pitchClasses: number[];
}

export interface ChordTensionOption {
  label: string;
  noteName: string;
  chordSymbol: string;
  description: string;
}

export interface ChordSubstituteOption {
  title: string;
  chordSymbol: string;
  description: string;
}

export interface SoloScaleRecommendation {
  scaleName: string;
  notes: string[];
  tip: string;
}

export interface ChordInsightResult {
  cifraOriginal: string;
  rootNote: string;
  quality: 'Maior' | 'Menor' | 'Dominante' | 'Diminuto' | 'MeioDiminuto' | 'Aumentado' | 'Suspenso';
  tensoesIdeais: ChordTensionOption[];
  substitutos: ChordSubstituteOption[];
  escalaImproviso: SoloScaleRecommendation;
  inversaoInfo?: InversionInfo | null;
}

export const NOTE_SEMITONES: Record<string, number> = {
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

export const NOTES_CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES_CHROMATIC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const THEORETICAL_FULL_NAMES: Record<string, string> = {
  '': 'Acorde Maior (Tríade)',
  'Maior': 'Acorde Maior (Tríade)',
  'M': 'Acorde Maior (Tríade)',
  'm': 'Acorde Menor (Tríade)',
  '7': 'Acorde Dominante com Sétima Menor',
  'Maj7': 'Acorde Maior com Sétima Maior (7M)',
  '7M': 'Acorde Maior com Sétima Maior (7M)',
  'm7': 'Acorde Menor com Sétima Menor',
  'm(Maj7)': 'Acorde Menor com Sétima Maior',
  'm7b5': 'Acorde Meio-Diminuto (m7♭5 / ø)',
  'm7(♭5) / ø': 'Acorde Meio-Diminuto (m7♭5 / ø)',
  'Dim / °': 'Acorde Diminuto (Tríade Diminuta: 1 - 3m - 5d)',
  'Dim7 / °7': 'Acorde Diminuto com 7ª Diminuta (°7 - Tétrade Simétrica: 1 - 3m - 5d - 7d)',
  'Aug / +': 'Acorde Aumentado (Tríade Aumentada Simétrica: 1 - 3M - 5A)',
  'sus4': 'Acorde Suspenso de Quarta (sus4)',
  'sus2': 'Acorde Suspenso de Segunda (sus2)',
  '6': 'Acorde Maior com Sexta',
  'm6': 'Acorde Menor com Sexta',
  'add9': 'Acorde Maior com Nona Adicionada',
  'm(add9)': 'Acorde Menor com Nona Adicionada',
  '7sus2': 'Acorde Dominante com 2ª Suspensa',
  '7sus4': 'Acorde Dominante com 4ª Suspensa',
  '9': 'Acorde Dominante com Nona Maior',
  'Maj9': 'Acorde Maior com 7ª Maior e Nona',
  'm9': 'Acorde Menor com 7ª e Nona',
  'm(Maj9)': 'Acorde Menor com 7ª Maior e Nona',
  '11': 'Acorde Dominante com Décima Primeira',
  'Maj11': 'Acorde Maior com Décima Primeira',
  'm11': 'Acorde Menor com Décima Primeira',
  '13': 'Acorde Dominante com Décima Terceira',
  'Maj13': 'Acorde Maior com Décima Terceira',
  'm13': 'Acorde Menor com Décima Terceira',
  '7(♭5)': 'Acorde Dominante com Quinta Diminuta',
  '7(♯5)': 'Acorde Dominante com Quinta Aumentada (7♯5)',
  '7(♭9)': 'Acorde Dominante com Nona Menor',
  '7(♯9)': 'Acorde Dominante Alterado (#9 - Hendrix Chord)',
  '7(♭5♭9)': 'Acorde Dominante com b5 e b9',
  '7(♯5♯9)': 'Acorde Dominante Alterado #5 e #9',
  '7(♯11)': 'Acorde Dominante Lídio (#11)',
  'Maj7(♯5)': 'Acorde Maior 7M com Quinta Aumentada (7M♯5)',
  '6/9': 'Acorde Maior com Sexta e Nona Adicionada'
};

export const INTERVAL_DESCRIPTIONS: Record<number, { name: string; short: string; role: string }> = {
  0: { name: 'Tônica Fundamental', short: '1P', role: 'Raiz' },
  1: { name: 'Segunda Menor / Nona Menor (♭9)', short: '2m', role: 'Tensão ♭9' },
  2: { name: 'Segunda Maior / Nona Maior (9)', short: '2M', role: 'Tensão 9' },
  3: { name: 'Terça Menor', short: '3m', role: 'Modo Menor' },
  4: { name: 'Terça Maior', short: '3M', role: 'Modo Maior' },
  5: { name: 'Quarta Justa / Décima Primeira (11)', short: '4J', role: 'Suspensão / 11' },
  6: { name: 'Quinta Diminuta / Trítono (♭5 / 5d)', short: '5d', role: 'Quinta Diminuta' },
  7: { name: 'Quinta Justa', short: '5J', role: 'Estabilidade' },
  8: { name: 'Quinta Aumentada (♯5 / 5A) / 6ª Menor (♭13)', short: '5A', role: 'Quinta Aumentada' },
  9: { name: 'Sétima Diminuta (°7) / Sexta Maior (6M)', short: '°7 / 6M', role: 'Sétima Diminuta' },
  10: { name: 'Sétima Menor', short: '7m', role: 'Dominante' },
  11: { name: 'Sétima Maior (7M)', short: '7M', role: 'Sensível 7M' },
  12: { name: 'Oitava Justa', short: '8P', role: 'Dobro' },
  13: { name: 'Nona Menor (♭9)', short: '♭9', role: 'Tensão Alterada' },
  14: { name: 'Nona Maior (9)', short: '9', role: 'Extensão Natural' },
  15: { name: 'Nona Aumentada (♯9)', short: '♯9', role: 'Tensão Blues' },
  17: { name: 'Décima Primeira Justa (11)', short: '11', role: 'Extensão 11' },
  18: { name: 'Décima Primeira Aumentada (♯11)', short: '♯11', role: 'Lídio' },
  21: { name: 'Décima Terceira Maior (13)', short: '13', role: 'Extensão 13' }
};

/**
 * Retorna o nome da nota a partir de um deslocamento de semitons da nota tônica
 */
export function getNoteNameByOffset(rootNote: string, offsetSemitones: number): string {
  const rootIndex = NOTE_SEMITONES[rootNote] ?? 0;
  const targetIndex = ((rootIndex + offsetSemitones) % 12 + 12) % 12;
  const interval = ((offsetSemitones % 12) + 12) % 12;

  // Enarmonia precisa para 5ª diminuta (6 st) e 5ª aumentada (8 st)
  if (interval === 6) {
    // 5ª Diminuta (dim / ° / m7b5)
    const dim5Map: Record<string, string> = {
      'C': 'Gb', 'C#': 'G', 'Db': 'G', 'D': 'Ab', 'D#': 'A', 'Eb': 'A',
      'E': 'Bb', 'F': 'B', 'F#': 'C', 'Gb': 'C', 'G': 'Db', 'G#': 'D',
      'Ab': 'D', 'A': 'Eb', 'A#': 'E', 'Bb': 'E', 'B': 'F'
    };
    if (dim5Map[rootNote]) return dim5Map[rootNote];
  }

  if (interval === 8) {
    // 5ª Aumentada (aug / + / #5)
    const aug5Map: Record<string, string> = {
      'C': 'G#', 'C#': 'A', 'Db': 'A', 'D': 'A#', 'D#': 'B', 'Eb': 'B',
      'E': 'C', 'F': 'C#', 'F#': 'D', 'Gb': 'D', 'G': 'D#', 'G#': 'E',
      'Ab': 'E', 'A': 'F', 'A#': 'F#', 'Bb': 'F#', 'B': 'G'
    };
    if (aug5Map[rootNote]) return aug5Map[rootNote];
  }

  if (interval === 3) {
    // 3ª menor
    const min3Map: Record<string, string> = {
      'C': 'Eb', 'C#': 'E', 'Db': 'E', 'D': 'F', 'D#': 'F#', 'Eb': 'Gb',
      'E': 'G', 'F': 'Ab', 'F#': 'A', 'Gb': 'A', 'G': 'Bb', 'G#': 'B',
      'Ab': 'B', 'A': 'C', 'A#': 'C#', 'Bb': 'Db', 'B': 'D'
    };
    if (min3Map[rootNote]) return min3Map[rootNote];
  }

  if (interval === 9) {
    // 7ª diminuta (°7)
    const dim7Map: Record<string, string> = {
      'C': 'A', 'C#': 'Bb', 'Db': 'Bb', 'D': 'B', 'D#': 'C', 'Eb': 'C',
      'E': 'C#', 'F': 'D', 'F#': 'D#', 'Gb': 'Eb', 'G': 'E', 'G#': 'F',
      'Ab': 'F', 'A': 'F#', 'A#': 'G', 'Bb': 'G', 'B': 'G#'
    };
    if (dim7Map[rootNote]) return dim7Map[rootNote];
  }

  const useFlat = ['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'F'].includes(rootNote);
  return useFlat ? NOTES_CHROMATIC_FLAT[targetIndex] : NOTES_CHROMATIC_SHARP[targetIndex];
}

/**
 * Retorna o nome da nota com grafia enarmônica rigorosamente correta para o contexto do acorde
 */
export function getHarmonicallySpelledNote(rootNote: string, targetPitchClass: number): string {
  const pc = ((targetPitchClass % 12) + 12) % 12;
  const rootPc = NOTE_SEMITONES[rootNote] ?? 0;
  const interval = (pc - rootPc + 12) % 12;

  // Resolução rigorosa por intervalo em relação à tônica
  if (interval === 0) return rootNote;
  if (interval === 3) {
    const min3Map: Record<string, string> = {
      'C': 'Eb', 'C#': 'E', 'Db': 'E', 'D': 'F', 'D#': 'F#', 'Eb': 'Gb',
      'E': 'G', 'F': 'Ab', 'F#': 'A', 'Gb': 'A', 'G': 'Bb', 'G#': 'B',
      'Ab': 'B', 'A': 'C', 'A#': 'C#', 'Bb': 'Db', 'B': 'D'
    };
    if (min3Map[rootNote]) return min3Map[rootNote];
  }
  if (interval === 4) {
    const maj3Map: Record<string, string> = {
      'C': 'E', 'C#': 'F', 'Db': 'F', 'D': 'F#', 'D#': 'G', 'Eb': 'G',
      'E': 'G#', 'F': 'A', 'F#': 'A#', 'Gb': 'Bb', 'G': 'B', 'G#': 'C',
      'Ab': 'C', 'A': 'C#', 'A#': 'D', 'Bb': 'D', 'B': 'D#'
    };
    if (maj3Map[rootNote]) return maj3Map[rootNote];
  }
  if (interval === 6) {
    // 5ª Diminuta (♭5 / 5d)
    const dim5Map: Record<string, string> = {
      'C': 'Gb', 'C#': 'G', 'Db': 'G', 'D': 'Ab', 'D#': 'A', 'Eb': 'A',
      'E': 'Bb', 'F': 'B', 'F#': 'C', 'Gb': 'C', 'G': 'Db', 'G#': 'D',
      'Ab': 'D', 'A': 'Eb', 'A#': 'E', 'Bb': 'E', 'B': 'F'
    };
    if (dim5Map[rootNote]) return dim5Map[rootNote];
  }
  if (interval === 8) {
    // 5ª Aumentada (♯5 / 5A)
    const aug5Map: Record<string, string> = {
      'C': 'G#', 'C#': 'A', 'Db': 'A', 'D': 'A#', 'D#': 'B', 'Eb': 'B',
      'E': 'C', 'F': 'C#', 'F#': 'D', 'Gb': 'D', 'G': 'D#', 'G#': 'E',
      'Ab': 'E', 'A': 'F', 'A#': 'F#', 'Bb': 'F#', 'B': 'G'
    };
    if (aug5Map[rootNote]) return aug5Map[rootNote];
  }
  if (interval === 9) {
    // 7ª diminuta (°7) ou 6ª maior
    const dim7Map: Record<string, string> = {
      'C': 'A', 'C#': 'Bb', 'Db': 'Bb', 'D': 'B', 'D#': 'C', 'Eb': 'C',
      'E': 'C#', 'F': 'D', 'F#': 'D#', 'Gb': 'Eb', 'G': 'E', 'G#': 'F',
      'Ab': 'F', 'A': 'F#', 'A#': 'G', 'Bb': 'G', 'B': 'G#'
    };
    if (dim7Map[rootNote]) return dim7Map[rootNote];
  }
  if (interval === 10) {
    const min7Map: Record<string, string> = {
      'C': 'Bb', 'C#': 'B', 'Db': 'B', 'D': 'C', 'D#': 'C#', 'Eb': 'Db',
      'E': 'D', 'F': 'Eb', 'F#': 'E', 'Gb': 'E', 'G': 'F', 'G#': 'F#',
      'Ab': 'Gb', 'A': 'G', 'A#': 'G#', 'Bb': 'Ab', 'B': 'A'
    };
    if (min7Map[rootNote]) return min7Map[rootNote];
  }

  // Regras padrão de enarmonia tonal por tônica
  const flatRoots = ['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'F'];
  if (flatRoots.includes(rootNote)) {
    return NOTES_CHROMATIC_FLAT[pc];
  }

  return NOTES_CHROMATIC_SHARP[pc];
}

/**
 * Normaliza e calcula frequência, oitava e nome da nota
 */
export function getNoteDetails(root: string, interval: number, useFlats: boolean, baseOctave = 4): ParsedChordNote {
  const rootIndex = NOTE_SEMITONES[root] ?? 0;
  const semitonesFromC = rootIndex + interval;
  const pitchClass = ((semitonesFromC % 12) + 12) % 12;
  const octave = baseOctave + Math.floor(semitonesFromC / 12);
  const noteName = getHarmonicallySpelledNote(root, pitchClass);
  const midiNote = 12 * (octave + 1) + pitchClass;
  const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

  const desc = INTERVAL_DESCRIPTIONS[interval] || INTERVAL_DESCRIPTIONS[pitchClass];

  return {
    noteName,
    octave,
    midiNote,
    frequency,
    interval,
    label: desc ? desc.name : `+${interval} st`
  };
}

/**
 * Determina detalhes da inversão a partir da nota tônica e da nota do baixo
 */
export function determineInversion(rootNote: string, bassNote: string | null, intervals: number[] = [0, 4, 7]): InversionInfo | null {
  if (!bassNote || bassNote === rootNote) {
    return {
      type: 'root',
      name: 'Posição Fundamental',
      bassNote: rootNote,
      bassInterval: 0,
      description: `Tônica ${rootNote} no baixo (estado fundamental)`
    };
  }

  const rootPc = NOTE_SEMITONES[rootNote] ?? 0;
  const bassPc = NOTE_SEMITONES[bassNote] ?? 0;
  const bassInterval = (bassPc - rootPc + 12) % 12;

  if (bassInterval === 0) {
    return {
      type: 'root',
      name: 'Posição Fundamental',
      bassNote: rootNote,
      bassInterval: 0,
      description: `Tônica ${rootNote} no baixo`
    };
  }

  // 1ª Inversão: Baixo na 3ª menor (3 st) ou maior (4 st)
  if (bassInterval === 3 || bassInterval === 4) {
    const isMinor3rd = bassInterval === 3;
    const isDiminished = intervals.includes(3) && intervals.includes(6);
    const isAugmented = intervals.includes(4) && intervals.includes(8);

    let extraNote = '';
    if (isDiminished && intervals.includes(9)) {
      extraNote = ` (Enarmônico a ${bassNote}°7 pela simetria de 3m)`;
    } else if (isAugmented) {
      extraNote = ` (Enarmônico a ${bassNote}+ pela simetria de 3M)`;
    }

    return {
      type: 'first',
      name: isMinor3rd ? '1ª Inversão (Baixo na 3ª Menor)' : '1ª Inversão (Baixo na 3ª Maior)',
      bassNote,
      bassInterval,
      description: `Baixo na terça ${isMinor3rd ? 'menor (3m)' : 'maior (3M)'} (${bassNote})${extraNote}`
    };
  }

  // 2ª Inversão: Baixo na 5ª diminuta (6 st), justa (7 st) ou aumentada (8 st)
  if (bassInterval === 6 || bassInterval === 7 || bassInterval === 8) {
    let quintaNome = 'quinta justa (5J)';
    let invLabel = '2ª Inversão (Baixo na 5ª Justa)';
    let extraNote = '';

    if (bassInterval === 6) {
      quintaNome = 'quinta diminuta (♭5 / 5d)';
      invLabel = '2ª Inversão (Baixo na 5ª Diminuta)';
      if (intervals.includes(9)) {
        extraNote = ` (Enarmônico a ${bassNote}°7 pela simetria diminuta)`;
      }
    }
    if (bassInterval === 8) {
      quintaNome = 'quinta aumentada (♯5 / 5A)';
      invLabel = '2ª Inversão (Baixo na 5ª Aumentada)';
      if (intervals.includes(4) && intervals.includes(8)) {
        extraNote = ` (Enarmônico a ${bassNote}+ pela simetria aumentada)`;
      }
    }

    return {
      type: 'second',
      name: invLabel,
      bassNote,
      bassInterval,
      description: `Baixo na ${quintaNome} (${bassNote})${extraNote}`
    };
  }

  // 3ª Inversão: Baixo na 7ª diminuta (9 st), menor (10 st) ou maior (11 st)
  if (bassInterval === 9 || bassInterval === 10 || bassInterval === 11) {
    let setimaNome = 'sétima menor (7m)';
    let invLabel = '3ª Inversão (Baixo na 7ª Menor)';
    let extraNote = '';

    if (bassInterval === 11) {
      setimaNome = 'sétima maior (7M)';
      invLabel = '3ª Inversão (Baixo na 7ª Maior)';
    }
    if (bassInterval === 9) {
      setimaNome = 'sétima diminuta (°7 / 7d)';
      invLabel = '3ª Inversão (Baixo na 7ª Diminuta)';
      extraNote = ` (Enarmônico a ${bassNote}°7 pela simetria da tétrade diminuta)`;
    }

    return {
      type: 'third',
      name: invLabel,
      bassNote,
      bassInterval,
      description: `Baixo na ${setimaNome} (${bassNote})${extraNote}`
    };
  }

  // Extensões de baixo para acordes Slash
  if (bassInterval === 1 || bassInterval === 2) {
    const nonaTipo = bassInterval === 1 ? 'nona menor (♭9)' : 'nona maior (9)';
    return {
      type: 'slash',
      name: `Baixo na 9ª / 2ª (/${bassNote})`,
      bassNote,
      bassInterval,
      description: `Baixo conduzido na ${nonaTipo} (${bassNote})`
    };
  }

  if (bassInterval === 5) {
    return {
      type: 'slash',
      name: `Baixo na 11ª / 4ª (/${bassNote})`,
      bassNote,
      bassInterval,
      description: `Baixo conduzido na quarta justa / 11ª (${bassNote})`
    };
  }

  return {
    type: 'slash',
    name: `Baixo Pedal / Slash (/${bassNote})`,
    bassNote,
    bassInterval,
    description: `Baixo conduzido em ${bassNote} (+${bassInterval} semitons)`
  };
}

/**
 * Normaliza sufixos de acordes para chaves padrão do dicionário
 */
export function normalizeChordSuffix(rawSuffix: string): string {
  const s = rawSuffix.trim();
  if (!s || s === 'M' || s === 'maj' || s === 'Maj') return 'Maior';
  if (s === 'm' || s === 'min' || s === '-') return 'm';
  if (s === '7') return '7';
  if (s === 'maj7' || s === 'Maj7' || s === '7M' || s === 'M7' || s === 'Δ' || s === 'Δ7') return 'Maj7';
  if (s === 'm7' || s === 'min7' || s === 'm(7)' || s === '-7') return 'm7';
  if (s === 'm(maj7)' || s === 'm(Maj7)' || s === 'mM7' || s === 'm7M' || s === 'm/Maj7') return 'm(Maj7)';
  if (s === 'm7b5' || s === 'm7(b5)' || s === 'm7(♭5)' || s === 'm7-5' || s === 'ø' || s === 'ø7' || s === 'half-dim' || s === 'halfdim' || s === 'm7/b5' || s === 'm7/♭5') return 'm7(♭5) / ø';
  if (s === 'dim' || s === '°' || s === 'o' || s === 'diminuto' || s === 'diminuta' || s === 'm(b5)' || s === 'mb5' || s === 'm(♭5)') return 'Dim / °';
  if (s === 'dim7' || s === '°7' || s === 'o7' || s === 'diminuto7' || s === '7dim' || s === '7°' || s === 'o(7)' || s === '°(7)') return 'Dim7 / °7';
  if (s === 'aug' || s === '+' || s === 'aum' || s === 'aumentado' || s === '(#5)' || s === '(♯5)' || s === 'aug5' || s === '+5') return 'Aug / +';
  if (s === 'sus4' || s === 'sus' || s === '4') return 'sus4';
  if (s === 'sus2' || s === '2') return 'sus2';
  if (s === '6') return '6';
  if (s === 'm6') return 'm6';
  if (s === 'add9' || s === 'add2') return 'add9';
  if (s === 'm(add9)' || s === 'madd9') return 'm(add9)';
  if (s === '7sus4' || s === '7sus') return '7sus4';
  if (s === '7sus2') return '7sus2';
  if (s === '9' || s === '7(9)') return '9';
  if (s === 'maj9' || s === 'Maj9' || s === '7M(9)' || s === 'M9') return 'Maj9';
  if (s === 'm9' || s === 'min9' || s === 'm7(9)') return 'm9';
  if (s === 'm(maj9)' || s === 'm(Maj9)') return 'm(Maj9)';
  if (s === '11') return '11';
  if (s === 'maj11' || s === 'Maj11' || s === '7M(11)') return 'Maj11';
  if (s === 'm11' || s === 'min11') return 'm11';
  if (s === '13' || s === '7(13)') return '13';
  if (s === 'maj13' || s === 'Maj13' || s === '7M(13)') return 'Maj13';
  if (s === 'm13') return 'm13';
  if (s === '7(b5)' || s === '7(♭5)' || s === '7b5' || s === '7-5' || s === '7/b5') return '7(♭5)';
  if (s === '7(#5)' || s === '7(♯5)' || s === '7#5' || s === '7+' || s === '7aug' || s === '+7' || s === 'aug7') return '7(♯5)';
  if (s === '7(b9)' || s === '7(♭9)' || s === '7b9') return '7(♭9)';
  if (s === '7(#9)' || s === '7(♯9)' || s === '7#9') return '7(♯9)';
  if (s === '7(b5b9)' || s === '7(♭5♭9)') return '7(♭5♭9)';
  if (s === '7(#5#9)' || s === '7(♯5♯9)') return '7(♯5♯9)';
  if (s === '7(#11)' || s === '7(♯11)' || s === '7#11') return '7(♯11)';
  if (s === 'maj7(#5)' || s === 'Maj7(♯5)' || s === '7M(#5)' || s === '7M(♯5)' || s === 'maj7#5' || s === 'Maj7#5' || s === '+maj7' || s === 'maj7+' || s === '7M+') return 'Maj7(♯5)';
  if (s === '6/9' || s === '69') return '6/9';

  return s;
}

/**
 * Converte o símbolo de uma cifra (com ou sem barra de inversão) em notas harmônicas completas
 */
export function parseChordSymbolToNotes(cifra: string): ParsedChord | null {
  if (!cifra || typeof cifra !== 'string') return null;
  const clean = cifra.trim();
  if (!clean) return null;

  const slashParts = clean.split('/');
  const baseChord = slashParts[0].trim();
  const bassNoteRaw = slashParts[1] ? slashParts[1].trim() : null;

  const rootMatch = baseChord.match(/^([A-G][b#♯♭]?)/);
  if (!rootMatch) return null;

  const rootNote = rootMatch[1].replace('♯', '#').replace('♭', 'b');
  const rawSuffix = baseChord.substring(rootMatch[0].length);
  const variationKey = normalizeChordSuffix(rawSuffix);

  const variacoesMap = chordsData.variacoes as Record<string, number[]>;
  let intervals = variacoesMap[variationKey];

  if (!intervals) {
    if (variationKey.startsWith('m')) intervals = [0, 3, 7];
    else if (variationKey.includes('dim') || variationKey.includes('°')) intervals = [0, 3, 6];
    else if (variationKey.includes('aug') || variationKey.includes('+')) intervals = [0, 4, 8];
    else intervals = [0, 4, 7];
  }

  const bassNote = bassNoteRaw ? bassNoteRaw.replace('♯', '#').replace('♭', 'b') : null;
  const inversion = determineInversion(rootNote, bassNote, intervals);
  const useFlats = ['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'F'].includes(rootNote) || (bassNote !== null && ['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(bassNote));

  // Gerar notas do acorde respeitando inversão
  const notesList: ParsedChordNote[] = [];
  const rootPc = NOTE_SEMITONES[rootNote] ?? 0;

  if (bassNote && bassNote !== rootNote) {
    // Adicionar nota do baixo na oitava 3 (baixo real)
    const bassPc = NOTE_SEMITONES[bassNote] ?? 0;
    const bassInterval = (bassPc - rootPc + 12) % 12;
    const bassDetails = getNoteDetails(rootNote, bassInterval, useFlats, 3);
    bassDetails.isBass = true;
    bassDetails.label = `Baixo em ${bassNote} (${inversion?.name || 'Inversão'})`;
    notesList.push(bassDetails);

    // Adicionar as outras notas do acorde na oitava 4
    intervals.forEach((interval) => {
      const noteDetails = getNoteDetails(rootNote, interval, useFlats, 4);
      if ((noteDetails.midiNote % 12) === bassPc && notesList.length === 1) {
        // Já está no baixo, mas mantém a nota na harmonia superior
      }
      notesList.push(noteDetails);
    });
  } else {
    // Posição Fundamental
    intervals.forEach((interval, idx) => {
      const noteDetails = getNoteDetails(rootNote, interval, useFlats, 4);
      if (idx === 0) {
        noteDetails.isBass = true;
      }
      notesList.push(noteDetails);
    });
  }

  const pitchClasses = Array.from(new Set(notesList.map((n) => n.midiNote % 12)));

  return {
    cifraOriginal: cifra,
    rootNote,
    variationStr: variationKey,
    bassNote,
    inversion,
    intervals,
    notes: notesList,
    pitchClasses
  };
}

export interface ChordValidationResult {
  isMatched: boolean;
  isExactInversion: boolean;
  targetSymbol: string;
  expectedBass: string;
  playedBass: string | null;
  lowestMidiNote: number | null;
  missingPitchClasses: number[];
  extraPitchClasses: number[];
  inversionType: 'root' | 'first' | 'second' | 'third' | 'slash';
  details: string;
}

/**
 * Detecta acordes e inversões a partir de notas MIDI tocadas em tempo real com rigor teórico
 */
export function detectChordsFromMidi(midiNotes: number[]): {
  chordSymbol: string;
  rootNote: string;
  variationStr: string;
  inversion: InversionInfo | null;
  intervals: number[];
  notes: ParsedChordNote[];
  confidence: number;
}[] {
  if (!midiNotes || midiNotes.length === 0) return [];

  const sortedMidi = [...midiNotes].sort((a, b) => a - b);
  const lowestMidi = sortedMidi[0];
  const lowestPc = ((lowestMidi % 12) + 12) % 12;

  const uniquePitchClasses = Array.from(new Set(sortedMidi.map((n) => ((n % 12) + 12) % 12)));
  const results: {
    chordSymbol: string;
    rootNote: string;
    variationStr: string;
    inversion: InversionInfo | null;
    intervals: number[];
    notes: ParsedChordNote[];
    confidence: number;
  }[] = [];
  const variacoesMap = chordsData.variacoes as Record<string, number[]>;

  const getRootNamesForPitchClass = (pc: number): string[] => {
    const list: string[] = [];
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const sharps = ['C#', 'D#', 'F#', 'G#', 'A#'];

    const base = names[pc];
    list.push(base);
    if (sharps.includes(base)) {
      if (base === 'C#') list.push('Db');
      if (base === 'D#') list.push('Eb');
      if (base === 'F#') list.push('Gb');
      if (base === 'G#') list.push('Ab');
      if (base === 'A#') list.push('Bb');
    }
    return Array.from(new Set(list));
  };

  for (const rootPc of uniquePitchClasses) {
    const rootNotes = getRootNamesForPitchClass(rootPc);

    for (const rootName of rootNotes) {
      const useFlats = ['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'F'].includes(rootName);
      const lowestNoteName = getHarmonicallySpelledNote(rootName, lowestPc);

      const playedRelIntervals = uniquePitchClasses
        .map((pc) => (pc - rootPc + 12) % 12)
        .sort((a, b) => a - b);

      for (const [varName, intervals] of Object.entries(variacoesMap)) {
        const varIntervalsMod12 = Array.from(new Set(intervals.map((i) => i % 12))).sort((a, b) => a - b);

        const matchesExactly =
          playedRelIntervals.length === varIntervalsMod12.length &&
          playedRelIntervals.every((val, index) => val === varIntervalsMod12[index]);

        if (matchesExactly) {
          const isSlash = lowestPc !== rootPc;
          const bassNote = isSlash ? lowestNoteName : null;
          const inv = determineInversion(rootName, bassNote, intervals);
          const suffix = varName === 'Maior' ? '' : varName;
          const symbol = isSlash ? `${rootName}${suffix}/${lowestNoteName}` : `${rootName}${suffix}`;

          const parsedNotes = intervals.map((interval) => getNoteDetails(rootName, interval, useFlats, 4));

          // Pontuação de confiança rigorosa
          let confidence = 100;
          if (isSlash) {
            const bassInterval = (lowestPc - rootPc + 12) % 12;
            const isChordToneInversion = [3, 4, 6, 7, 8, 9, 10, 11].includes(bassInterval);
            confidence = isChordToneInversion ? 99 : 96;
          }

          results.push({
            chordSymbol: symbol,
            rootNote: rootName,
            variationStr: varName,
            inversion: inv,
            intervals,
            notes: parsedNotes,
            confidence
          });
        } else {
          const isSubset = playedRelIntervals.every((val) => varIntervalsMod12.includes(val));
          if (isSubset && playedRelIntervals.length >= 2) {
            const isSlash = lowestPc !== rootPc;
            const bassNote = isSlash ? lowestNoteName : null;
            const inv = determineInversion(rootName, bassNote, intervals);
            const suffix = varName === 'Maior' ? '' : varName;
            const symbol = isSlash ? `${rootName}${suffix}/${lowestNoteName}` : `${rootName}${suffix}`;

            const parsedNotes = intervals.map((interval) => getNoteDetails(rootName, interval, useFlats, 4));
            const baseRatio = playedRelIntervals.length / varIntervalsMod12.length;
            const score = Math.round(baseRatio * 88);

            results.push({
              chordSymbol: symbol,
              rootNote: rootName,
              variationStr: varName,
              inversion: inv,
              intervals,
              notes: parsedNotes,
              confidence: score
            });
          }
        }
      }
    }
  }

  // Deduplicar e ordenar por confiança e simplicidade harmônica
  const seenSymbols = new Set<string>();
  const uniqueResults: typeof results = [];

  const sortedResults = results.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.notes.length - a.notes.length;
  });

  for (const item of sortedResults) {
    if (!seenSymbols.has(item.chordSymbol)) {
      seenSymbols.add(item.chordSymbol);
      uniqueResults.push(item);
    }
  }

  return uniqueResults;
}

/**
 * Validação rigorosa do acorde tocado via MIDI em relação a um acorde alvo (incluindo Slash Chords e inversões)
 */
export function validatePlayedChordAgainstTarget(
  targetSymbolOrParsed: string | ParsedChord,
  playedMidiNotes: number[]
): ChordValidationResult {
  const parsed = typeof targetSymbolOrParsed === 'string'
    ? parseChordSymbolToNotes(targetSymbolOrParsed)
    : targetSymbolOrParsed;

  if (!parsed || !playedMidiNotes || playedMidiNotes.length === 0) {
    const sym = typeof targetSymbolOrParsed === 'string' ? targetSymbolOrParsed : (parsed?.cifraOriginal || '');
    return {
      isMatched: false,
      isExactInversion: false,
      targetSymbol: sym,
      expectedBass: parsed?.bassNote || parsed?.rootNote || '',
      playedBass: null,
      lowestMidiNote: null,
      missingPitchClasses: parsed ? parsed.pitchClasses : [],
      extraPitchClasses: [],
      inversionType: 'root',
      details: 'Toque as teclas no controlador para validar o acorde.'
    };
  }

  const sortedMidi = [...playedMidiNotes].sort((a, b) => a - b);
  const lowestMidi = sortedMidi[0];
  const lowestPc = ((lowestMidi % 12) + 12) % 12;
  const playedPcs = Array.from(new Set(sortedMidi.map((n) => ((n % 12) + 12) % 12)));

  const requiredPcs = parsed.pitchClasses;
  const missingPcs = requiredPcs.filter((pc) => !playedPcs.includes(pc));
  const extraPcs = playedPcs.filter((pc) => !requiredPcs.includes(pc));

  const expectedBassName = parsed.bassNote || parsed.rootNote;
  const expectedBassPc = NOTE_SEMITONES[expectedBassName] ?? (NOTE_SEMITONES[parsed.rootNote] ?? 0);

  const playedBassName = getHarmonicallySpelledNote(parsed.rootNote, lowestPc);
  const isExactBass = lowestPc === expectedBassPc;
  const allNotesPresent = missingPcs.length === 0;

  const inversionType = parsed.inversion?.type || (parsed.bassNote ? 'slash' : 'root');

  let details = '';
  if (allNotesPresent && isExactBass) {
    if (parsed.bassNote && parsed.bassNote !== parsed.rootNote) {
      details = `Acorde Correto com Inversão Perfeita! (${parsed.cifraOriginal} - ${parsed.inversion?.name || 'Inversão'})`;
    } else {
      details = `Acorde Correto na Posição Fundamental! (${parsed.cifraOriginal})`;
    }
  } else if (allNotesPresent && !isExactBass) {
    if (parsed.bassNote && parsed.bassNote !== parsed.rootNote) {
      details = `Notas corretas, mas ajuste o baixo para ${expectedBassName} para validar a inversão ${parsed.cifraOriginal} (baixo tocado: ${playedBassName}).`;
    } else {
      details = `Notas corretas, mas o baixo deve estar na tônica (${expectedBassName}) para posição fundamental (baixo tocado: ${playedBassName}).`;
    }
  } else if (!allNotesPresent) {
    details = `Faltam ${missingPcs.length} nota(s) para completar ${parsed.cifraOriginal}.`;
  }

  return {
    isMatched: allNotesPresent,
    isExactInversion: allNotesPresent && isExactBass,
    targetSymbol: parsed.cifraOriginal,
    expectedBass: expectedBassName,
    playedBass: playedBassName,
    lowestMidiNote: lowestMidi,
    missingPitchClasses: missingPcs,
    extraPitchClasses: extraPcs,
    inversionType,
    details
  };
}

/**
 * GERA OS INSIGHTS DE HARMÔNIA, TENSOES, SUBSTITUTOS E ESCALAS
 */
export function getChordInsights(cifraStr: string): ChordInsightResult {
  const parsed = parseChordSymbolToNotes(cifraStr);
  const root = parsed?.rootNote || 'C';
  const suffix = parsed?.variationStr || 'Maior';
  const bass = parsed?.bassNote || null;
  const bassSuffix = bass ? `/${bass}` : '';

  let quality: 'Maior' | 'Menor' | 'Dominante' | 'Diminuto' | 'MeioDiminuto' | 'Aumentado' | 'Suspenso' = 'Maior';

  if (suffix.includes('m7(♭5)') || suffix.includes('m7b5') || suffix.includes('ø')) {
    quality = 'MeioDiminuto';
  } else if (suffix.includes('dim') || suffix.includes('°') || suffix.includes('Dim')) {
    quality = 'Diminuto';
  } else if (suffix.includes('Aug') || suffix.includes('aug') || suffix.includes('+') || suffix.includes('(#5)') || suffix.includes('(♯5)')) {
    quality = 'Aumentado';
  } else if (suffix.includes('sus')) {
    quality = 'Suspenso';
  } else if (suffix.startsWith('m') && !suffix.startsWith('Maj') && !suffix.startsWith('maj') && !suffix.startsWith('M7')) {
    quality = 'Menor';
  } else if (suffix.includes('7') && !suffix.includes('Maj7') && !suffix.includes('maj7') && !suffix.includes('7M')) {
    quality = 'Dominante';
  } else {
    quality = 'Maior';
  }

  const tensoesIdeais: ChordTensionOption[] = [];
  const substitutos: ChordSubstituteOption[] = [];
  let escalaImproviso: SoloScaleRecommendation;

  switch (quality) {
    case 'Diminuto': {
      const n9 = getNoteNameByOffset(root, 2);
      const n11 = getNoteNameByOffset(root, 5);
      const nb13 = getNoteNameByOffset(root, 8);
      const n7M = getNoteNameByOffset(root, 11);

      tensoesIdeais.push(
        {
          label: '9ª Maior (Tensão 1 Tom Acima)',
          noteName: n9,
          chordSymbol: `${root}°(add9)${bassSuffix}`,
          description: 'Tensão situada a 1 tom inteiro acima da tônica, típica da Escala Diminuta Tom-Semitom.'
        },
        {
          label: '11ª Justa (1 Tom Acima da 3ªm)',
          noteName: n11,
          chordSymbol: `${root}°(11)${bassSuffix}`,
          description: 'Tensão situada a 1 tom inteiro acima da terça menor, conferindo textura fluida e rica.'
        },
        {
          label: '♭13 (1 Tom Acima da 5ªd)',
          noteName: nb13,
          chordSymbol: `${root}°(♭13)${bassSuffix}`,
          description: 'Tensão situada a 1 tom acima da quinta diminuta, explorada no Jazz contemporâneo.'
        },
        {
          label: '7ª Maior (1 Tom Acima da °7)',
          noteName: n7M,
          chordSymbol: `${root}°(maj7)${bassSuffix}`,
          description: 'Tensão superior sobre a sétima diminuta, gerando cor melódica refinada.'
        }
      );

      const sim1 = getNoteNameByOffset(root, 3);
      const sim2 = getNoteNameByOffset(root, 6);
      const sim3 = getNoteNameByOffset(root, 9);
      const subDom = getNoteNameByOffset(root, 11);

      substitutos.push(
        {
          title: 'Simetria Diminuta (Ciclo de 3ª Menor)',
          chordSymbol: `${sim1}°7 / ${sim2}°7 / ${sim3}°7`,
          description: 'A tétrade diminuta divide a oitava em 4 partes iguais de 3 semitons. Todas as 4 posições compartilham as mesmas notas!'
        },
        {
          title: 'Dominante V7(♭9) sem Fundamental',
          chordSymbol: `${subDom}7(♭9)`,
          description: `O acorde ${root}°7 atua diretamente como ${subDom}7(♭9) (sem a fundamental ${subDom}), resolvendo com altíssima atração tonal.`
        },
        {
          title: 'Diminuto de Passagem Cromática',
          chordSymbol: `${root}°7 → ${getNoteNameByOffset(root, 1)}m7`,
          description: 'Condução cromática ascendente clássica conectando graus diatônicos.'
        }
      );

      const scaleNotes = [0, 2, 3, 5, 6, 8, 9, 11].map((offset) => getNoteNameByOffset(root, offset));
      escalaImproviso = {
        scaleName: 'Escala Diminuta Tom-Semitom (Octafônica)',
        notes: scaleNotes,
        tip: `A Escala Diminuta (Tom-Semitom) é octafônica e perfeitamente simétrica. Cada nota da tétrade (${root}, ${sim1}, ${sim2}, ${sim3}) aceita uma tensão situada exatamente 1 tom inteiro acima.`
      };
      break;
    }

    case 'MeioDiminuto': {
      const n9 = getNoteNameByOffset(root, 2);
      const n11 = getNoteNameByOffset(root, 5);
      const nb13 = getNoteNameByOffset(root, 8);

      tensoesIdeais.push(
        {
          label: '9ª Maior (Lócrio ♮9)',
          noteName: n9,
          chordSymbol: `${root}m9(♭5)${bassSuffix}`,
          description: 'Tensão moderna do modo Lócrio 9ª Maior (6º modo da Menor Melódica), sem atrito com a tônica.'
        },
        {
          label: '11ª Justa',
          noteName: n11,
          chordSymbol: `${root}m11(♭5)${bassSuffix}`,
          description: 'Sonoridade aberta e estável para acordes meio-diminutos em cadências II-V menores.'
        },
        {
          label: '♭13 / 6ª Menor',
          noteName: nb13,
          chordSymbol: `${root}m7(♭5,♭13)${bassSuffix}`,
          description: 'Nota característica da harmonia menor com grande expressividade melódica.'
        }
      );

      const ivMenor6 = getNoteNameByOffset(root, 3);
      const domCad = getNoteNameByOffset(root, 5);
      const subV = getNoteNameByOffset(root, 11);

      substitutos.push(
        {
          title: 'Relativo Menor com 6ª (IVm6)',
          chordSymbol: `${ivMenor6}m6`,
          description: `O acorde ${root}m7(♭5) possui exatamente as mesmas notas que ${ivMenor6}m6, permitindo troca imediata de textura.`
        },
        {
          title: 'Cadência II-V Menor',
          chordSymbol: `${root}m7(♭5) → ${domCad}7(♭9)`,
          description: 'Preparação cadencial clássica conduzindo à resolução em acorde menor.'
        },
        {
          title: 'SubV7 do Dominante',
          chordSymbol: `${subV}7(9)`,
          description: 'Substituto cromático que atua preparando o centro tonal com movimento suave de baixo.'
        }
      );

      const scaleNotes = [0, 2, 3, 5, 6, 8, 10].map((offset) => getNoteNameByOffset(root, offset));
      escalaImproviso = {
        scaleName: 'Modo Lócrio ♮9 / Modo Lócrio',
        notes: scaleNotes,
        tip: `Para o II grau menor, utilize o Modo Lócrio ♮9 (${root} - ${n9} - ${getNoteNameByOffset(root, 3)} - ${n11} - ${getNoteNameByOffset(root, 6)} - ${nb13} - ${getNoteNameByOffset(root, 10)}) para uma sonoridade moderna e rica.`
      };
      break;
    }

    case 'Aumentado': {
      const n9 = getNoteNameByOffset(root, 2);
      const n11aum = getNoteNameByOffset(root, 6);
      const n7M = getNoteNameByOffset(root, 11);
      const n7m = getNoteNameByOffset(root, 10);

      tensoesIdeais.push(
        {
          label: '9ª Maior',
          noteName: n9,
          chordSymbol: `${root}9(♯5)${bassSuffix}`,
          description: 'Nona maior que se integra perfeitamente à Escala de Tons Inteiros (Hexafônica).'
        },
        {
          label: '11ª Aumentada (♯11)',
          noteName: n11aum,
          chordSymbol: `${root}+(♯11)${bassSuffix}`,
          description: 'Tensão brilhante do modo Lídio Aumentado (3º modo da Escala Menor Melódica).'
        },
        {
          label: '7ª Maior (7M)',
          noteName: n7M,
          chordSymbol: `${root}maj7(♯5)${bassSuffix}`,
          description: 'Acorde maior com 7ª maior e 5ª aumentada, com sonoridade moderna e impressionista.'
        },
        {
          label: '7ª Menor (Dominante 7♯5)',
          noteName: n7m,
          chordSymbol: `${root}7(♯5)${bassSuffix}`,
          description: 'Dominante com quinta aumentada gerando forte atração de resolução.'
        }
      );

      const simAum1 = getNoteNameByOffset(root, 4);
      const simAum2 = getNoteNameByOffset(root, 8);
      const subVAum = getNoteNameByOffset(root, 1);

      substitutos.push(
        {
          title: 'Simetria Aumentada (Ciclo de 3ª Maior)',
          chordSymbol: `${simAum1}+ / ${simAum2}+`,
          description: 'A tríade aumentada divide a oitava em 3 partes iguais de 4 semitons. Todas as 3 posições possuem as mesmas notas!'
        },
        {
          title: 'Dominante Alterado V7(♯5)',
          chordSymbol: `${root}7(♯5)`,
          description: 'Função dominante enérgica com a 5ª aumentada atuando como sensível ascendente.'
        },
        {
          title: 'SubV7 Alterado',
          chordSymbol: `${subVAum}7(♯5)`,
          description: 'Substituto de trítono com quinta aumentada para resoluções cromáticas sofisticadas.'
        }
      );

      const scaleNotes = [0, 2, 4, 6, 8, 10].map((offset) => getNoteNameByOffset(root, offset));
      escalaImproviso = {
        scaleName: 'Escala de Tons Inteiros (Hexafônica) / Lídia Aumentada',
        notes: scaleNotes,
        tip: `A Escala de Tons Inteiros (${root} - ${n9} - ${getNoteNameByOffset(root, 4)} - ${n11aum} - ${getNoteNameByOffset(root, 8)} - ${n7m}) é formada exclusivamente por intervalos de 1 tom e casa com perfeição na tríade aumentada. Para Maj7(♯5), use a Lídia Aumentada.`
      };
      break;
    }

    case 'Suspenso': {
      const n9 = getNoteNameByOffset(root, 2);
      const n13 = getNoteNameByOffset(root, 9);
      const n7m = getNoteNameByOffset(root, 10);

      tensoesIdeais.push(
        {
          label: '9ª Maior',
          noteName: n9,
          chordSymbol: `${root}9sus4${bassSuffix}`,
          description: 'Nona maior sobre a 4ª suspensa, criando abertura harmônica contemporânea.'
        },
        {
          label: '13ª Maior',
          noteName: n13,
          chordSymbol: `${root}13sus4${bassSuffix}`,
          description: 'Extensão sofisticada presente no Gospel, Fusion e Jazz moderno.'
        },
        {
          label: '7ª Menor',
          noteName: n7m,
          chordSymbol: `${root}7sus4${bassSuffix}`,
          description: 'Estrutura dominante com suspensão que retarda a resolução na terça.'
        }
      );

      const slashSub = getNoteNameByOffset(root, 10);
      const iiCad = getNoteNameByOffset(root, 7);

      substitutos.push(
        {
          title: 'Slash Chord Superior',
          chordSymbol: `${slashSub}/${root}`,
          description: `A tríade de ${slashSub} tocada com o baixo em ${root} gera o acorde ${root}9sus4 completo com condução limpa.`
        },
        {
          title: 'II-V Fundido',
          chordSymbol: `${iiCad}m7/${root}`,
          description: 'Fusão entre o II grau menor e o V dominante suspenso em um único voicing.'
        },
        {
          title: 'Dominante com Resolução',
          chordSymbol: `${root}7sus4 → ${root}7(9)`,
          description: 'Condução harmônica clássica liberando a 4ª justa para a 3ª maior.'
        }
      );

      const scaleNotes = [0, 2, 5, 7, 9, 10].map((offset) => getNoteNameByOffset(root, offset));
      escalaImproviso = {
        scaleName: 'Modo Mixolídio com 4ª / Modo Dórico',
        notes: scaleNotes,
        tip: `Evite enfatizar a 3ª maior durante o acorde suspenso para preservar a sensação de flutuação. Foque na 9ª (${n9}), 4ª (${getNoteNameByOffset(root, 5)}) e 13ª (${n13}).`
      };
      break;
    }

    case 'Maior': {
      const n9 = getNoteNameByOffset(root, 2);
      const n11aum = getNoteNameByOffset(root, 6);
      const n13 = getNoteNameByOffset(root, 9);

      tensoesIdeais.push(
        {
          label: '9ª Maior',
          noteName: n9,
          chordSymbol: `${root}add9${bassSuffix}`,
          description: 'Adiciona brilho moderno e sonoridade flutuante sem alterar a função tônica.'
        },
        {
          label: '11ª Aumentada (#11)',
          noteName: n11aum,
          chordSymbol: `${root}maj7(#11)${bassSuffix}`,
          description: 'Sonoridade Lídia requintada e jazzística, marca registrada da Bossa Nova e Jazz.'
        },
        {
          label: '13ª Maior (Sexta)',
          noteName: n13,
          chordSymbol: `${root}6/9${bassSuffix}`,
          description: 'Acorde de sexta com nona, extremamente suave para finalizações ou estrofes.'
        }
      );

      const relMenor = getNoteNameByOffset(root, 9);
      const subV = getNoteNameByOffset(root, 1);
      const antiRel = getNoteNameByOffset(root, 4);

      substitutos.push(
        {
          title: 'Relativo Menor (VI grau)',
          chordSymbol: `${relMenor}m7${bassSuffix}`,
          description: 'Mesma armadura de clave mudando o centro gravitacional para o tom relativo menor.'
        },
        {
          title: 'SubV7 (Substituto de Trítono)',
          chordSymbol: `${subV}7(9)`,
          description: 'Substituto de trítono que resolve cromaticamente a meio tom de distância da tônica.'
        },
        {
          title: 'Anti-Relativo (III Grau)',
          chordSymbol: `${antiRel}m7`,
          description: 'Troca pelo III grau menor mantendo duas notas de apoio em comum.'
        }
      );

      const scaleNotes = [0, 2, 4, 6, 7, 9, 11].map((offset) => getNoteNameByOffset(root, offset));
      escalaImproviso = {
        scaleName: 'Modo Lídio / Modo Jônio',
        notes: scaleNotes,
        tip: `Solos sobre a tônica ${root}: explore repouso na 3ªM (${getNoteNameByOffset(root, 4)}) e na 7ªM (${getNoteNameByOffset(root, 11)}). Use a 11ª Aumentada (${n11aum}) para cor Lídia.`
      };
      break;
    }

    case 'Menor': {
      const n9 = getNoteNameByOffset(root, 2);
      const n11 = getNoteNameByOffset(root, 5);
      const n13 = getNoteNameByOffset(root, 9);

      tensoesIdeais.push(
        {
          label: '9ª Maior',
          noteName: n9,
          chordSymbol: `${root}m9${bassSuffix}`,
          description: 'Tensão melancólica e expressiva perfeita para passagens lentas e MPB.'
        },
        {
          label: '11ª Justa',
          noteName: n11,
          chordSymbol: `${root}m11${bassSuffix}`,
          description: 'Sonoridade aberta e textura moderna em arranjos contemporâneos.'
        },
        {
          label: '13ª Maior (6ª Dórica)',
          noteName: n13,
          chordSymbol: `${root}m6${bassSuffix}`,
          description: 'Toque Dório com a 6ª maior marcante, muito usada no Jazz e Soul.'
        }
      );

      const relMaior = getNoteNameByOffset(root, 3);
      const iiCadencial = getNoteNameByOffset(root, 2);
      const vCadencial = getNoteNameByOffset(root, 7);
      const grauVI = getNoteNameByOffset(root, 8);

      substitutos.push(
        {
          title: 'Relativo Maior (III Grau)',
          chordSymbol: `${relMaior}maj7${bassSuffix}`,
          description: 'Expande a harmonia menor abrindo para um centro maior luminoso.'
        },
        {
          title: 'II-V Menor Cadencial',
          chordSymbol: `${iiCadencial}m7(b5) - ${vCadencial}7(b9)`,
          description: 'Cadência menor completa de preparação para transformar a frase.'
        },
        {
          title: 'Grau VI Maior',
          chordSymbol: `${grauVI}maj7`,
          description: 'Substituição pelo grau VI maior enriquecido com 7ª Maior.'
        }
      );

      const scaleNotes = [0, 2, 3, 5, 7, 9, 10].map((offset) => getNoteNameByOffset(root, offset));
      escalaImproviso = {
        scaleName: 'Modo Dório / Pentatônica Menor',
        notes: scaleNotes,
        tip: `O Modo Dório destaca a 6ª Maior (${n13}) e a 9ª Maior (${n9}). A Pentatônica Menor de ${root} com Blue Note é infalível.`
      };
      break;
    }

    case 'Dominante': {
      const n9 = getNoteNameByOffset(root, 2);
      const nb9 = getNoteNameByOffset(root, 1);
      const n13 = getNoteNameByOffset(root, 9);

      tensoesIdeais.push(
        {
          label: '9ª Maior',
          noteName: n9,
          chordSymbol: `${root}9${bassSuffix}`,
          description: 'Dominante suave com nona maior que atua sem agredir o arranjo.'
        },
        {
          label: '9ª Menor (b9)',
          noteName: nb9,
          chordSymbol: `${root}7(b9)${bassSuffix}`,
          description: 'Tensão dramática com altíssima atração de resolução na tônica.'
        },
        {
          label: '13ª Maior',
          noteName: n13,
          chordSymbol: `${root}13${bassSuffix}`,
          description: 'Extensão refinada característica de Bossa Nova, Samba-Jazz e Fusion.'
        }
      );

      const subV = getNoteNameByOffset(root, 6);
      const dimPasso = getNoteNameByOffset(root, 1);
      const iiRelativo = getNoteNameByOffset(root, 7);

      substitutos.push(
        {
          title: 'SubV7 (Substituto de Trítono)',
          chordSymbol: `${subV}7(9)`,
          description: 'Substituição pelo dominante localizado a 3 tons inteiros de distância.'
        },
        {
          title: 'Diminuto de Passo',
          chordSymbol: `${dimPasso}°7`,
          description: 'Passagem cromática ascendente para conduzir ao próximo acorde.'
        },
        {
          title: 'II-V Expandido',
          chordSymbol: `${iiRelativo}m7 - ${root}7`,
          description: 'Inclusão do II grau menor relativo para estender a cadência dominante.'
        }
      );

      const scaleNotes = [0, 2, 4, 5, 7, 9, 10].map((offset) => getNoteNameByOffset(root, offset));
      escalaImproviso = {
        scaleName: 'Modo Mixolídio / Escala Alterada',
        notes: scaleNotes,
        tip: `Crie tensão usando a 7ª menor (${getNoteNameByOffset(root, 10)}) e brinque com as notas de extensão antes da resolução.`
      };
      break;
    }
  }

  return {
    cifraOriginal: cifraStr,
    rootNote: root,
    quality,
    tensoesIdeais,
    substitutos,
    escalaImproviso,
    inversaoInfo: parsed?.inversion
  };
}

/**
 * REARMONIZADOR DE CIFRA PARA ESTILO JAZZ (ALGORITMO INTELIGENTE)
 */
export function reharmonizeChordToJazz(cifraStr: string): string {
  if (!cifraStr) return cifraStr;

  const parsed = parseChordSymbolToNotes(cifraStr);
  if (!parsed) return cifraStr;

  const { rootNote: root, variationStr: suffix, bassNote: bass } = parsed;
  const bassPart = bass ? `/${bass}` : '';

  if (suffix.includes('9') || suffix.includes('11') || suffix.includes('13') || suffix.includes('6/9')) {
    return cifraStr;
  }

  if (suffix === 'Maior' || suffix === '') {
    const idx = (root.charCodeAt(0) + (root.charCodeAt(1) || 0)) % 3;
    return `${[`${root}add9`, `${root}maj7`, `${root}6/9`][idx]}${bassPart}`;
  }

  if (suffix === 'm') {
    return `${root}m9${bassPart}`;
  }

  if (suffix === '7') {
    return `${root}7(13)${bassPart}`;
  }

  if (suffix === 'Maj7') {
    return `${root}maj9${bassPart}`;
  }

  if (suffix === 'm7') {
    return `${root}m9${bassPart}`;
  }

  if (suffix === 'sus4') {
    return `${root}7sus4${bassPart}`;
  }

  if (suffix.includes('dim') || suffix.includes('°')) {
    return `${root}°7${bassPart}`;
  }

  if (suffix.includes('m7(♭5)') || suffix.includes('m7b5') || suffix.includes('ø')) {
    return `${root}m9(♭5)${bassPart}`;
  }

  if (suffix.includes('aug') || suffix.includes('+')) {
    return `${root}7(♯5)${bassPart}`;
  }

  return `${cifraStr}`;
}

/**
 * REARMONIZA A LINHA DO TEMPO INTEIRA PARA JAZZ
 */
export function reharmonizeTimelineToJazz(linhaDoTempo: { tempo: number; cifra: string }[]): { tempo: number; cifra: string }[] {
  if (!linhaDoTempo || linhaDoTempo.length === 0) return [];
  return linhaDoTempo.map((item) => ({
    tempo: item.tempo,
    cifra: reharmonizeChordToJazz(item.cifra)
  }));
}
