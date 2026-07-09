import chordsData from '../data/chords.json';

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
  quality: 'Maior' | 'Menor' | 'Dominante' | 'Diminuto' | 'MeioDiminuto' | 'Suspenso';
  tensoesIdeais: ChordTensionOption[];
  substitutos: ChordSubstituteOption[];
  escalaImproviso: SoloScaleRecommendation;
}

const NOTE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const NOTES_CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_CHROMATIC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Calcula o nome da nota a partir de um deslocamento de semitons da nota tônica
 */
export function getNoteNameByOffset(rootNote: string, offsetSemitones: number): string {
  const rootIndex = NOTE_SEMITONES[rootNote] ?? 0;
  const targetIndex = (rootIndex + offsetSemitones) % 12;
  const useFlat = ['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'F'].includes(rootNote);
  return useFlat ? NOTES_CHROMATIC_FLAT[targetIndex] : NOTES_CHROMATIC_SHARP[targetIndex];
}

/**
 * Extrai a Nota Tônica e o Sufixo da Cifra
 */
export function parseRootAndSuffix(cifraStr: string): { root: string; suffix: string; bass: string | null } {
  let baseStr = cifraStr.trim();
  let bass: string | null = null;
  if (baseStr.includes('/')) {
    const parts = baseStr.split('/');
    baseStr = parts[0];
    bass = parts[1];
  }

  const match = baseStr.match(/^([A-G][#b♯♭]?)/);
  if (!match) return { root: 'C', suffix: '', bass };

  const root = match[1].replace('♯', '#').replace('♭', 'b');
  const suffix = baseStr.substring(match[0].length);
  return { root, suffix, bass };
}

/**
 * GERA OS INSIGHTS DE HARMÔNIA, TENSOES, SUBSTITUTOS E ESCALAS
 */
export function getChordInsights(cifraStr: string): ChordInsightResult {
  const { root, suffix, bass } = parseRootAndSuffix(cifraStr);
  const bassSuffix = bass ? `/${bass}` : '';

  let quality: 'Maior' | 'Menor' | 'Dominante' | 'Diminuto' | 'MeioDiminuto' | 'Suspenso' = 'Maior';

  if (suffix.includes('m7b5') || suffix.includes('ø')) {
    quality = 'MeioDiminuto';
  } else if (suffix.includes('dim') || suffix.includes('°')) {
    quality = 'Diminuto';
  } else if (suffix.includes('sus')) {
    quality = 'Suspenso';
  } else if (suffix.startsWith('m') && !suffix.startsWith('maj') && !suffix.startsWith('Maj') && !suffix.startsWith('M7')) {
    quality = 'Menor';
  } else if (suffix.includes('7') && !suffix.includes('maj7') && !suffix.includes('Maj7') && !suffix.includes('M7')) {
    quality = 'Dominante';
  } else {
    quality = 'Maior';
  }

  const tensoesIdeais: ChordTensionOption[] = [];
  const substitutos: ChordSubstituteOption[] = [];
  let escalaImproviso: SoloScaleRecommendation;

  switch (quality) {
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
          description: 'Acorde de sextal com nona, extremamente suave para finalizações ou estrofes.'
        }
      );

      const relMenor = getNoteNameByOffset(root, 9);
      const subV = getNoteNameByOffset(root, 1);
      const antiRel = getNoteNameByOffset(root, 4);

      substitutos.push(
        {
          title: 'Relativo Menor',
          chordSymbol: `${relMenor}m7${bassSuffix}`,
          description: 'Mesma armadura de clave mudando o centro gravitacional para o tom relativo menor.'
        },
        {
          title: 'SubV7 (Trítono)',
          chordSymbol: `${subV}7(9)`,
          description: 'Substituto de trítono que resolve suavemente a meio tom de distância da tônica.'
        },
        {
          title: 'Anti-Relativo (III Grau)',
          chordSymbol: `${antiRel}m7`,
          description: 'Troca pelo III grau menor mantendo duas notas de apoio em comum.'
        }
      );

      const scaleNotes = [0, 2, 4, 6, 7, 9, 11].map(offset => getNoteNameByOffset(root, offset));
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
          title: 'Relativo Maior',
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

      const scaleNotes = [0, 2, 3, 5, 7, 9, 10].map(offset => getNoteNameByOffset(root, offset));
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
          title: 'SubV7 (Trítono)',
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

      const scaleNotes = [0, 2, 4, 5, 7, 9, 10].map(offset => getNoteNameByOffset(root, offset));
      escalaImproviso = {
        scaleName: 'Modo Mixolídio / Escala Alterada',
        notes: scaleNotes,
        tip: `Crie tensão usando a 7ª menor (${getNoteNameByOffset(root, 10)}) e brinque com as notas de extensão antes da resolução.`
      };
      break;
    }

    default: {
      const n9 = getNoteNameByOffset(root, 2);
      const n11 = getNoteNameByOffset(root, 5);

      tensoesIdeais.push(
        {
          label: '9ª Maior',
          noteName: n9,
          chordSymbol: `${root}m9(b5)`,
          description: 'Tensão da Escala Lócria 9ª para solos e arranjos modernos.'
        },
        {
          label: '11ª Justa',
          noteName: n11,
          chordSymbol: `${root}m11(b5)`,
          description: 'Abertura harmônica fluida no acorde diminuto.'
        }
      );

      const subDom = getNoteNameByOffset(root, 1);
      substitutos.push({
        title: 'Dominante de Resolução',
        chordSymbol: `${subDom}7(b9)`,
        description: 'Condução harmônica direta para a tônica principal.'
      });

      const scaleNotes = [0, 1, 3, 5, 6, 8, 10].map(offset => getNoteNameByOffset(root, offset));
      escalaImproviso = {
        scaleName: 'Modo Lócrio',
        notes: scaleNotes,
        tip: `Foque nos arpejos com 3ª menor, 5ª diminuta e 7ª menor para delineamento melódico preciso.`
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
    escalaImproviso
  };
}

/**
 * REARMONIZADOR DE CIFRA PARA ESTILO JAZZ (ALGORITMO INTELIGENTE)
 */
export function reharmonizeChordToJazz(cifraStr: string): string {
  if (!cifraStr) return cifraStr;

  const { root, suffix, bass } = parseRootAndSuffix(cifraStr);
  const bassPart = bass ? `/${bass}` : '';

  // Se já for um acorde bastante estendido (com 9, 11, 13, #11, b9), mantém
  if (suffix.includes('9') || suffix.includes('11') || suffix.includes('13') || suffix.includes('6/9')) {
    return cifraStr;
  }

  if (suffix === '' || suffix === 'M') {
    // Tríade Maior -> Cadd9 ou Cmaj7
    const jazzVariants = [`${root}add9`, `${root}maj7`, `${root}maj9`, `${root}6/9`];
    // Escolhe deterministicamente com base na nota tônica para consistência
    const idx = (root.charCodeAt(0) + (root.charCodeAt(1) || 0)) % 3;
    return `${[`${root}add9`, `${root}maj7`, `${root}6/9`][idx]}${bassPart}`;
  }

  if (suffix === 'm' || suffix === 'min') {
    // Tríade Menor -> Am9 ou Am7
    return `${root}m9${bassPart}`;
  }

  if (suffix === '7') {
    // Dominante -> G7(13) ou G9
    return `${root}7(13)${bassPart}`;
  }

  if (suffix === 'maj7' || suffix === 'Maj7') {
    return `${root}maj9${bassPart}`;
  }

  if (suffix === 'm7') {
    return `${root}m9${bassPart}`;
  }

  if (suffix === 'sus4') {
    return `${root}7sus4${bassPart}`;
  }

  return `${cifraStr}`;
}

/**
 * REARMONIZA A LINHA DO TEMPO INTEIRA PARA JAZZ
 */
export function reharmonizeTimelineToJazz(linhaDoTempo: { tempo: number; cifra: string }[]): { tempo: number; cifra: string }[] {
  if (!linhaDoTempo || linhaDoTempo.length === 0) return [];
  return linhaDoTempo.map(item => ({
    tempo: item.tempo,
    cifra: reharmonizeChordToJazz(item.cifra)
  }));
}
