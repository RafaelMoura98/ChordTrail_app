import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Music, Volume2, Sparkles, Clock, Database, 
  Keyboard, RefreshCw, ChevronRight, Play, Pause, CheckCircle2,
  Wand2, Cpu, Loader2, ArrowRight, Eye, FastForward, Rewind, RotateCcw,
  Trash2, Plus, Filter, Search, Info, Zap, FileUp, Layers, Check, FileText
} from 'lucide-react';
import chordsData from './data/chords.json';
import { ChordInsightsPanel } from './components/ChordInsightsPanel';
import { reharmonizeTimelineToJazz } from './utils/harmonyEngine';
import { PdfUploader } from './components/PdfUploader';
import { UnifiedInputPanel } from './components/UnifiedInputPanel';
import { SyncFeedbackBanner } from './components/SyncFeedbackBanner';

// Estrutura detalhada de notas musicais para acender no Teclado Piano
export interface ParsedChordNote {
  noteName: string;
  octave: number;
  midiNote: number;
  frequency: number;
  interval: number;
}

export interface ParsedChord {
  cifraOriginal: string;
  rootNote: string;
  variationStr: string;
  bassNote: string | null;
  intervals: number[];
  notes: ParsedChordNote[];
}

// Tipos do Dicionário de Acordes
type RootNote = typeof chordsData.notasFundamentais[number];
type VariationName = keyof typeof chordsData.variacoes;

const ROOT_NATURAL_NOTES: RootNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ROOT_ACCIDENTAL_NOTES: RootNote[] = ['C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb'];
const ALL_ROOT_NOTES: RootNote[] = [...ROOT_NATURAL_NOTES, ...ROOT_ACCIDENTAL_NOTES];

// Categorização Teórica das Variações de Acordes
const CHORD_CATEGORIES: Record<string, VariationName[]> = {
  'Tríades': ['Maior', 'm', 'Aug / +', 'Dim / °', 'sus2', 'sus4'],
  'Tétrades & Sétimas': ['7', 'Maj7', 'm7', 'm(Maj7)', 'm7(♭5) / ø', 'Dim7 / °7'],
  'Sextas & Nonas': ['6', 'm6', 'add9', 'm(add9)', '9', 'Maj9', 'm9', '6/9'],
  'Suspensos & Alterados': ['7sus2', '7sus4']
};

const THEORETICAL_NAMES: Record<string, string> = {
  'Maior': 'Tríade Maior',
  'm': 'Tríade Menor',
  'Aug / +': 'Tríade Aumentada',
  'Dim / °': 'Tríade Diminuta',
  'sus2': 'Acorde Suspenso de Segunda (Sus2)',
  'sus4': 'Acorde Suspenso de Quarta (Sus4)',
  '6': 'Acorde Maior com Sexta',
  'm6': 'Acorde Menor com Sexta',
  '7': 'Acorde Dominante com Sétima',
  'Maj7': 'Acorde Maior com Sétima Maior',
  'm7': 'Acorde Menor com Sétima',
  'm(Maj7)': 'Acorde Menor com Sétima Maior',
  'm7(♭5) / ø': 'Acorde Meio-Diminuto',
  'Dim7 / °7': 'Tétrade Diminuta',
  'add9': 'Acorde Maior com Nona',
  'm(add9)': 'Acorde Menor com Nona',
  '7sus2': 'Dominante com Segunda Suspensa',
  '7sus4': 'Dominante com Quarta Suspensa',
  '9': 'Acorde Dominante com Nona',
  'Maj9': 'Acorde Maior com Sétima Maior e Nona',
  'm9': 'Acorde Menor com Sétima e Nona',
  '6/9': 'Acorde Maior com Sexta e Nona'
};

const VARIATION_DISPLAY_SUFFIX: Record<string, string> = {
  "Maior": "",
  "m": "m",
  "Aug / +": "aug",
  "Dim / °": "dim",
  "sus2": "sus2",
  "sus4": "sus4",
  "6": "6",
  "m6": "m6",
  "7": "7",
  "Maj7": "Maj7",
  "m7": "m7",
  "m(Maj7)": "m(Maj7)",
  "m7(♭5) / ø": "m7(b5)",
  "Dim7 / °7": "dim7",
  "add9": "add9",
  "m(add9)": "m(add9)",
  "7sus2": "7sus2",
  "7sus4": "7sus4",
  "9": "9",
  "Maj9": "Maj9",
  "m9": "m9",
  "m(Maj9)": "m(Maj9)",
  "11": "11",
  "Maj11": "Maj11",
  "m11": "m11",
  "13": "13",
  "Maj13": "Maj13",
  "m13": "m13",
  "7(♭5)": "7(b5)",
  "7(♯5)": "7(#5)",
  "7(♭9)": "7(b9)",
  "7(♯9)": "7(#9)",
  "7(♭5♭9)": "7(b5 b9)",
  "7(♯5♯9)": "7(#5 #9)",
  "7(♯11)": "7(#11)",
  "Maj7(♯5)": "Maj7(#5)",
  "6/9": "6/9"
};

const NOTE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const INTERVAL_LABELS: Record<number, string> = {
  0: 'Tônica (T)',
  1: '2ª Menor (b9)',
  2: '2ª Maior (9)',
  3: '3ª Menor (3m)',
  4: '3ª Maior (3M)',
  5: '4ª Justa (11)',
  6: '5ª Diminuta (b5)',
  7: '5ª Justa (5J)',
  8: '5ª Aumentada (#5)',
  9: '6ª Maior (13)',
  10: '7ª Menor (7m)',
  11: '7ª Maior (7M)',
  12: 'Oitava (8ª)'
};

// Cálculo de Frequência MIDI (A440 = MIDI 69)
function getMidiFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function getNoteNameAndOctave(rootNote: string, semitonesFromRoot: number, useFlats: boolean) {
  const rootIndex = NOTE_SEMITONES[rootNote] ?? 0;
  const totalSemitones = rootIndex + semitonesFromRoot;
  const baseMidi = 48 + totalSemitones;
  const octave = Math.floor(baseMidi / 12) - 1;
  const noteInOctave = totalSemitones % 12;
  const scale = useFlats ? NOTES_FLAT : NOTES_SHARP;
  const noteName = scale[noteInOctave];
  return { noteName, octave, midiNote: baseMidi, frequency: getMidiFrequency(baseMidi) };
}

/**
 * EXTRAÇÃO AUTOMÁTICA DE ACORDES DA CIFRA
 */
function extractChordsFromText(text: string): string[] {
  if (!text) return [];

  const chordRegex = /(?<![a-zA-ZÀ-ÿ0-9])([A-G][#b♯♭]?(?:m|min|maj|Maj|M|aug|dim|sus|add|°|ø|\+|-)*(?:\([#b♭♯]?\d+\)|[0-9])*(?:\/[A-G][#b♯♭]?)?)(?![a-zÀ-ÿ1-9])/g;
  const lines = text.split('\n');
  const extracted: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || (trimmed.startsWith('[') && trimmed.endsWith(']'))) continue;

    let match: RegExpExecArray | null;
    while ((match = chordRegex.exec(line)) !== null) {
      if (match[1]) {
        extracted.push(match[1]);
      }
    }
  }

  return extracted;
}



/**
 * CONVERSOR DE CIFRA PARA NOTAS MIDI
 */
export function parseChordSymbolToNotes(cifra: string): ParsedChord | null {
  if (!cifra) return null;

  let baseChord = cifra.trim();
  let bassNote: string | null = null;
  if (baseChord.includes('/')) {
    const parts = baseChord.split('/');
    baseChord = parts[0];
    bassNote = parts[1];
  }

  const rootMatch = baseChord.match(/^([A-G][#b♯♭]?)/);
  if (!rootMatch) return null;

  let rootNote = rootMatch[1].replace('♯', '#').replace('♭', 'b');
  let suffix = baseChord.substring(rootMatch[0].length);

  let variationKey = suffix;
  if (!suffix || suffix === 'M') variationKey = 'Maior';
  else if (suffix === 'm' || suffix === 'min') variationKey = 'm';
  else if (suffix === '7') variationKey = '7';
  else if (suffix === 'maj7' || suffix === 'Maj7' || suffix === 'M7') variationKey = 'Maj7';
  else if (suffix === 'm7') variationKey = 'm7';
  else if (suffix === 'dim' || suffix === '°') variationKey = 'Dim / °';
  else if (suffix === 'aug' || suffix === '+') variationKey = 'Aug / +';
  else if (suffix === 'sus4') variationKey = 'sus4';
  else if (suffix === 'sus2') variationKey = 'sus2';
  else if (suffix === 'add9') variationKey = 'add9';
  else if (suffix === 'm6') variationKey = 'm6';
  else if (suffix === '6') variationKey = '6';

  const variacoesMap = chordsData.variacoes as Record<string, number[]>;
  let intervals = variacoesMap[variationKey];

  if (!intervals) {
    if (suffix.startsWith('m')) intervals = [0, 3, 7];
    else if (suffix.includes('dim') || suffix.includes('°')) intervals = [0, 3, 6];
    else if (suffix.includes('aug') || suffix.includes('+')) intervals = [0, 4, 8];
    else intervals = [0, 4, 7];
  }

  const useFlats = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(rootNote);
  const notes = intervals.map((interval) => {
    const details = getNoteNameAndOctave(rootNote, interval, useFlats);
    return {
      ...details,
      interval
    };
  });

  return {
    cifraOriginal: cifra,
    rootNote,
    variationStr: variationKey,
    bassNote,
    intervals,
    notes
  };
}

/**
 * DETECÇÃO DE ACORDES A PARTIR DE NOTAS MIDI PRESSIONADAS
 */
export function detectChordsFromMidi(midiNotes: number[]): {
  chordSymbol: string;
  rootNote: string;
  variationStr: string;
  intervals: number[];
  notes: ParsedChordNote[];
  confidence: number;
}[] {
  if (midiNotes.length === 0) return [];

  const uniquePitchClasses = Array.from(new Set(midiNotes.map(n => n % 12)));
  const results: any[] = [];
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
      const useFlats = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(rootName);
      
      const playedRelIntervals = uniquePitchClasses
        .map(pc => (pc - rootPc + 12) % 12)
        .sort((a, b) => a - b);

      for (const [varName, intervals] of Object.entries(variacoesMap)) {
        const varIntervalsMod12 = Array.from(new Set(intervals.map(i => i % 12))).sort((a, b) => a - b);
        
        const matchesExactly = 
          playedRelIntervals.length === varIntervalsMod12.length &&
          playedRelIntervals.every((val, index) => val === varIntervalsMod12[index]);

        if (matchesExactly) {
          const suffix = VARIATION_DISPLAY_SUFFIX[varName] !== undefined ? VARIATION_DISPLAY_SUFFIX[varName] : varName;
          const symbol = `${rootName}${suffix}`;
          
          const parsedNotes = intervals.map((interval) => {
            const details = getNoteNameAndOctave(rootName, interval, useFlats);
            return {
              ...details,
              interval
            };
          });

          results.push({
            chordSymbol: symbol,
            rootNote: rootName,
            variationStr: varName,
            intervals,
            notes: parsedNotes,
            confidence: 100
          });
        } else {
          const isSubset = playedRelIntervals.every(val => varIntervalsMod12.includes(val));
          if (isSubset && playedRelIntervals.length >= 2) {
            const suffix = VARIATION_DISPLAY_SUFFIX[varName] !== undefined ? VARIATION_DISPLAY_SUFFIX[varName] : varName;
            const symbol = `${rootName}${suffix}`;
            const parsedNotes = intervals.map((interval) => {
              const details = getNoteNameAndOctave(rootName, interval, useFlats);
              return {
                ...details,
                interval
              };
            });

            const score = Math.round((playedRelIntervals.length / varIntervalsMod12.length) * 100);

            results.push({
              chordSymbol: symbol,
              rootNote: rootName,
              variationStr: varName,
              intervals,
              notes: parsedNotes,
              confidence: score
            });
          }
        }
      }
    }
  }

  return results.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.notes.length - a.notes.length;
  });
}


/**
 * COMPONENTE REUTILIZÁVEL DE TECLADO PIANO (ISOLAMENTO DE ESTADOS)
 * Suporta o Teclado Ativo (Principal) e o Teclado de Preparação (Mini/Superior Direito)
 */
interface PianoKeyboardProps {
  idContainer: string;
  parsedChord: ParsedChord | null;
  variant: 'current' | 'next';
  title: string;
  subtitle?: string;
  badgeText?: string;
  useFlats?: boolean;
  activeMidiNotes?: number[];
  style?: React.CSSProperties;
  numKeys?: number;
  startMidi?: number;
  fullWidth?: boolean;
}

function PianoKeyboard({ 
  idContainer, 
  parsedChord, 
  variant, 
  title, 
  subtitle, 
  badgeText, 
  useFlats = false, 
  activeMidiNotes, 
  style,
  numKeys,
  startMidi,
  fullWidth = false
}: PianoKeyboardProps) {
  const isCurrent = variant === 'current';

  const actualNumKeys = numKeys !== undefined ? numKeys : 28;
  const actualStartMidi = startMidi !== undefined ? startMidi : 48; // Nota C3 padrão

  // Gerar as teclas do piano
  const keys = useMemo(() => {
    const result = [];
    const scale = useFlats ? NOTES_FLAT : NOTES_SHARP;

    for (let i = 0; i < actualNumKeys; i++) {
      const midi = actualStartMidi + i;
      const noteInOctave = midi % 12;
      const noteName = scale[noteInOctave];
      const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
      const octave = Math.floor(midi / 12) - 1;

      let matchedNote = null;
      if (parsedChord) {
        matchedNote = parsedChord.notes.find(cn => cn.midiNote === midi);
      }

      let isPressed = !!matchedNote;
      if (activeMidiNotes && activeMidiNotes.length > 0) {
        if (idContainer === 'midi-live-keyboard') {
          // No teclado MIDI ao vivo, mostramos exatamente a tecla física pressionada pelo usuário, sem duplicatas oitavadas!
          isPressed = activeMidiNotes.includes(midi);
        } else {
          // Nos demais teclados (Guia), permitimos o acendimento inteligente por oitavas caso necessário
          isPressed = activeMidiNotes.includes(midi) || activeMidiNotes.some(mn => (mn % 12) === noteInOctave);
        }
      }

      result.push({
        midi,
        noteName,
        octave,
        isBlack,
        isPressed,
        chordNote: matchedNote
      });
    }
    return result;
  }, [parsedChord, useFlats, activeMidiNotes, actualNumKeys, actualStartMidi, idContainer]);

  return (
    <div 
      id={idContainer}
      style={style}
      className={`transition-all relative overflow-hidden group ${
        fullWidth 
          ? 'w-full rounded-none border-t border-x-0 border-b-0 p-4 sm:p-5 lg:px-8 bg-[#111112]/90 backdrop-blur-md border-zinc-800'
          : `rounded-2xl p-4 sm:p-5 border ${
              isCurrent
                ? 'bg-zinc-900/40 border-accent/40 shadow-[0_0_20px_rgba(0,255,170,0.1)] hover:border-accent/60'
                : 'bg-zinc-900/40 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:border-purple-500/60'
            }`
      }`}
    >
      {/* Luz Ambiente (Glow) */}
      <div className={`absolute w-48 h-48 -top-10 -right-10 rounded-full blur-3xl pointer-events-none ${isCurrent ? 'bg-accent/10' : 'bg-purple-500/10'}`}></div>

      {/* Header do Teclado */}
      <div 
        style={
          idContainer === 'companion-live-keyboard'
            ? { paddingTop: '4px', paddingBottom: '4px', marginTop: '4px', marginBottom: '4px' }
            : undefined
        }
        className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3 gap-2 relative z-10"
      >
        <div 
          className="flex items-center gap-2.5"
          style={idContainer === 'keyboard-dictionary' ? { paddingLeft: '10px', paddingRight: '10px', paddingTop: '2px', paddingBottom: '2px' } : undefined}
        >
          <div className={`p-2 rounded-xl border ${isCurrent ? 'bg-accent/10 text-accent border-accent/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>
            <Keyboard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-100 font-sans flex items-center gap-2">
              {title}
            </h4>
            {subtitle && <p className="text-[10px] text-zinc-400 font-sans">{subtitle}</p>}
          </div>
        </div>

        {badgeText && (
          <span 
            style={
              idContainer === 'companion-live-keyboard' || idContainer === 'midi-live-keyboard'
                ? { paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px', marginLeft: '4px', marginRight: '4px', marginTop: '2px', marginBottom: '2px' }
                : undefined
            }
            className={`text-[10px] font-mono font-bold px-3 py-0.5 rounded-full border shrink-0 ${
              isCurrent
                ? 'bg-accent/10 text-accent border-accent/30 drop-shadow-[0_0_8px_rgba(0,255,170,0.8)]'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/30 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Renderização do Teclado Piano */}
      <div className="relative w-full overflow-x-auto no-scrollbar pb-1 relative z-10">
        <div 
          className={`relative flex w-full ${isCurrent ? 'h-32 sm:h-36 min-w-[520px]' : 'h-22 sm:h-26 min-w-[420px]'} bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 justify-center select-none`}
          style={
            idContainer === 'keyboard-dictionary' 
              ? { height: '150px', width: '812px', paddingLeft: '6px', paddingRight: '6px', paddingTop: '1px', paddingBottom: '6px' }
              : idContainer === 'companion-live-keyboard'
              ? { marginTop: '0px', paddingTop: '2px', paddingBottom: '8px' }
              : idContainer === 'midi-live-keyboard'
              ? { paddingTop: '2px', paddingBottom: '8px', minWidth: '950px' }
              : undefined
          }
        >
          {keys.map((key) => {
            if (key.isBlack) return null;
            const blackKeyAfter = keys.find(k => k.isBlack && k.midi === key.midi + 1);
            const isRoot = key.chordNote?.interval === 0;

            return (
              <div key={key.midi} className="relative flex-1 min-w-[14px] sm:min-w-[18px] max-w-[32px] h-full">
                {/* Tecla Branca */}
                <div
                  className={`w-full h-full rounded-b-xl border transition-all flex flex-col justify-end p-0.5 sm:p-1 items-center ${
                    key.isPressed
                      ? isCurrent
                        ? isRoot
                          ? 'bg-accent border-[#00dc90] text-zinc-950 font-black shadow-[0_6px_16px_rgba(0,255,170,0.8)] z-10 scale-[0.98]'
                          : 'bg-accent/80 border-[#00dc90]/80 text-zinc-950 font-black shadow-[0_6px_16px_rgba(0,255,170,0.8)] z-10 scale-[0.98]'
                        : isRoot
                          ? 'bg-fuchsia-400 border-fuchsia-500 text-zinc-950 font-black shadow-[0_6px_16px_rgba(232,121,249,0.8)] z-10 scale-[0.98]'
                          : 'bg-purple-400 border-purple-500 text-zinc-950 font-black shadow-[0_6px_16px_rgba(192,132,252,0.8)] z-10 scale-[0.98]'
                      : 'bg-zinc-200 border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <span 
                    style={idContainer === 'keyboard-dictionary' ? { marginBottom: '5px', fontSize: '10px' } : undefined}
                    className={`${isCurrent ? 'text-[8px] sm:text-[9px]' : 'text-[7px]'} font-mono font-bold leading-none`}
                  >
                    {key.noteName}
                  </span>
                </div>

                {/* Tecla Preta */}
                {blackKeyAfter && (
                  <div
                    className={`absolute top-0 -right-[40%] w-[80%] h-[60%] z-20 rounded-b-lg border transition-all flex flex-col justify-end p-0.5 items-center ${
                      blackKeyAfter.isPressed
                        ? isCurrent
                          ? blackKeyAfter.chordNote?.interval === 0
                            ? 'bg-accent border-[#00dc90] text-zinc-950 font-black shadow-[0_4px_12px_rgba(0,255,170,0.8)]'
                            : 'bg-accent/80 border-[#00dc90]/80 text-zinc-950 font-black shadow-[0_4px_12px_rgba(0,255,170,0.8)]'
                          : blackKeyAfter.chordNote?.interval === 0
                            ? 'bg-fuchsia-400 border-fuchsia-500 text-zinc-950 font-black shadow-[0_4px_12px_rgba(232,121,249,0.8)]'
                            : 'bg-purple-400 border-purple-500 text-zinc-950 font-black shadow-[0_6px_16px_rgba(192,132,252,0.8)]'
                        : 'bg-zinc-900 border-zinc-950 text-zinc-400'
                    }`}
                  >
                    <span 
                      style={idContainer === 'keyboard-dictionary' ? { marginBottom: '5px', fontSize: '8px' } : undefined}
                      className={`${isCurrent ? 'text-[7px]' : 'text-[6px]'} font-mono leading-none`}
                    >
                      {blackKeyAfter.noteName}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda de Cores */}
      <div className="flex items-center justify-between text-[10px] font-sans text-zinc-400 pt-1 relative z-10">
        <span 
          className="flex items-center gap-1.5"
          style={idContainer === 'keyboard-dictionary' ? { paddingLeft: '10px', paddingRight: '10px', paddingTop: '2px', paddingBottom: '2px' } : undefined}
        >
          <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-accent' : 'bg-fuchsia-400'}`}></span>
          Tônica
        </span>
        <span 
          className="flex items-center gap-1.5"
          style={idContainer === 'keyboard-dictionary' ? { paddingLeft: '10px', paddingRight: '10px', paddingTop: '2px', paddingBottom: '2px' } : undefined}
        >
          <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-accent/80' : 'bg-purple-400'}`}></span>
          Notas
        </span>
        <span 
          className={`font-mono font-bold ${isCurrent ? 'text-accent drop-shadow-[0_0_8px_rgba(0,255,170,0.8)]' : 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'}`}
          style={idContainer === 'keyboard-dictionary' ? { paddingLeft: '10px', paddingRight: '10px', paddingTop: '2px', paddingBottom: '2px' } : undefined}
        >
          {parsedChord ? parsedChord.cifraOriginal : 'Aguardando...'}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  // Controle de Abas: 'companion' (Chords PDF Companion) | 'midi' (Conexão MIDI & Detecção) | 'dictionary' (Dicionário)
  const [activeTab, setActiveTab] = useState<'companion' | 'midi' | 'dictionary'>('companion');

  // --- MODO COMPANION / MAPEADOR DE ACORDES & DETECÇÃO ---
  const [companionText, setCompanionText] = useState<string>('C9 D G Em7 C G Am F');
  const [companionChords, setCompanionChords] = useState<string[]>(['C9', 'D', 'G', 'Em7', 'C', 'G', 'Am', 'F']);
  const [companionIndex, setCompanionIndex] = useState<number>(0);
  const [companionUniqueOnly, setCompanionUniqueOnly] = useState<boolean>(false);
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [pdfParseError, setPdfParseError] = useState<string | null>(null);
  const [showChordInputText, setShowChordInputText] = useState<boolean>(false);



  // --- MODO CONEXÃO MIDI & DETECÇÃO EM TEMPO REAL ---
  const [midiAccess, setMidiAccess] = useState<any>(null);
  const [midiInputs, setMidiInputs] = useState<any[]>([]);
  const [selectedMidiInputId, setSelectedMidiInputId] = useState<string>('');
  const [midiNotesPressed, setMidiNotesPressed] = useState<number[]>([]);
  const [midiGuideRoot, setMidiGuideRoot] = useState<string>('C');
  const [midiGuideVariation, setMidiGuideVariation] = useState<VariationName>('Maior');

  // Inicializa o acesso à API MIDI do navegador
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      navigator.requestMIDIAccess()
        .then((access: any) => {
          setMidiAccess(access);
          const inputs = Array.from(access.inputs.values());
          setMidiInputs(inputs);
          if (inputs.length > 0) {
            setSelectedMidiInputId((inputs[0] as any).id);
          }
          access.onstatechange = () => {
            setMidiInputs(Array.from(access.inputs.values()));
          };
        })
        .catch((err) => {
          console.warn('API MIDI não suportada ou acesso recusado:', err);
        });
    }
  }, []);

  // Escuta os eventos do teclado MIDI selecionado
  useEffect(() => {
    if (!midiAccess || !selectedMidiInputId) return;
    const input = midiAccess.inputs.get(selectedMidiInputId);
    if (!input) return;

    const handleMidiMessage = (message: any) => {
      const [status, note, velocity] = message.data;
      const command = status & 0xf0;

      if (command === 0x90 && velocity > 0) {
        // Nota pressionada (Note On)
        setMidiNotesPressed((prev) => {
          if (prev.includes(note)) return prev;
          return [...prev, note].sort((a, b) => a - b);
        });
      } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        // Nota solta (Note Off)
        setMidiNotesPressed((prev) => prev.filter((n) => n !== note));
      }
    };

    input.onmidimessage = handleMidiMessage;
    return () => {
      input.onmidimessage = null;
    };
  }, [midiAccess, selectedMidiInputId]);

  // --- DICIONÁRIO DE ACORDES E FILTROS ---
  const [selectedRoot, setSelectedRoot] = useState<RootNote>('C');
  const [selectedVariation, setSelectedVariation] = useState<VariationName>('Maior');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todas');
  const [qualityFilter, setQualityFilter] = useState<'Todos' | 'Maior' | 'Menor'>('Todos');
  const [rootGroupFilter, setRootGroupFilter] = useState<'Todas' | 'Naturais' | 'Acidentes'>('Todas');
  const [inversion, setInversion] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPlayingSynth, setIsPlayingSynth] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- SISTEMA DE NOTIFICAÇÃO TOAST & INSIGHTS IA ---
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const handlePlayChordSynthFromSymbol = (symbol: string) => {
    const parsed = parseChordSymbolToNotes(symbol);
    if (parsed && parsed.notes) {
      playChordSynth(parsed.notes);
    }
  };

  // --- ARRASTE E SOLTE E LEITURA DE PDF (PDF DE CIFRAS) ---
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        await processPdfFile(file);
      } else {
        setPdfParseError("Erro: Apenas arquivos PDF são suportados.");
      }
    }
  };

  const processPdfFile = async (file: File) => {
    setIsParsingPdf(true);
    setPdfParseError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const resultBuffer = e.target?.result;
          if (!resultBuffer) {
            throw new Error("Não foi possível carregar o buffer do arquivo.");
          }
          const typedarray = new Uint8Array(resultBuffer as ArrayBuffer);

          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            throw new Error("Aguarde o carregamento do leitor de PDF do navegador. Se persistir, recarregue a página.");
          }

          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;

          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }

          // Regex para detectar padrões de acorde (C, G9, Am, F#m7(b5), Bb/D, etc.)
          const chordRegex = /\b[A-G][b#]?(?:maj|min|aug|dim|sus|add|m|M)?\d*(?:\([^)]*\))?(?:\/[A-G][b#]?)?\b/g;
          const foundChords = fullText.match(chordRegex);

          if (foundChords && foundChords.length > 0) {
            const cleanedChords = foundChords.map(c => c.trim()).filter(c => {
              if (c.length === 1) {
                return ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(c);
              }
              // Ignorar ruídos textuais comuns do PDF
              if (['PDF', 'OK', 'NP', 'X', 'Y', 'TM', 'CO', 'ST', 'CH'].includes(c.toUpperCase())) {
                return false;
              }
              return true;
            });

            if (cleanedChords.length > 0) {
              setCompanionText(cleanedChords.join(' '));
              setCompanionIndex(0);
            } else {
              throw new Error("Nenhum acorde detectado no PDF. Certifique-se de carregar um PDF de cifra válido.");
            }
          } else {
            throw new Error("Não foi possível encontrar nenhum acorde na análise de texto do PDF.");
          }
        } catch (err: any) {
          console.error("Erro interno no PDF.js:", err);
          setPdfParseError(err.message || "Falha ao extrair cifras do PDF.");
        } finally {
          setIsParsingPdf(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error("Erro ao carregar arquivo PDF:", err);
      setPdfParseError("Erro ao carregar o arquivo.");
      setIsParsingPdf(false);
    }
  };

  // --- PROCESSAMENTO E LOGICA DO MODO COMPANION ---

  // Regex para achar acordes no texto digitado (ex: C, C#m7, G/B, D9, Bb, etc.)
  useEffect(() => {
    const chordRegex = /\b[A-G][b#]?(?:maj|min|aug|dim|sus|add|m|M)?\d*(?:\([^)]*\))?(?:\/[A-G][b#]?)?\b/g;
    const matches = companionText.match(chordRegex);
    if (matches && matches.length > 0) {
      setCompanionChords(matches);
      setCompanionIndex((prev) => Math.min(prev, matches.length - 1));
    } else {
      const words = companionText.split(/\s+/).filter(w => w.trim().length > 0);
      if (words.length > 0) {
        setCompanionChords(words);
        setCompanionIndex((prev) => Math.min(prev, words.length - 1));
      } else {
        setCompanionChords([]);
        setCompanionIndex(0);
      }
    }
  }, [companionText]);

  // Filtro de Acordes Únicos (Modo Compacto / Limpar Repetidos)
  const companionDisplayedChords = useMemo(() => {
    if (companionUniqueOnly) {
      const unique: string[] = [];
      companionChords.forEach(c => {
        if (!unique.includes(c)) {
          unique.push(c);
        }
      });
      return unique;
    }
    return companionChords;
  }, [companionChords, companionUniqueOnly]);

  // Garante que o índice não extrapola o limite dos acordes exibidos
  useEffect(() => {
    setCompanionIndex((prev) => Math.min(prev, Math.max(0, companionDisplayedChords.length - 1)));
  }, [companionUniqueOnly, companionDisplayedChords.length]);

  const companionActiveChordSymbol = useMemo(() => {
    if (companionDisplayedChords.length > 0 && companionIndex >= 0 && companionIndex < companionDisplayedChords.length) {
      return companionDisplayedChords[companionIndex];
    }
    return '';
  }, [companionDisplayedChords, companionIndex]);

  const companionActiveChordParsed = useMemo(() => {
    if (companionActiveChordSymbol) {
      return parseChordSymbolToNotes(companionActiveChordSymbol);
    }
    return null;
  }, [companionActiveChordSymbol]);

  // Verificação de sincronização MIDI (Se o que o usuário toca no teclado bate com o acorde atual)
  const isChordMatched = useMemo(() => {
    if (!companionActiveChordParsed || midiNotesPressed.length === 0) return false;
    
    // Pitch classes do acorde alvo (0 a 11)
    const requiredPitchClasses = companionActiveChordParsed.notes.map(n => n.midiNote % 12);
    // Pitch classes tocados pelo usuário
    const playedPitchClasses = midiNotesPressed.map(n => n % 12);
    
    if (requiredPitchClasses.length === 0) return false;
    
    // Retorna true se todos os pitch classes exigidos estiverem presentes entre os tocados
    return requiredPitchClasses.every(pc => playedPitchClasses.includes(pc));
  }, [companionActiveChordParsed, midiNotesPressed]);

  // Atalhos de teclado para o Companion (Setas, PageDown/PageUp para pedais, etc.)
  useEffect(() => {
    if (activeTab !== 'companion') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o foco estiver em um input ou textarea para que o usuário consiga digitar
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCompanionIndex((prev) => (prev + 1) % Math.max(1, companionDisplayedChords.length));
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCompanionIndex((prev) => (prev - 1 + companionDisplayedChords.length) % Math.max(1, companionDisplayedChords.length));
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, companionDisplayedChords.length]);

  // --- DICIONÁRIO DE ACORDES ---



  // CÁLCULOS E FILTROS DO DICIONÁRIO DE ACORDES
  const filteredRootNotes = useMemo(() => {
    if (rootGroupFilter === 'Naturais') return ROOT_NATURAL_NOTES;
    if (rootGroupFilter === 'Acidentes') return ROOT_ACCIDENTAL_NOTES;
    return ALL_ROOT_NOTES;
  }, [rootGroupFilter]);

  const variations = chordsData.variacoes as Record<VariationName, number[]>;
  const variationKeys = Object.keys(variations) as VariationName[];

  const getChordQuality = (varName: VariationName): 'Maior' | 'Menor' | 'Outro' => {
    const intervals = variations[varName] || [];
    if (intervals.includes(3)) return 'Menor';
    if (intervals.includes(4)) return 'Maior';
    return 'Outro';
  };

  const filteredVariations = useMemo(() => {
    return variationKeys.filter(varName => {
      // Filtro de Modo (Maior / Menor)
      if (qualityFilter !== 'Todos') {
        const quality = getChordQuality(varName);
        if (qualityFilter === 'Maior' && quality !== 'Maior') return false;
        if (qualityFilter === 'Menor' && quality !== 'Menor') return false;
      }
      // Filtro de Categoria
      if (selectedCategoryFilter !== 'Todas') {
        const catList = CHORD_CATEGORIES[selectedCategoryFilter] || [];
        if (!catList.includes(varName)) return false;
      }
      // Filtro de Busca
      if (searchQuery.trim()) {
        const fullChord = `${selectedRoot}${varName}`.toLowerCase();
        const theoreticalName = (THEORETICAL_NAMES[varName] || '').toLowerCase();
        const search = searchQuery.toLowerCase();
        return varName.toLowerCase().includes(search) || fullChord.includes(search) || theoreticalName.includes(search);
      }
      return true;
    });
  }, [variationKeys, selectedCategoryFilter, searchQuery, selectedRoot, qualityFilter]);

  // Se a variação selecionada não estiver na lista filtrada, ajusta automaticamente
  useEffect(() => {
    if (filteredVariations.length > 0 && !filteredVariations.includes(selectedVariation)) {
      setSelectedVariation(filteredVariations[0]);
    }
  }, [filteredVariations, selectedVariation]);

  const useFlats = useMemo(() => ['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(selectedRoot), [selectedRoot]);
  const currentIntervals = variations[selectedVariation] || [0, 4, 7];

  const invertedIntervals = useMemo(() => {
    if (inversion === 0) return currentIntervals;
    const count = currentIntervals.length;
    const invIndex = inversion % count;
    return currentIntervals.map((interval, idx) => (idx < invIndex ? interval + 12 : interval));
  }, [currentIntervals, inversion]);

  const chordNotes = useMemo(() => {
    return invertedIntervals.map((interval, idx) => {
      const origInterval = currentIntervals[idx % currentIntervals.length];
      const details = getNoteNameAndOctave(selectedRoot, interval, useFlats);
      return {
        ...details,
        interval: origInterval,
        label: INTERVAL_LABELS[origInterval] || `+${origInterval}st`
      };
    });
  }, [invertedIntervals, currentIntervals, selectedRoot, useFlats]);

  const dictionaryParsedChord: ParsedChord = useMemo(() => {
    return {
      cifraOriginal: `${selectedRoot}${selectedVariation}`,
      rootNote: selectedRoot,
      variationStr: selectedVariation,
      bassNote: null,
      intervals: currentIntervals,
      notes: chordNotes
    };
  }, [selectedRoot, selectedVariation, currentIntervals, chordNotes]);

  // Sintetizador Web Audio API para tocar o acorde
  const playChordSynth = (notesToPlay: Array<{ frequency: number }>) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      setIsPlayingSynth(true);
      const now = ctx.currentTime;

      notesToPlay.forEach((note, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.frequency, now);

        const startTime = now + index * 0.04;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2 / notesToPlay.length, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.2);
      });

      setTimeout(() => setIsPlayingSynth(false), 1200);
    } catch (e) {
      console.error('Erro no sintetizador', e);
      setIsPlayingSynth(false);
    }
  };

  // --- CÁLCULOS DA ABA MIDI ---
  const detectedChords = useMemo(() => {
    return detectChordsFromMidi(midiNotesPressed);
  }, [midiNotesPressed]);

  const derivedMidiRoot = useMemo(() => {
    if (detectedChords.length > 0) {
      return detectedChords[0].rootNote;
    }
    return midiGuideRoot;
  }, [detectedChords, midiGuideRoot]);

  const guideParsedChord = useMemo(() => {
    const suffix = midiGuideVariation === 'Maior' ? '' : midiGuideVariation;
    return parseChordSymbolToNotes(`${derivedMidiRoot}${suffix}`);
  }, [derivedMidiRoot, midiGuideVariation]);

  return (
    <div 
      className="min-h-screen bg-[#0d0d0e] text-[#e0e0e0] flex flex-col font-sans overflow-x-hidden selection:bg-accent selection:text-zinc-950"
    >
      
      {/* Top Header */}
      <header className="min-h-[4rem] sm:h-16 py-3 sm:py-0 border-b-2 border-white/10 bg-[#0d0d0e] sticky top-0 z-50 flex items-center justify-center px-4 sm:px-8">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#161617] border border-white/15 text-accent flex items-center justify-center font-mono rounded-lg">
              <Music className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-widest text-accent font-display uppercase">
                CHORDTRAIL
              </h1>
              <span className="text-[9px] text-zinc-600 font-mono">v0.2.1</span>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2">
            
            <button
              onClick={() => setActiveTab('companion')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-[13px] font-bold uppercase tracking-wider transition-all border rounded-lg flex items-center gap-1.5 sm:gap-2 cursor-pointer relative group ${
                activeTab === 'companion'
                  ? 'bg-accent text-zinc-950 border-accent font-extrabold shadow-[0_0_12px_rgba(0,255,170,0.25)]'
                  : 'bg-[#161617] text-[#e0e0e0] border-white/10 hover:border-white/20'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>
                <span className="hidden sm:inline">Esteira de Acordes</span>
                <span className="sm:hidden">Esteira</span> | MIDI
              </span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-zinc-950 border border-white/10 rounded-lg text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl font-mono normal-case tracking-normal">
                Workspace integrado de acordes, PDF e inputs de microfone/MIDI
              </div>
            </button>

            <button
              onClick={() => setActiveTab('dictionary')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-[13px] font-bold uppercase tracking-wider transition-all border rounded-lg flex items-center gap-1.5 sm:gap-2 cursor-pointer relative group ${
                activeTab === 'dictionary'
                  ? 'bg-accent text-zinc-950 border-accent font-extrabold shadow-[0_0_12px_rgba(0,255,170,0.25)]'
                  : 'bg-[#161617] text-[#e0e0e0] border-white/10 hover:border-white/20'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>Dicionário</span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-zinc-950 border border-white/10 rounded-lg text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl font-mono normal-case tracking-normal">
                Dicionário completo de acordes, fórmulas e inversões
              </div>
            </button>
          </div>


        </div>
      </header>

      {/* --- ABA 1: UNIFIED WORKSPACE (PDF COMPANION + MIDI CONNECTION) --- */}
      {activeTab === 'companion' && (
        <div className="flex-1 w-full flex flex-col overflow-y-auto bg-[#0d0d0e] min-h-0">
          <main 
            style={{ marginLeft: '-5px' }}
            className="w-full max-w-[1295px] mx-auto p-4 sm:p-6 pb-2 grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0"
          >
            <div 
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full col-span-12"
            >
            
            {/* COLUNA ESQUERDA (7 cols): Esteira de Acordes, PDF de Cifras, Teclados e Feedbacks */}
            <div 
              className="lg:col-span-7 space-y-6 animate-fade-in w-full"
            >
              
              {/* PDF Uploader & Chords Conveyor */}
              <PdfUploader
                companionText={companionText}
                setCompanionText={setCompanionText}
                companionIndex={companionIndex}
                setCompanionIndex={setCompanionIndex}
                companionChords={companionChords}
                companionDisplayedChords={companionDisplayedChords}
                companionUniqueOnly={companionUniqueOnly}
                setCompanionUniqueOnly={setCompanionUniqueOnly}
                showChordInputText={showChordInputText}
                setShowChordInputText={setShowChordInputText}
                playChordSynth={playChordSynth}
                companionActiveChordParsed={companionActiveChordParsed}
              />

              {/* Teclado Guia (Como Devo Tocar) */}
              {companionActiveChordParsed ? (
                <PianoKeyboard
                  idContainer="companion-live-keyboard"
                  parsedChord={companionActiveChordParsed}
                  variant="current"
                  title={`Acorde Alvo: ${companionActiveChordSymbol}`}
                  subtitle={`Posicionamento correto das notas e intervalos de ${companionActiveChordSymbol}`}
                  badgeText="GUIA DE REFERÊNCIA"
                  useFlats={['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(companionActiveChordParsed.rootNote)}
                  style={{ paddingTop: '12px', paddingBottom: '12px', marginTop: '12px', marginBottom: '12px', paddingLeft: '12px', paddingRight: '12px' }}
                />
              ) : (
                <div className="p-8 bg-[#161617] border border-white/5 rounded-xl text-center font-mono text-zinc-500 text-xs">
                  Nenhum acorde ativo para visualização no Teclado Guia.
                </div>
              )}

              {/* Sincronia & Real-time Live MIDI Feedback Banner */}
              <SyncFeedbackBanner
                isChordMatched={isChordMatched}
                midiNotesPressed={midiNotesPressed}
                activeChordSymbol={companionActiveChordSymbol || 'Sem Acorde'}
                style={{ marginTop: '10px', marginBottom: '10px', paddingTop: '8px', paddingBottom: '8px', paddingRight: '18px', paddingLeft: '18px' }}
              />

            </div>

            {/* COLUNA DIREITA (5 cols): Painel de Dispositivos Hardware & Variações Harmônicas */}
            <div className="lg:col-span-5 space-y-6 animate-fade-in">
              
              {/* Painel de Entrada de Hardware (MIDI) */}
              <UnifiedInputPanel
                midiAccess={midiAccess}
                midiInputs={midiInputs}
                selectedMidiInputId={selectedMidiInputId}
                setSelectedMidiInputId={setSelectedMidiInputId}
                midiNotesPressed={midiNotesPressed}
                detectedChords={detectedChords}
                handlePlayChordSynthFromSymbol={handlePlayChordSynthFromSymbol}
              />

              {/* Explorador de Variações Harmônicas */}
              <div className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-xl p-5 sm:p-6 space-y-5 relative overflow-hidden group shadow-sm">
                <div className="absolute w-48 h-48 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="border-b border-zinc-800 pb-4 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div 
                    style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px' }}
                    className="flex items-center gap-3"
                  >
                    <div className="p-2 bg-[#0d0d0e] text-accent border border-accent/20 rounded-xl">
                      <Sparkles className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
                        Variações da Tônica // {midiGuideRoot}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 font-mono uppercase tracking-wide">
                        Variações sugeridas para a nota tônica atual
                      </p>
                    </div>
                  </div>

                  {/* Manual selector override */}
                  <div 
                    style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px', marginLeft: '4px', marginRight: '4px', marginTop: '2px', marginBottom: '2px' }}
                    className="flex items-center gap-1 bg-[#0d0d0e] border border-white/10 rounded-lg p-1 overflow-x-auto max-w-full"
                  >
                    {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMidiGuideRoot(r)}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs font-mono font-extrabold border transition-all shrink-0 cursor-pointer ${
                          midiGuideRoot === r
                            ? 'bg-accent border-accent text-zinc-950 font-black'
                            : 'bg-[#161617] text-zinc-400 border-transparent hover:text-zinc-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid de Variações */}
                <div className="space-y-3 relative z-10">
                  <span 
                    style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', marginLeft: '0px', marginTop: '2px', marginBottom: '2px' }}
                    className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono block"
                  >
                    Abra uma variação de {midiGuideRoot} no Teclado Guia ou escute seu som:
                  </span>
                  
                  <div 
                    style={{ paddingLeft: '6px', paddingRight: '6px', paddingBottom: '8px', paddingTop: '8px', marginLeft: '4px', marginRight: '4px', marginTop: '2px', marginBottom: '2px' }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    {Object.keys(chordsData.variacoes).slice(0, 12).map((varKey, idx) => {
                      const suffix = VARIATION_DISPLAY_SUFFIX[varKey] !== undefined ? VARIATION_DISPLAY_SUFFIX[varKey] : varKey;
                      const variationSymbol = `${midiGuideRoot}${suffix}`;
                      const isCurrentlyActive = companionActiveChordSymbol === variationSymbol;

                      return (
                        <div
                          key={varKey}
                          className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                            isCurrentlyActive
                              ? 'bg-accent/10 border-accent text-accent shadow-[0_0_8px_rgba(0,255,170,0.1)]'
                              : 'bg-[#0d0d0e] border-white/5 text-zinc-400 hover:border-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-bold font-mono tracking-wider truncate" title={variationSymbol}>{variationSymbol}</span>
                            <button
                              onClick={() => handlePlayChordSynthFromSymbol(variationSymbol)}
                              className="p-1 rounded-lg bg-[#161617] border border-white/5 text-zinc-400 hover:text-accent hover:border-accent/40 transition-colors cursor-pointer shrink-0"
                              title="Ouvir"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => {
                              setCompanionText(variationSymbol);
                            }}
                            className="w-full text-[9px] font-mono py-1 rounded bg-[#161617] hover:bg-accent hover:text-zinc-950 hover:font-bold transition-all border border-transparent hover:border-accent text-zinc-500 text-center uppercase cursor-pointer"
                          >
                            Ver no Piano
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </main>

        {/* TECLADO MIDI AO VIVO (LARGURA TOTALMENTE COMPLETA DA TELA, SEM DIVS DE CONTENÇÃO QUE RESTRINGEM A LARGURA) */}
        <div className="w-full animate-fade-in mt-auto shrink-0">
          <PianoKeyboard
            idContainer="midi-live-keyboard"
            parsedChord={null}
            variant="current"
            title="Teclado MIDI ao Vivo (61 Teclas)"
            subtitle="Notas acendem em tempo real ao pressionar as teclas do teclado controlador USB (C1 a C7)"
            badgeText={midiNotesPressed.length > 0 ? `${midiNotesPressed.length} TECLAS ATIVAS` : 'CONTROLADOR OFFLINE'}
            activeMidiNotes={midiNotesPressed}
            useFlats={['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(companionActiveChordParsed?.rootNote || 'C')}
            numKeys={61}
            startMidi={36}
            fullWidth={true}
            style={{ width: '100%', margin: 0 }}
          />
        </div>
      </div>
    )}

      {/* --- ABA DE REPRODUÇÃO VELHA DESATIVADA --- */}
      {false && (
        <main 
          className="flex-1 w-full max-w-[1295px] mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto"
        >
          {/* COMPANION LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
            <>
              {/* COLUNA ESQUERDA (7 cols): Esteira de Acordes e Piano Visual */}
              <section className="lg:col-span-7 space-y-6 animate-fade-in">
                
                {/* Card do Mapeador de Cifras */}
                <div className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-xl p-5 sm:p-6 space-y-5 relative overflow-hidden group shadow-sm">
                  <div className="absolute w-48 h-48 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#0d0d0e] text-accent border border-accent/20 rounded-xl">
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
                          Esteira de Acordes
                        </h3>
                        <p className="text-[10px] sm:text-xs text-zinc-500 font-mono uppercase tracking-wide">
                          Digite sua sequência de cifras para projetá-las instantaneamente no teclado
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-wider font-mono">
                        Cifras da música (Digite ou cole)
                      </label>
                      <textarea
                        value={companionText}
                        onChange={(e) => setCompanionText(e.target.value)}
                        rows={2}
                        placeholder="Cole aqui os acordes (ex: C9 D G Em7)..."
                        className="w-full bg-[#0d0d0e] border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-accent font-mono focus:outline-none focus:border-accent transition-all resize-none placeholder:text-zinc-700 min-h-[64px]"
                      />
                    </div>

                    {/* Esteira horizontal de acordes */}
                    <div className="space-y-2">
                      <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
                        Visualizador de Acordes (Navegue com cliques ou teclas de Seta ◄ ►)
                      </span>
                      
                      {companionChords.length === 0 ? (
                        <div className="py-4 text-center text-zinc-600 font-mono text-xs border border-dashed border-zinc-800 rounded-xl">
                          NENHUM ACORDE DETECTADO NO TEXTO
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                          {companionChords.map((chord, idx) => {
                            const isSelected = companionIndex === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setCompanionIndex(idx)}
                                className={`px-4 py-3 text-center rounded-xl border transition-all shrink-0 min-w-[70px] flex flex-col justify-center items-center ${
                                  isSelected
                                    ? 'bg-accent/15 border-accent text-accent shadow-[0_0_12px_rgba(0,255,170,0.18)] font-black scale-105'
                                    : 'bg-[#0d0d0e] border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-100'
                                }`}
                              >
                                <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                                <span className="text-base font-bold tracking-wide mt-0.5">{chord}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Controles de navegação grandes para mobile */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <button
                        onClick={() => setCompanionIndex((prev) => (prev - 1 + companionChords.length) % Math.max(1, companionChords.length))}
                        disabled={companionChords.length <= 1}
                        className="flex-1 py-3.5 px-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ◀ Anterior
                      </button>
                      
                      <button
                        onClick={() => playChordSynth(companionActiveChordParsed?.notes || [])}
                        disabled={!companionActiveChordParsed}
                        className="px-4 py-3.5 rounded-xl bg-[#0d0d0e] border border-white/10 hover:border-accent/40 text-accent transition-all flex items-center justify-center min-h-[44px] disabled:opacity-40"
                        title="Ouvir som do acorde selecionado"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => setCompanionIndex((prev) => (prev + 1) % Math.max(1, companionChords.length))}
                        disabled={companionChords.length <= 1}
                        className="flex-1 py-3.5 px-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Próximo ▶
                      </button>
                    </div>

                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide text-center pt-1">
                      💡 Dica: Sente-se confortavelmente e use as setas do teclado ◄ e ► do PC para avançar/retroceder!
                    </p>
                  </div>

                </div>

                {/* Teclado Guia Principal */}
                {companionActiveChordParsed ? (
                  <PianoKeyboard
                    idContainer="companion-live-keyboard"
                    parsedChord={companionActiveChordParsed}
                    variant="current"
                    title={`Acorde Ativo: ${companionActiveChordSymbol}`}
                    subtitle={`Posicionamento das notas e estrutura harmônica para ${companionActiveChordSymbol}`}
                    badgeText="GUIA VISUAL"
                    useFlats={['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(companionActiveChordParsed.rootNote)}
                  />
                ) : (
                  <div className="bg-[#161617] border-2 border-white/10 rounded-xl p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto bg-zinc-900/60 animate-pulse">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-zinc-400 uppercase font-mono tracking-wider">
                        Aguardando Acorde Selecionado...
                      </p>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        Insira acordes válidos na caixa acima e selecione um para carregar o mapa de teclas.
                      </p>
                    </div>
                  </div>
                )}

              </section>

              {/* COLUNA DIREITA (5 cols): Sugestões Harmônicas */}
              <section className="lg:col-span-5 space-y-6">

                {/* Explorador de Variações Harmônicas do Acorde */}
                <div className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-xl p-5 sm:p-6 space-y-5 relative overflow-hidden group shadow-sm">
                  <div className="absolute w-48 h-48 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="border-b border-zinc-800 pb-4 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#0d0d0e] text-accent border border-accent/20 rounded-xl">
                        <Sparkles className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
                          Variações da Tônica // {midiGuideRoot}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-zinc-500 font-mono uppercase tracking-wide">
                          Variações sugeridas para a nota tônica atual
                        </p>
                      </div>
                    </div>

                    {/* Manual selector override */}
                    <div className="flex items-center gap-1 bg-[#0d0d0e] border border-white/10 rounded-lg p-1 overflow-x-auto max-w-full">
                      {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((r) => (
                        <button
                          key={r}
                          onClick={() => setMidiGuideRoot(r)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-xs font-mono font-extrabold border transition-all shrink-0 ${
                            midiGuideRoot === r
                              ? 'bg-accent border-accent text-zinc-950 font-black'
                              : 'bg-[#161617] text-zinc-400 border-transparent hover:text-zinc-100'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid de Variações */}
                  <div className="space-y-3 relative z-10">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono block">
                      Abra uma variação de {midiGuideRoot} no Teclado Guia ou escute seu som:
                    </span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.keys(chordsData.variacoes).slice(0, 12).map((varKey) => {
                        const suffix = VARIATION_DISPLAY_SUFFIX[varKey] !== undefined ? VARIATION_DISPLAY_SUFFIX[varKey] : varKey;
                        const variationSymbol = `${midiGuideRoot}${suffix}`;
                        const isCurrentlyActive = companionActiveChordSymbol === variationSymbol;
                        return (
                          <div
                            key={varKey}
                            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                              isCurrentlyActive
                                ? 'bg-accent/10 border-accent text-accent shadow-[0_0_8px_rgba(0,255,170,0.1)]'
                                : 'bg-[#0d0d0e] border-white/5 text-zinc-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-bold font-mono tracking-wider">{variationSymbol}</span>
                              <button
                                onClick={() => handlePlayChordSynthFromSymbol(variationSymbol)}
                                className="p-1 rounded-lg bg-[#161617] border border-white/5 text-zinc-400 hover:text-accent hover:border-accent/40 transition-colors"
                                title="Ouvir"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => {
                                setCompanionText(variationSymbol);
                              }}
                              className="w-full text-[9px] font-mono py-1 rounded bg-[#161617] hover:bg-accent hover:text-zinc-950 hover:font-bold transition-all border border-transparent hover:border-accent text-zinc-500 text-center uppercase"
                            >
                              Ver no Piano
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </section>
            </>
          </div>
        </main>
      )}

      {/* --- ABA 2: TECLADO MIDI & DETECÇÃO EM TEMPO REAL --- */}
      {activeTab === 'midi' && (
        <main 
          className="flex-1 w-full max-w-[1295px] mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUNA ESQUERDA (7 cols): Teclado ao Vivo, Dispositivos e Detecção */}
            <section className="lg:col-span-7 space-y-6">
              
              {/* Card de Conexão MIDI */}
              <div className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-xl p-5 sm:p-6 space-y-5 relative overflow-hidden group shadow-sm">
                <div className="absolute w-48 h-48 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0d0d0e] text-accent border border-accent/20 rounded-xl">
                      <Keyboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
                        Hardware Teclado MIDI // Entrada
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 font-mono uppercase tracking-wide">
                        Conecte seu teclado controlador físico para mapear acordes
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase shrink-0">
                    {midiInputs.length > 0 ? (
                      <span className="flex items-center gap-1.5 text-accent font-bold bg-accent/10 border border-accent/30 px-3 py-1 rounded-full drop-shadow-[0_0_8px_rgba(0,255,170,0.3)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                        Disponível
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-zinc-500 font-bold bg-zinc-900 border border-white/5 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                        Aguardando
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Verificação se a API MIDI é suportada no navegador */}
                  {typeof navigator !== 'undefined' && !('requestMIDIAccess' in navigator) ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs space-y-1.5 font-sans">
                      <p className="font-bold flex items-center gap-2 uppercase font-mono tracking-wider">
                        ⚠️ Navegador Incompatível
                      </p>
                      <p className="leading-relaxed">
                        Seu navegador atual não suporta a API de MIDI Web. Recomendamos usar o <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong> ou <strong>Opera</strong> para aproveitar essa funcionalidade.
                      </p>
                    </div>
                  ) : midiInputs.length === 0 ? (
                    <div className="p-4 bg-zinc-900 border border-white/5 text-zinc-400 rounded-xl text-xs space-y-1.5 font-sans">
                      <p className="font-bold uppercase font-mono tracking-wider text-zinc-300 flex items-center gap-2">
                        🔌 Nenhum dispositivo MIDI detectado
                      </p>
                      <p className="leading-relaxed">
                        Conecte seu teclado controlador físico no computador ou tablet usando um cabo MIDI/USB e certifique-se de que ele esteja ligado. O navegador irá reconhecê-lo automaticamente!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-wider font-mono">
                          Dispositivo MIDI Ativo
                        </label>
                        <select
                          value={selectedMidiInputId}
                          onChange={(e) => setSelectedMidiInputId(e.target.value)}
                          className="w-full bg-[#0d0d0e] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 font-mono focus:outline-none focus:border-accent transition-all cursor-pointer min-h-[44px]"
                        >
                          {midiInputs.map((input) => (
                            <option key={input.id} value={input.id} className="bg-[#161617]">
                              {input.name || `Controlador MIDI (${input.id})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-wider font-mono">
                          Notas Pressionadas Fisicas
                        </label>
                        <div className="w-full bg-[#0d0d0e] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-accent font-mono min-h-[44px] flex items-center gap-1.5 flex-wrap">
                          {midiNotesPressed.length === 0 ? (
                            <span className="text-zinc-600 uppercase">Nenhuma tecla tocada</span>
                          ) : (
                            midiNotesPressed.map((midiNote) => {
                              const pitchClass = midiNote % 12;
                              const noteName = NOTES_SHARP[pitchClass];
                              const octave = Math.floor(midiNote / 12) - 1;
                              return (
                                <span key={midiNote} className="bg-accent/15 border border-accent/30 text-accent font-bold px-2 py-0.5 rounded text-xs font-mono drop-shadow-[0_0_5px_rgba(0,255,170,0.1)]">
                                  {noteName}{octave}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Teclado MIDI ao Vivo */}
              <PianoKeyboard
                idContainer="midi-live-keyboard"
                parsedChord={null}
                variant="current"
                title="Teclado MIDI ao Vivo"
                subtitle="Notas acendem em tempo real ao pressionar o teclado físico"
                badgeText={midiNotesPressed.length > 0 ? `${midiNotesPressed.length} NOTAS` : 'OFFLINE'}
                activeMidiNotes={midiNotesPressed}
                useFlats={['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(derivedMidiRoot)}
              />

              {/* Acordes Detectados */}
              <div className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-xl p-5 sm:p-6 space-y-5 relative overflow-hidden group shadow-sm">
                <div className="absolute w-48 h-48 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0d0d0e] text-accent border border-accent/20 rounded-xl">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
                        Detecção Harmonica Física // Smart_Detector
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 font-mono uppercase tracking-wide">
                        Reconhecimento de acordes formados em tempo real pelas notas pressionadas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10">
                  {midiNotesPressed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600 animate-pulse bg-zinc-900/60">
                        <Keyboard className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-400 uppercase font-mono tracking-wider">
                          Aguardando notas físicas...
                        </p>
                        <p className="text-[10px] text-zinc-600 font-sans max-w-sm">
                          Toque no mínimo duas ou três notas simultaneamente no seu teclado para obter a análise do acorde
                        </p>
                      </div>
                    </div>
                  ) : detectedChords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500/70 bg-amber-500/5">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider">
                          Estrutura de Acorde Não Reconhecida
                        </p>
                        <p className="text-[10px] text-zinc-600 font-sans max-w-sm">
                          Pressione notas complementares (por exemplo, tônica, terça e quinta) para obter sugestões do sistema
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {detectedChords.slice(0, 4).map((match, idx) => {
                        const isPerfect = match.confidence === 100;
                        return (
                          <div 
                            key={idx}
                            className={`p-4 border rounded-xl relative overflow-hidden group flex flex-col justify-between gap-4 transition-all duration-300 ${
                              isPerfect
                                ? 'bg-accent/5 border-accent/20 hover:border-accent/40 shadow-[0_4px_12px_rgba(0,255,170,0.05)]'
                                : 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                  isPerfect 
                                    ? 'bg-accent/15 border-accent/30 text-accent drop-shadow-[0_0_5px_rgba(0,255,170,0.3)]'
                                    : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                                }`}>
                                  {isPerfect ? 'Perfeito (100%)' : `Parcial (${match.confidence}%)`}
                                </span>
                                <h4 className={`text-xl sm:text-2xl font-black mt-2 tracking-wide font-display ${
                                  isPerfect ? 'text-accent' : 'text-zinc-100'
                                }`}>
                                  {match.chordSymbol}
                                </h4>
                              </div>
                              
                              <button
                                onClick={() => playChordSynth(match.notes)}
                                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                                  isPerfect
                                    ? 'bg-accent/10 border-accent/20 text-accent hover:bg-accent hover:text-zinc-950 hover:border-accent'
                                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-zinc-950 hover:border-purple-500'
                                }`}
                                title="Ouvir som sintetizado do acorde"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 justify-between border-t border-zinc-800/60 pt-3 mt-1 text-[11px] font-mono uppercase">
                              <span className="text-zinc-500">Root: {match.rootNote}</span>
                              <button
                                onClick={() => {
                                  setMidiGuideRoot(match.rootNote);
                                  setMidiGuideVariation(match.variationStr);
                                }}
                                className="text-zinc-400 hover:text-accent font-bold transition-colors flex items-center gap-1 hover:underline"
                              >
                                Ver Guia Visual <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </section>

            {/* COLUNA DIREITA (5 cols): Sugestões Harmônicas e Guia Visual */}
            <section className="lg:col-span-5 space-y-6">
              
              {/* Variações Harmônicas Recomendadas */}
              <div className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-xl p-5 sm:p-6 space-y-5 relative overflow-hidden group shadow-sm">
                <div className="absolute w-48 h-48 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="border-b border-zinc-800 pb-4 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0d0d0e] text-accent border border-accent/20 rounded-xl">
                      <Sparkles className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
                        Variações_Sugeridas // Explorer
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 font-mono uppercase tracking-wide">
                        Explore extensões baseadas no acorde tocado
                      </p>
                    </div>
                  </div>

                  {/* Root selector override */}
                  <div className="flex items-center gap-1.5 bg-[#0d0d0e] border border-white/10 rounded-lg p-1">
                    {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setMidiGuideRoot(r);
                          setMidiNotesPressed([]); // clear live to focus on manual
                        }}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs font-mono font-extrabold border transition-all ${
                          derivedMidiRoot === r
                            ? 'bg-accent border-accent text-zinc-950 font-black'
                            : 'bg-[#161617] text-zinc-400 border-transparent hover:text-zinc-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid de Variações */}
                <div className="space-y-3 relative z-10">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
                    Selecione uma variação de {derivedMidiRoot} para abrir o Guia Visual:
                  </span>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Object.keys(chordsData.variacoes).slice(0, 16).map((varKey) => {
                      const suffix = VARIATION_DISPLAY_SUFFIX[varKey] !== undefined ? VARIATION_DISPLAY_SUFFIX[varKey] : varKey;
                      const isSelected = midiGuideVariation === varKey;
                      return (
                        <button
                          key={varKey}
                          onClick={() => setMidiGuideVariation(varKey as VariationName)}
                          className={`py-2 px-1 text-center rounded-lg border transition-all text-xs font-mono font-bold flex flex-col justify-center items-center min-h-[44px] ${
                            isSelected
                              ? 'bg-accent/15 border-accent text-accent shadow-[0_0_10px_rgba(0,255,170,0.15)] font-black'
                              : 'bg-[#0d0d0e] border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-100'
                          }`}
                        >
                          <span className="text-[10px] text-zinc-500 leading-none mb-1">{derivedMidiRoot}</span>
                          <span className="text-xs tracking-wide leading-none">{suffix || 'Maior'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Guia Visual do Acorde Selecionado */}
              {guideParsedChord && (
                <div className="space-y-6">
                  
                  <div className="p-1 border border-transparent bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-2xl">
                    <PianoKeyboard
                      idContainer="midi-guide-keyboard"
                      parsedChord={guideParsedChord}
                      variant="next"
                      title={`Guia Visual: ${guideParsedChord.cifraOriginal}`}
                      subtitle={`Veja a posição exata das notas para o acorde ${guideParsedChord.cifraOriginal}`}
                      badgeText="REFERÊNCIA"
                      useFlats={['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(derivedMidiRoot)}
                    />
                  </div>

                  {/* Informações detalhadas do acorde no guia */}
                  <div className="bg-[#161617] border-2 border-white/10 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute w-48 h-48 -bottom-12 -right-12 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4 relative z-10 gap-3">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 font-mono">
                          Composição_Notas // {guideParsedChord.cifraOriginal}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                          Estrutura intervalar e frequências do acorde sugerido
                        </p>
                      </div>

                      <button
                        onClick={() => playChordSynth(guideParsedChord.notes)}
                        className="px-4 py-2 text-xs font-bold uppercase bg-accent text-zinc-950 border border-accent rounded-xl hover:brightness-115 transition-all flex items-center gap-2 font-sans"
                      >
                        <Volume2 className="w-4 h-4" />
                        Ouvir Som
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 relative z-10">
                      {guideParsedChord.notes.map((note, idx) => {
                        const isRoot = note.interval === 0;
                        return (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d0e] border border-white/5 text-xs font-mono"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 flex items-center justify-center rounded-lg font-black ${
                                isRoot 
                                  ? 'bg-accent/15 border border-accent/30 text-accent' 
                                  : 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                              }`}>
                                {note.noteName}
                              </span>
                              <span className="text-zinc-300 font-sans">
                                {INTERVAL_LABELS[note.interval] || `Grau +${note.interval}`}
                              </span>
                            </div>

                            <span className="text-zinc-500 text-[10px]">
                              {note.frequency.toFixed(1)} Hz // MIDI {note.midiNote}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </section>

          </div>
        </main>
      )}

      {/* --- ABA 3: DICIONÁRIO COMPLETO DE ACORDES E FILTROS --- */}
      {activeTab === 'dictionary' && (
        <main 
          style={{ marginLeft: '-5px' }}
          className="flex-1 w-full max-w-[1295px] mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col items-center justify-center"
        >
          <div 
            className="w-full space-y-6 my-auto"
          >
            
            {/* SEÇÃO DE FILTROS E BUSCA */}
            <div 
              className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors p-5 sm:p-7 space-y-5 shadow-sm relative overflow-hidden group"
              style={{ borderRadius: '12px', marginLeft: '0px', marginRight: '0px', paddingLeft: '0px', marginTop: '20px', marginBottom: '15px' }}
            >
            <div className="absolute w-64 h-64 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div 
              className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-white/10 pb-4 relative z-10 text-center sm:text-left"
              style={{ paddingLeft: '12px', paddingRight: '24px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <div className="p-2 bg-[#0d0d0e] border border-accent/20 text-accent">
                  <Filter className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-accent font-mono">
                  Dicionário Harmônico // Acordes
                </h3>
              </div>

              {/* Input de Busca Ampliado */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cifra (ex: m7, add9)..."
                  className="w-full bg-[#0d0d0e] border border-white/10 rounded-none pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 font-mono focus:outline-none focus:border-accent transition-all placeholder:text-zinc-700 min-h-[42px]"
                  style={{ borderRadius: '12px', paddingLeft: '35px', paddingRight: '12px', paddingTop: '2px', paddingBottom: '2px' }}
                />
              </div>
            </div>

            {/* FILTRO 1: GRUPO DE NOTAS FUNDAMENTAIS */}
            <div className="space-y-3 relative z-10">
              <div 
                className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm font-mono uppercase tracking-wider"
                style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px' }}
              >
                <span 
                  className="text-zinc-500 font-bold text-center sm:text-left text-[11px]"
                  style={{ fontStyle: 'italic', color: '#00A769' }}
                >
                  1. Nota Fundamental (Tônica):
                </span>
                <div 
                  className="flex items-center justify-center gap-1 bg-[#0d0d0e] p-1 rounded-lg border border-white/10 text-xs"
                  style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '2px', paddingBottom: '2px' }}
                >
                  {(['Todas', 'Naturais', 'Acidentes'] as const).map(grp => (
                    <button
                      key={grp}
                      onClick={() => setRootGroupFilter(grp)}
                      className={`px-3 py-1.5 rounded-lg font-bold font-mono text-[10px] uppercase tracking-wider transition-all duration-300 ease-out hover:scale-[1.04] hover:brightness-110 active:scale-[0.97] min-h-[30px] border ${
                        rootGroupFilter === grp ? 'bg-accent text-zinc-950 border-accent' : 'text-zinc-400 border-transparent hover:text-white'
                      }`}
                      style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Notas Fundamentais Ampliados e Centralizados */}
              <div 
                className="flex flex-wrap justify-center gap-2 ml-0 border border-white/10"
                style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '16px', paddingBottom: '16px', borderRadius: '0px' }}
              >
                {filteredRootNotes.map((note) => (
                  <button
                    key={note}
                    onClick={() => setSelectedRoot(note)}
                    className={`w-[85px] h-[42px] rounded-lg text-xs sm:text-sm font-mono font-bold transition-all duration-300 ease-out hover:scale-[1.04] hover:brightness-110 hover:shadow-[0_0_15px_rgba(0,255,170,0.25)] active:scale-[0.97] border-2 flex items-center justify-center ${
                      selectedRoot === note
                        ? 'bg-accent text-zinc-950 border-accent shadow-[0_0_12px_rgba(0,255,170,0.3)] hover:shadow-[0_0_18px_rgba(0,255,170,0.45)]'
                        : 'bg-[#0d0d0e] text-zinc-300 border-white/10 hover:border-accent/40 hover:text-accent'
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTRO 2: MODO (MAIOR / MENOR) */}
            {selectedRoot && (
              <div className="space-y-3 pt-3 border-t border-white/10 relative z-10 transition-all duration-500">
                <span 
                  className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block font-mono text-center sm:text-left"
                  style={{ fontStyle: 'italic', color: '#00A769', paddingLeft: '12px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px' }}
                >
                  2. Modo (M / m):
                </span>
                <div 
                  className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs sm:text-sm font-mono"
                  style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '12px' }}
                >
                  {(['Todos', 'Maior', 'Menor'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setQualityFilter(mode)}
                      className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-all duration-300 ease-out hover:scale-[1.04] hover:brightness-110 hover:shadow-[0_0_15px_rgba(0,255,170,0.25)] active:scale-[0.97] border min-h-[42px] flex items-center justify-center ${
                        qualityFilter === mode
                          ? 'bg-accent text-zinc-950 border-accent shadow-[0_0_12px_rgba(0,255,170,0.3)] hover:shadow-[0_0_18px_rgba(0,255,170,0.45)]'
                          : 'bg-[#0d0d0e] text-zinc-300 border-white/10 hover:border-accent/40 hover:text-accent'
                      }`}
                      style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                    >
                      {mode === 'Todos' ? 'Todos os Modos' : mode}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FILTRO 3: CATEGORIA DE VARIAÇÃO */}
            <div className="space-y-3 pt-3 border-t border-white/10 relative z-10">
              <span 
                className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block font-mono text-center sm:text-left"
                style={{ fontStyle: 'italic', color: '#00A769', paddingLeft: '12px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                3. Categoria da Variação:
              </span>
              <div 
                className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs sm:text-sm font-mono"
                style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '12px', paddingRight: '12px' }}
              >
                {['Todas', 'Tríades', 'Tétrades & Sétimas', 'Sextas & Nonas', 'Suspensos & Alterados'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-all duration-300 ease-out hover:scale-[1.04] hover:brightness-110 hover:shadow-[0_0_15px_rgba(0,255,170,0.25)] active:scale-[0.97] border min-h-[42px] flex items-center justify-center ${
                      selectedCategoryFilter === cat
                        ? 'bg-accent text-zinc-950 border-accent shadow-[0_0_12px_rgba(0,255,170,0.3)] hover:shadow-[0_0_18px_rgba(0,255,170,0.45)]'
                        : 'bg-[#0d0d0e] text-zinc-300 border-white/10 hover:border-accent/40 hover:text-accent'
                    }`}
                    style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* BOTÕES DE SELEÇÃO DA VARIAÇÃO */}
            <div className="space-y-3 pt-3 border-t border-white/10 relative z-10">
              <span 
                className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block font-mono text-center sm:text-left"
                style={{ fontStyle: 'italic', color: '#00A769', paddingLeft: '12px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                4. Variação Harmônica do Acorde:
              </span>
              <div 
                className="flex flex-wrap justify-center sm:justify-start gap-2"
                style={{ borderRadius: '12px', paddingLeft: '35px', paddingRight: '35px', paddingTop: '20px', paddingBottom: '20px', marginLeft: '0px' }}
              >
                {filteredVariations.map((varName) => (
                  <button
                    key={varName}
                    onClick={() => setSelectedVariation(varName)}
                    className={`w-[85px] h-[42px] rounded-lg text-[11px] font-mono font-bold transition-all duration-300 ease-out hover:scale-[1.04] hover:brightness-110 hover:shadow-[0_0_15px_rgba(0,255,170,0.25)] active:scale-[0.97] border-2 flex items-center justify-center ${
                      selectedVariation === varName
                        ? 'bg-accent text-zinc-950 border-accent shadow-[0_0_12px_rgba(0,255,170,0.3)] hover:shadow-[0_0_18px_rgba(0,255,170,0.45)]'
                        : 'bg-[#0d0d0e] text-zinc-300 border-white/10 hover:border-accent/40 hover:text-accent'
                    }`}
                  >
                    {selectedRoot}{varName}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTRO 5: INVERSÃO DO ACORDE */}
            <div className="space-y-3 pt-3 border-t border-white/10 relative z-10">
              <span 
                className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block font-mono text-center sm:text-left"
                style={{ fontStyle: 'italic', color: '#00A769', paddingLeft: '12px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                5. Inversão do Acorde:
              </span>
              <div 
                className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs sm:text-sm font-mono"
                style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '12px', paddingRight: '12px' }}
              >
                {['Fundamental', '1ª Inversão', '2ª Inversão', '3ª Inversão'].map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInversion(idx)}
                    className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-all duration-300 ease-out hover:scale-[1.04] hover:brightness-110 hover:shadow-[0_0_15px_rgba(0,255,170,0.25)] active:scale-[0.97] border min-h-[42px] flex items-center justify-center ${
                      inversion === idx
                        ? 'bg-accent text-zinc-950 border-accent shadow-[0_0_12px_rgba(0,255,170,0.3)] hover:shadow-[0_0_18px_rgba(0,255,170,0.45)]'
                        : 'bg-[#0d0d0e] text-zinc-300 border-white/10 hover:border-accent/40 hover:text-accent'
                    }`}
                    style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* VISUALIZADOR DO ACORDE NO TECLADO + NOTAS HARMÔNICAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Esquerda (7 cols): Piano + Ouvir Som */}
            <div className="lg:col-span-7 space-y-4">
              <div 
                className="bg-[#161617] border-2 border-accent/60 hover:border-accent transition-colors rounded-xl space-y-4 shadow-sm relative overflow-hidden group"
                style={{ marginTop: '16px', marginBottom: '16px', marginLeft: '8px', marginRight: '8px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '12px', paddingBottom: '12px' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span 
                      className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider"
                      style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '4px', paddingBottom: '4px' }}
                    >
                      Acorde Selecionado
                    </span>
                    <h3 
                      className="text-3xl sm:text-4xl font-black text-accent font-mono"
                      style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '2px', paddingBottom: '4px', marginTop: '0px', marginBottom: '0px' }}
                    >
                      {selectedRoot}{selectedVariation}
                      {inversion > 0 && <span className="text-xs text-zinc-400 ml-2 font-mono uppercase font-bold">({inversion}ª Inversão)</span>}
                    </h3>
                  </div>

                  <button
                    onClick={() => playChordSynth(chordNotes)}
                    disabled={isPlayingSynth}
                    className="px-5 py-2.5 sm:py-3 rounded-none bg-accent/10 text-accent border border-accent/30 text-xs font-bold font-mono uppercase tracking-widest hover:bg-accent hover:text-zinc-950 transition-all flex items-center gap-2 active:scale-[0.98] min-h-[44px]"
                    style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', marginRight: '12px', marginLeft: '12px', borderRadius: '10px' }}
                  >
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    <span>{isPlayingSynth ? 'Tocando...' : 'Ouvir Acorde'}</span>
                  </button>
                </div>

                {/* Piano Teclado */}
                <PianoKeyboard
                  idContainer="keyboard-dictionary"
                  parsedChord={dictionaryParsedChord}
                  variant="current"
                  title={`Acorde ${selectedRoot}${selectedVariation}`}
                  useFlats={useFlats}
                />
              </div>
            </div>

            {/* Direita (5 cols): Tabela Harmônica com Frequências e Intervalos */}
            <div className="lg:col-span-5 space-y-4">
              <div 
                className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-xl space-y-3.5 shadow-sm relative overflow-hidden group"
                style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '12px', paddingBottom: '12px', marginLeft: '8px', marginRight: '8px', marginTop: '16px', marginBottom: '16px' }}
              >
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-accent font-mono flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <Info className="w-4 h-4 text-accent" />
                  Estrutura Harmônica
                </h4>

                <p className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
                  Nome Teórico: <span className="text-accent font-bold font-mono">{THEORETICAL_NAMES[selectedVariation] || 'Personalizado'}</span>
                </p>

                <div className="space-y-2.5 pt-2">
                  {chordNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#0d0d0e] border border-white/10 text-xs sm:text-sm font-mono"
                    >
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className={`w-2.5 h-2.5 rounded ${note.interval === 0 ? 'bg-accent shadow-[0_0_8px_rgba(0,255,170,0.8)]' : 'bg-[#161617] border border-accent/40'}`}></span>
                        <span className="font-bold text-zinc-100 text-sm">{note.noteName}{note.octave}</span>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-accent font-bold uppercase text-[11px] tracking-wider">{note.label}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{note.frequency.toFixed(1)} Hz</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    )}

      {/* TOAST DE NOTIFICAÇÃO FLUTUANTE DE INSIGHTS & JAZZ */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900/95 border border-cyan-500/60 text-zinc-100 px-5 py-3 rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.3)] backdrop-blur-xl flex items-center gap-3 animate-bounce font-sans text-xs font-bold">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span>{toastNotification}</span>
        </div>
      )}

     </div>
  );
}
