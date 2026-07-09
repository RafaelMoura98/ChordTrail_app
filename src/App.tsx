import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Music, Volume2, Sparkles, Clock, Database, ListMusic, Youtube, 
  Keyboard, RefreshCw, ChevronRight, Play, Pause, CheckCircle2,
  Wand2, Cpu, Loader2, ArrowRight, Eye, FastForward, Rewind, RotateCcw,
  Trash2, Plus, Filter, Search, Info, Zap
} from 'lucide-react';
import chordsData from './data/chords.json';
import { ChordInsightsPanel } from './components/ChordInsightsPanel';
import { reharmonizeTimelineToJazz } from './utils/harmonyEngine';

// Declaração do namespace global do YouTube Iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// Estrutura de cada nó de acorde na linha do tempo sincronizada
export interface SyncItem {
  tempo: number;
  cifra: string;
}

// Pacote de música completa salva no LocalStorage ('musicasSincronizadas')
export interface SavedSong {
  id: string;
  title: string;
  youtubeUrl: string;
  linhaDoTempo: SyncItem[];
  cifraOriginal?: string;
  savedAt: string;
  duracao?: number;
}

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
 * EXTRAÇÃO DE ID DO YOUTUBE
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  if (url.trim().length === 11) {
    return url.trim();
  }
  return null;
}

// Formatação de Segundos para MM:SS.ms
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  const secsPadded = parseFloat(secs) < 10 ? `0${secs}` : secs;
  return `${mins}:${secsPadded}`;
}

/**
 * ALGORITMO DE BUSCA DO ACORDE ATIVO NA LINHA DO TEMPO
 */
export function findActiveChordIndex(timeline: SyncItem[], currentTime: number): number {
  if (!timeline || timeline.length === 0) return -1;

  let activeIndex = -1;
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i].tempo <= currentTime) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
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
 * LEITURA DAS MÚSICAS SALVAS DO LOCALSTORAGE ('musicasSincronizadas')
 * Sem presets fixos (Começa limpo por padrão conforme solicitado)
 */
function loadSavedSongsFromStorage(): SavedSong[] {
  try {
    const stored = localStorage.getItem('musicasSincronizadas');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          id: item.id || `stored_${idx}_${Date.now()}`,
          title: item.title || `Música Sincronizada #${idx + 1}`,
          youtubeUrl: item.youtubeUrl || '',
          linhaDoTempo: item.linhaDoTempo || [],
          cifraOriginal: item.cifraOriginal || '',
          savedAt: item.savedAt || 'Salvo no LocalStorage',
          duracao: item.duracao || 0
        }));
      }
    }
  } catch (e) {
    console.error('Erro ao carregar do localStorage', e);
  }

  return [];
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
}

function PianoKeyboard({ idContainer, parsedChord, variant, title, subtitle, badgeText, useFlats = false }: PianoKeyboardProps) {
  const isCurrent = variant === 'current';

  // Gerar as 28 teclas do piano (2 oitavas completas C3 -> E5)
  const keys = useMemo(() => {
    const result = [];
    const scale = useFlats ? NOTES_FLAT : NOTES_SHARP;
    const startMidi = 48; // Nota C3

    for (let i = 0; i < 28; i++) {
      const midi = startMidi + i;
      const noteInOctave = i % 12;
      const noteName = scale[noteInOctave];
      const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
      const octave = Math.floor(midi / 12) - 1;

      let matchedNote = null;
      if (parsedChord) {
        matchedNote = parsedChord.notes.find(cn => cn.midiNote === midi);
      }

      result.push({
        midi,
        noteName,
        octave,
        isBlack,
        isPressed: !!matchedNote,
        chordNote: matchedNote
      });
    }
    return result;
  }, [parsedChord, useFlats]);

  return (
    <div 
      id={idContainer}
      className={`rounded-2xl p-4 sm:p-5 border transition-all relative overflow-hidden group ${
        isCurrent
          ? 'bg-zinc-900/40 border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:border-cyan-500/60'
          : 'bg-zinc-900/40 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:border-purple-500/60'
      }`}
    >
      {/* Luz Ambiente (Glow) */}
      <div className={`absolute w-48 h-48 -top-10 -right-10 rounded-full blur-3xl pointer-events-none ${isCurrent ? 'bg-cyan-500/10' : 'bg-purple-500/10'}`}></div>

      {/* Header do Teclado */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3 gap-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${isCurrent ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>
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
          <span className={`text-[10px] font-mono font-bold px-3 py-0.5 rounded-full border shrink-0 ${
            isCurrent
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
              : 'bg-purple-500/10 text-purple-400 border-purple-500/30 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
          }`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Renderização do Teclado Piano */}
      <div className="relative w-full overflow-x-auto no-scrollbar pb-1 relative z-10">
        <div className={`relative flex w-full ${isCurrent ? 'h-32 sm:h-36 min-w-[520px]' : 'h-22 sm:h-26 min-w-[420px]'} bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 justify-center select-none`}>
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
                          : 'bg-cyan-400 border-cyan-500 text-zinc-950 font-black shadow-[0_6px_16px_rgba(34,211,238,0.8)] z-10 scale-[0.98]'
                        : isRoot
                          ? 'bg-fuchsia-400 border-fuchsia-500 text-zinc-950 font-black shadow-[0_6px_16px_rgba(232,121,249,0.8)] z-10 scale-[0.98]'
                          : 'bg-purple-400 border-purple-500 text-zinc-950 font-black shadow-[0_6px_16px_rgba(192,132,252,0.8)] z-10 scale-[0.98]'
                      : 'bg-zinc-200 border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <span className={`${isCurrent ? 'text-[8px] sm:text-[9px]' : 'text-[7px]'} font-mono font-bold leading-none`}>{key.noteName}</span>
                </div>

                {/* Tecla Preta */}
                {blackKeyAfter && (
                  <div
                    className={`absolute top-0 -right-[40%] w-[80%] h-[60%] z-20 rounded-b-lg border transition-all flex flex-col justify-end p-0.5 items-center ${
                      blackKeyAfter.isPressed
                        ? isCurrent
                          ? blackKeyAfter.chordNote?.interval === 0
                            ? 'bg-accent border-[#00dc90] text-zinc-950 font-black shadow-[0_4px_12px_rgba(0,255,170,0.8)]'
                            : 'bg-cyan-400 border-cyan-500 text-zinc-950 font-black shadow-[0_4px_12px_rgba(34,211,238,0.8)]'
                          : blackKeyAfter.chordNote?.interval === 0
                            ? 'bg-fuchsia-400 border-fuchsia-500 text-zinc-950 font-black shadow-[0_4px_12px_rgba(232,121,249,0.8)]'
                            : 'bg-purple-400 border-purple-500 text-zinc-950 font-black shadow-[0_4px_12px_rgba(192,132,252,0.8)]'
                        : 'bg-zinc-900 border-zinc-950 text-zinc-400'
                    }`}
                  >
                    <span className={`${isCurrent ? 'text-[7px]' : 'text-[6px]'} font-mono leading-none`}>{blackKeyAfter.noteName}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda de Cores */}
      <div className="flex items-center justify-between text-[10px] font-sans text-zinc-400 pt-1 relative z-10">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-accent' : 'bg-fuchsia-400'}`}></span>
          Tônica
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-cyan-400' : 'bg-purple-400'}`}></span>
          Notas
        </span>
        <span className={`font-mono font-bold ${isCurrent ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'}`}>
          {parsedChord ? parsedChord.cifraOriginal : 'Aguardando...'}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  // Controle de Abas: 'playback' (Modo Reprodução) | 'ai_sync' (Sincronização IA) | 'dictionary' (Dicionário)
  const [activeTab, setActiveTab] = useState<'playback' | 'ai_sync' | 'dictionary'>('playback');

  // Músicas Salvas no LocalStorage
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');

  // Música Selecionada Atual
  const currentSong = useMemo(() => {
    return savedSongs.find(s => s.id === selectedSongId) || savedSongs[0] || null;
  }, [savedSongs, selectedSongId]);

  const currentSongRef = useRef<SavedSong | null>(currentSong);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  // --- MODO REPRODUÇÃO & DUPLO TECLADO VISUAL ---
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [activeChordIndex, setActiveChordIndex] = useState<number>(-1);
  const [activeChordParsed, setActiveChordParsed] = useState<ParsedChord | null>(null);
  const [nextChordParsed, setNextChordParsed] = useState<ParsedChord | null>(null);

  // Refs de Controle do Player do YouTube
  const ytPlaybackPlayerRef = useRef<any>(null);
  const playbackIntervalRef = useRef<any>(null);
  const activeChordIndexRef = useRef<number>(-1);

  // --- MODO SINCRONIZAÇÃO AUTOMÁTICA POR IA ---
  const [aiUrlInput, setAiUrlInput] = useState<string>('https://www.youtube.com/watch?v=LkW3b-uK2iE');
  const [aiTitleInput, setAiTitleInput] = useState<string>('Minha Música');
  const [aiCifraInput, setAiCifraInput] = useState<string>(`[Intro] C  G/B  Am  F\nC               G/B             Am\nComo Zaqueu, eu quero subir o mais alto\n          F\nSó pra te ver, olhar para Ti`);
  
  // Estados do Loader Progressivo de IA
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiProgressPercent, setAiProgressPercent] = useState<number>(0);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  const [aiSuccessResult, setAiSuccessResult] = useState<string | null>(null);

  // --- DICIONÁRIO DE ACORDES E FILTROS ---
  const [selectedRoot, setSelectedRoot] = useState<RootNote>('C');
  const [selectedVariation, setSelectedVariation] = useState<VariationName>('Maior');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todas');
  const [rootGroupFilter, setRootGroupFilter] = useState<'Todas' | 'Naturais' | 'Acidentes'>('Todas');
  const [inversion, setInversion] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPlayingSynth, setIsPlayingSynth] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- SISTEMA DE NOTIFICAÇÃO TOAST & INSIGHTS IA ---
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  /**
   * REARMONIZAÇÃO DE TRILHA EM ESTILO JAZZ
   */
  const handleReharmonizeCurrentSongToJazz = () => {
    if (!currentSong || !currentSong.linhaDoTempo || currentSong.linhaDoTempo.length === 0) {
      alert('Nenhuma música selecionada para rearmonizar.');
      return;
    }

    const novaLinhaDoTempo = reharmonizeTimelineToJazz(currentSong.linhaDoTempo);
    const updatedSong: SavedSong = {
      ...currentSong,
      linhaDoTempo: novaLinhaDoTempo
    };

    const novaLista = savedSongs.map(s => s.id === currentSong.id ? updatedSong : s);
    setSavedSongs(novaLista);
    localStorage.setItem('musicasSincronizadas', JSON.stringify(novaLista));

    if (activeChordIndex >= 0 && novaLinhaDoTempo[activeChordIndex]) {
      setActiveChordParsed(parseChordSymbolToNotes(novaLinhaDoTempo[activeChordIndex].cifra));
    }
    if (activeChordIndex + 1 < novaLinhaDoTempo.length) {
      setNextChordParsed(parseChordSymbolToNotes(novaLinhaDoTempo[activeChordIndex + 1].cifra));
    }

    setToastNotification(`🎷 Cifra rearmonizada! ${novaLinhaDoTempo.length} acordes foram enriquecidos com tétrades e nonas de Jazz.`);
    setTimeout(() => setToastNotification(null), 4000);
  };

  /**
   * EXPERIMENTAÇÃO RÁPIDA DE ACORDES SUGERIDOS NO PAINEL DE INSIGHTS
   */
  const handleSelectChordForExperiment = (symbol: string) => {
    const parsed = parseChordSymbolToNotes(symbol);
    if (parsed) {
      setActiveChordParsed(parsed);
      setToastNotification(`🎯 Testando acorde [${symbol}] no Teclado Principal`);
      setTimeout(() => setToastNotification(null), 3000);
    }
  };

  const handlePlayChordSynthFromSymbol = (symbol: string) => {
    const parsed = parseChordSymbolToNotes(symbol);
    if (parsed && parsed.notes) {
      playChordSynth(parsed.notes);
    }
  };

  // Carregar Músicas Salvas na Inicialização
  useEffect(() => {
    const list = loadSavedSongsFromStorage();
    setSavedSongs(list);
    if (list.length > 0) {
      setSelectedSongId(list[0].id);
    }
  }, []);

  /**
   * REINICIALIZAÇÃO / RESET DO LOCALSTORAGE
   */
  const handleResetLocalStorage = () => {
    if (confirm('Deseja excluir todas as músicas sincronizadas e limpar o LocalStorage?')) {
      localStorage.removeItem('musicasSincronizadas');
      setSavedSongs([]);
      setSelectedSongId('');
      setActiveChordParsed(null);
      setNextChordParsed(null);
      setActiveChordIndex(-1);
      alert('LocalStorage limpo com sucesso.');
    }
  };

  /**
   * REQUISITO 3: SISTEMA DE PLAYBACK OTIMIZADO PARA TRANSIÇÃO DE ESTADOS
   * Loop de 100ms que monitora o tempo do player do YouTube, encontra o Nó Ativo (Current Chord)
   * e o Nó Seguinte (Next Chord), e aciona a renderização dos dois teclados.
   */
  const startPlaybackMonitoring = () => {
    stopPlaybackMonitoring();

    playbackIntervalRef.current = setInterval(() => {
      const player = ytPlaybackPlayerRef.current;
      if (player && typeof player.getCurrentTime === 'function') {
        const time = player.getCurrentTime();
        setPlaybackCurrentTime(time);

        const song = currentSongRef.current;
        if (!song || !song.linhaDoTempo || song.linhaDoTempo.length === 0) return;

        // Identifica o índice do nó ativo atual no tempo do vídeo
        const newActiveIndex = findActiveChordIndex(song.linhaDoTempo, time);

        // TRIGGER CONTROL: Atualiza os dois teclados apenas quando muda de nó
        if (newActiveIndex !== activeChordIndexRef.current) {
          activeChordIndexRef.current = newActiveIndex;
          setActiveChordIndex(newActiveIndex);

          // 1) ACORDE ATUAL (Teclado Principal Central)
          if (newActiveIndex >= 0 && song.linhaDoTempo[newActiveIndex]) {
            const currentChordStr = song.linhaDoTempo[newActiveIndex].cifra;
            setActiveChordParsed(parseChordSymbolToNotes(currentChordStr));
          } else {
            setActiveChordParsed(null);
          }

          // 2) PRÓXIMO ACORDE (Teclado de Preparação no Painel Superior Direito)
          const nextIndex = newActiveIndex + 1;
          if (nextIndex < song.linhaDoTempo.length) {
            const nextChordStr = song.linhaDoTempo[nextIndex].cifra;
            setNextChordParsed(parseChordSymbolToNotes(nextChordStr));
          } else {
            setNextChordParsed(null);
          }
        }
      }
    }, 100);
  };

  const stopPlaybackMonitoring = () => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPlaybackMonitoring();
  }, []);

  /**
   * CONTROLES MANUAIS DO PLAYER DE VÍDEO DO YOUTUBE
   */
  const togglePlayPauseVideo = () => {
    const player = ytPlaybackPlayerRef.current;
    if (player && typeof player.getPlayerState === 'function') {
      const state = player.getPlayerState();
      // 1 = PLAYING
      if (state === 1) {
        player.pauseVideo();
        setIsPlayingVideo(false);
      } else {
        player.playVideo();
        setIsPlayingVideo(true);
      }
    }
  };

  const seekVideoBy = (secondsOffset: number) => {
    const player = ytPlaybackPlayerRef.current;
    if (player && typeof player.getCurrentTime === 'function') {
      const current = player.getCurrentTime() || 0;
      const target = Math.max(0, current + secondsOffset);
      player.seekTo(target, true);
    }
  };

  const handleSeekToTimestamp = (tempo: number) => {
    const player = ytPlaybackPlayerRef.current;
    if (player && typeof player.seekTo === 'function') {
      player.seekTo(tempo, true);
      player.playVideo();
      setIsPlayingVideo(true);
    }
  };

  /**
   * INICIALIZAÇÃO DO PLAYER DO YOUTUBE (MODO REPRODUÇÃO)
   */
  useEffect(() => {
    if (activeTab !== 'playback' || !currentSong) return;

    const videoId = extractYouTubeId(currentSong.youtubeUrl);
    if (!videoId) return;

    // Reset de estados
    activeChordIndexRef.current = -1;
    setActiveChordIndex(-1);
    setActiveChordParsed(null);

    // Ajusta o acorde inicial
    if (currentSong.linhaDoTempo.length > 0) {
      setNextChordParsed(parseChordSymbolToNotes(currentSong.linhaDoTempo[0].cifra));
    }

    const initPlaybackPlayer = () => {
      if (window.YT && window.YT.Player) {
        try {
          ytPlaybackPlayerRef.current = new window.YT.Player('playback-player', {
            events: {
              'onReady': () => {
                // Player pronto
              },
              'onStateChange': (event: any) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlayingVideo(true);
                  startPlaybackMonitoring();
                } else {
                  setIsPlayingVideo(false);
                  if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                    stopPlaybackMonitoring();
                  }
                }
              }
            }
          });
        } catch (e) {
          console.log('Iframe API attaching attempt', e);
        }
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        initPlaybackPlayer();
      };
    } else {
      setTimeout(initPlaybackPlayer, 200);
    }
  }, [activeTab, selectedSongId, currentSong]);

  /**
   * REQUISITO 1: INTERFACE COM O MODELO DE IA (SIMULAÇÃO DE ANÁLISE DE ÁUDIO)
   * Extração do ID do YouTube, envio conceitual para API Gemini / Espectral,
   * e distribuição inteligente dos acordes ao longo do tempo.
   */
  const analisarMusicaComIA = async () => {
    setAiSuccessResult(null);

    const videoId = extractYouTubeId(aiUrlInput);
    if (!videoId) {
      alert('Por favor, informe um Link válido do YouTube!');
      return;
    }

    const acordesExtraidos = extractChordsFromText(aiCifraInput);
    if (acordesExtraidos.length === 0) {
      alert('Nenhum acorde válido foi localizado no texto da cifra fornecido.');
      return;
    }

    setIsAnalyzingAi(true);
    setAiProgressPercent(0);
    setAiStatusMessage('0% - Baixando stream de áudio do YouTube...');

    // Passo 1: Download de Stream (0% -> 30%)
    await new Promise(resolve => setTimeout(resolve, 800));
    setAiProgressPercent(30);
    setAiStatusMessage('30% - Analisando transientes, batidas e BPM...');

    // Passo 2: Análise Espectral e Frequências (30% -> 65%)
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAiProgressPercent(65);
    setAiStatusMessage('65% - Mapeando frequências cromáticas e trocas de compasso...');

    // Passo 3: Distribuição Rítmica Inteligente (65% -> 100%)
    await new Promise(resolve => setTimeout(resolve, 900));

    // Duração estimada da música (210 segundos ou 3m30s)
    const duracaoTotalEmSegundos = 210;
    const offsetInicial = 3.5;
    const tempoUtil = Math.max(duracaoTotalEmSegundos - 10.0, 30.0);
    const intervaloEntreAcordes = tempoUtil / acordesExtraidos.length;

    const novaLinhaDoTempo: SyncItem[] = acordesExtraidos.map((cifra, idx) => {
      const tempoCalculado = offsetInicial + (idx * intervaloEntreAcordes);
      return {
        tempo: parseFloat(tempoCalculado.toFixed(1)),
        cifra: cifra
      };
    });

    setAiProgressPercent(100);
    setAiStatusMessage('100% - Acordes sincronizados com sucesso pela IA!');

    const novaMusicaIA: SavedSong = {
      id: `ai_song_${Date.now()}`,
      title: aiTitleInput.trim() || `Música IA #${savedSongs.length + 1}`,
      youtubeUrl: aiUrlInput,
      linhaDoTempo: novaLinhaDoTempo,
      cifraOriginal: aiCifraInput,
      savedAt: new Date().toLocaleDateString('pt-BR'),
      duracao: duracaoTotalEmSegundos
    };

    // Gravação no LocalStorage com chave 'musicasSincronizadas'
    try {
      let listaAtual = loadSavedSongsFromStorage();
      listaAtual = [novaMusicaIA, ...listaAtual];
      localStorage.setItem('musicasSincronizadas', JSON.stringify(listaAtual));

      const atualizada = loadSavedSongsFromStorage();
      setSavedSongs(atualizada);
      setSelectedSongId(novaMusicaIA.id);

      setAiSuccessResult(`A IA sincronizou ${novaLinhaDoTempo.length} acordes ao longo da música!`);
    } catch (e) {
      console.error('Erro ao gravar no localStorage', e);
    }

    setIsAnalyzingAi(false);
  };

  // Excluir uma única música
  const handleDeleteSong = (idToDelete: string) => {
    if (confirm('Deseja excluir esta música salva?')) {
      const novaLista = savedSongs.filter(s => s.id !== idToDelete);
      localStorage.setItem('musicasSincronizadas', JSON.stringify(novaLista));
      setSavedSongs(novaLista);
      if (selectedSongId === idToDelete) {
        setSelectedSongId(novaLista.length > 0 ? novaLista[0].id : '');
      }
    }
  };

  // CÁLCULOS E FILTROS DO DICIONÁRIO DE ACORDES
  const filteredRootNotes = useMemo(() => {
    if (rootGroupFilter === 'Naturais') return ROOT_NATURAL_NOTES;
    if (rootGroupFilter === 'Acidentes') return ROOT_ACCIDENTAL_NOTES;
    return ALL_ROOT_NOTES;
  }, [rootGroupFilter]);

  const variations = chordsData.variacoes as Record<VariationName, number[]>;
  const variationKeys = Object.keys(variations) as VariationName[];

  const filteredVariations = useMemo(() => {
    return variationKeys.filter(varName => {
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
  }, [variationKeys, selectedCategoryFilter, searchQuery, selectedRoot]);

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

  const videoIdForPlayback = currentSong ? extractYouTubeId(currentSong.youtubeUrl) : null;

  return (
    <div className="min-h-screen bg-[#0d0d0e] text-[#e0e0e0] flex flex-col font-sans overflow-x-hidden selection:bg-accent selection:text-zinc-950">
      
      {/* Top Header */}
      <header className="h-16 border-b-2 border-white/10 bg-[#0d0d0e] sticky top-0 z-50 flex items-center justify-center px-4 sm:px-8">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#161617] border border-white/15 text-accent flex items-center justify-center font-mono rounded-lg">
              <Music className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-widest text-accent font-display uppercase">
                KEYCHORD
              </h1>
              <span className="text-[9px] text-zinc-600 font-mono">v0.2.1</span>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1">
            
            <button
              onClick={() => setActiveTab('playback')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                activeTab === 'playback'
                  ? 'bg-accent text-zinc-950 border-accent'
                  : 'bg-[#161617] text-[#e0e0e0] border-white/10 hover:border-white/20'
              }`}
            >
              <span>Reprodução</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_sync')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                activeTab === 'ai_sync'
                  ? 'bg-accent text-zinc-950 border-accent'
                  : 'bg-[#161617] text-[#e0e0e0] border-white/10 hover:border-white/20'
              }`}
            >
              <span>IA Sinc</span>
            </button>

            <button
              onClick={() => setActiveTab('dictionary')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                activeTab === 'dictionary'
                  ? 'bg-accent text-zinc-950 border-accent'
                  : 'bg-[#161617] text-[#e0e0e0] border-white/10 hover:border-white/20'
              }`}
            >
              <span>Dicionário</span>
            </button>
          </div>

          {/* Quantidade de Músicas */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase">
            <span className="text-zinc-500">LIBRA_STAT:</span>
            <span className="text-accent font-bold">[{savedSongs.length.toString().padStart(2, '0')}_SAVED]</span>
          </div>
        </div>
      </header>

      {/* --- ABA 1: MODO REPRODUÇÃO & DUPLO TECLADO VISUAL --- */}
      {activeTab === 'playback' && (
        <main 
          className="flex-1 w-full max-w-[1295px] mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto"
        >
          
          {savedSongs.length === 0 ? (
            /* Estado Vazio de Músicas Salvas */
            <div className="lg:col-span-12 flex flex-col items-center justify-center p-8 sm:p-16 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-5 my-auto relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
              <div className="absolute w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                <Wand2 className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2 relative z-10">
                <h3 className="text-xl font-bold text-zinc-100">Nenhuma música sincronizada ainda</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Utilize o nosso motor de IA para analisar o vídeo do YouTube e a cifra, criando uma linha do tempo automática em segundos.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('ai_sync')}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 text-xs relative z-10"
              >
                <Sparkles className="w-4 h-4" />
                Criar Nova Sincronização por IA
              </button>
            </div>
          ) : (
            <>
              {/* COLUNA ESQUERDA (7 cols): Seletor + YouTube Player + Teclado Principal (Acorde Ativo) */}
              <section className="lg:col-span-7 flex flex-col gap-6">
                
                {/* SELETOR DE MÚSICAS SALVAS */}
                <div className="bg-zinc-900/40 border border-zinc-800 hover:border-cyan-500/50 transition-colors rounded-2xl p-4 space-y-3 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <ListMusic className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider font-sans text-zinc-100">
                        Músicas Sincronizadas
                      </h3>
                    </div>
                    <button
                      onClick={handleResetLocalStorage}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-sans flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Limpar Tudo
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSongId}
                      onChange={(e) => setSelectedSongId(e.target.value)}
                      className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-full py-2.5 px-4 text-xs sm:text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-accent font-mono font-bold cursor-pointer"
                    >
                      {savedSongs.map((song) => (
                        <option key={song.id} value={song.id} className="bg-zinc-900 text-zinc-100 font-mono py-1">
                          🎵 {song.title} ({song.linhaDoTempo?.length || 0} acordes)
                        </option>
                      ))}
                    </select>

                    {currentSong && (
                      <button
                        onClick={() => handleDeleteSong(currentSong.id)}
                        title="Excluir esta música"
                        className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* PLAYER DO YOUTUBE + BARRA DE CONTROLES */}
                <div className="bg-zinc-900/40 border border-zinc-800 hover:border-cyan-500/50 transition-colors rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden group">
                  {/* Luz Ambiente (Glow Neon Ciano) */}
                  <div className="absolute w-64 h-64 -top-12 -right-12 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex flex-wrap items-center justify-between text-xs gap-2 relative z-10">
                    <span className="text-zinc-200 font-bold flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-rose-500" />
                      Vídeo do YouTube
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                        isPlayingVideo ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]' : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
                      }`}>
                        {isPlayingVideo ? '▶ TOCANDO' : '⏸ PAUSADO'}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                        {formatTime(playbackCurrentTime)}
                      </span>
                    </div>
                  </div>

                  {/* Container Iframe do YouTube (Borda Neon Ciano) */}
                  <div className="w-full rounded-2xl overflow-hidden border border-cyan-500/40 bg-zinc-950 aspect-video relative shadow-[0_0_20px_rgba(34,211,238,0.15)] group-hover:border-cyan-500/60 transition-all z-10">
                    {videoIdForPlayback ? (
                      <iframe
                        id="playback-player"
                        src={`https://www.youtube.com/embed/${videoIdForPlayback}?enablejsapi=1&autoplay=0&controls=1&rel=0&modestbranding=0&origin=${encodeURIComponent(window.location.origin)}`}
                        title="YouTube Player"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-mono">
                        Nenhum vídeo carregado
                      </div>
                    )}
                  </div>

                  {/* Barra de Controle de Playback Integrada - Responsiva e Elegante */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 pt-1 relative z-10">
                    <button
                      onClick={togglePlayPauseVideo}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.15)] active:scale-[0.98]"
                    >
                      {isPlayingVideo ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{isPlayingVideo ? 'Pausar Vídeo' : 'Reproduzir Vídeo'}</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => seekVideoBy(-5)}
                        className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-cyan-500/30 text-zinc-200 text-xs font-mono font-bold transition flex items-center justify-center gap-1.5"
                        title="Voltar 5 segundos"
                      >
                        <Rewind className="w-3.5 h-3.5 text-cyan-400" /> -5s
                      </button>

                      <button
                        onClick={() => seekVideoBy(5)}
                        className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-cyan-500/30 text-zinc-200 text-xs font-mono font-bold transition flex items-center justify-center gap-1.5"
                        title="Avançar 5 segundos"
                      >
                        +5s <FastForward className="w-3.5 h-3.5 text-cyan-400" />
                      </button>

                      <button
                        onClick={() => handleSeekToTimestamp(0)}
                        className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-cyan-500/30 text-zinc-300 transition flex items-center justify-center"
                        title="Recomeçar do início"
                      >
                        <RotateCcw className="w-4 h-4 text-cyan-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* TECLADO PRINCIPAL (ACORDE ATIVO - INFERIOR CENTRAL) */}
                <PianoKeyboard
                  idContainer="keyboard-active"
                  parsedChord={activeChordParsed}
                  variant="current"
                  title="Teclado Principal (Acorde Ativo)"
                  subtitle="Exibe as notas em tempo real no instante exato da música"
                  badgeText={activeChordParsed ? `ATIVO: ${activeChordParsed.cifraOriginal}` : 'AGUARDANDO'}
                />

              </section>

              {/* COLUNA DIREITA (5 cols): Monitor + TECLADO DE PREPARAÇÃO (Superior Direito) + Linha do Tempo */}
              <section className="lg:col-span-5 flex flex-col gap-6">
                
                {/* PAINEL DE MONITORAMENTO E PRÓXIMO ACORDE */}
                <div className="bg-zinc-900/40 border border-zinc-800 hover:border-cyan-500/50 transition-colors rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-sans flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Monitor do Playback
                    </h3>
                    <span className="text-xs font-mono text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                      {activeChordIndex >= 0 ? `Nó #${activeChordIndex + 1}` : 'Aguardando'}
                    </span>
                  </div>

                  {/* CARD GRANDE "ACORDE ATUAL" */}
                  <div className="bg-zinc-950 border border-cyan-500/50 rounded-2xl p-4 text-center shadow-[0_0_15px_rgba(34,211,238,0.15)] relative overflow-hidden">
                    <div className="text-[10px] uppercase font-sans font-bold text-cyan-400 mb-0.5 tracking-wider drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                      Acorde Ativo no Momento
                    </div>

                    {activeChordIndex >= 0 && currentSong?.linhaDoTempo[activeChordIndex] ? (
                      <div>
                        <div className="text-4xl sm:text-5xl font-black text-accent font-mono tracking-tight my-1 drop-shadow-[0_0_12px_rgba(0,255,170,0.5)]">
                          {currentSong.linhaDoTempo[activeChordIndex].cifra}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                          Timestamp: <span className="text-cyan-400 font-bold">{currentSong.linhaDoTempo[activeChordIndex].tempo.toFixed(1)}s</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="text-sm font-bold text-zinc-500 font-sans">
                          Inicie o vídeo para visualizar...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* REQUISITO 2: TECLADO DE PREPARAÇÃO INCLUÍDO NA PARTE SUPERIOR DIREITA */}
                  <PianoKeyboard
                    idContainer="keyboard-preparation"
                    parsedChord={nextChordParsed}
                    variant="next"
                    title="Teclado de Preparação (Próximo Acorde)"
                    subtitle="Visualização antecipada do próximo acorde a ser executado"
                    badgeText={nextChordParsed ? `PRÓXIMO: ${nextChordParsed.cifraOriginal}` : 'FIM DA LINHA'}
                  />
                </div>

                {/* PAINEL DE INSIGHTS E IMPROVISAÇÃO IA (TEMPO REAL) */}
                <ChordInsightsPanel
                  cifraOriginal={activeChordParsed?.cifraOriginal || (activeChordIndex >= 0 && currentSong?.linhaDoTempo[activeChordIndex] ? currentSong.linhaDoTempo[activeChordIndex].cifra : (currentSong?.linhaDoTempo[0]?.cifra || null))}
                  onSelectChordForExperiment={handleSelectChordForExperiment}
                  onPlayChordSynth={handlePlayChordSynthFromSymbol}
                  onReharmonizeJazz={handleReharmonizeCurrentSongToJazz}
                  isSongLoaded={!!currentSong && currentSong.linhaDoTempo.length > 0}
                />

                {/* TABELA DA LINHA DO TEMPO */}
                <div className="bg-zinc-900/40 border border-zinc-800 hover:border-cyan-500/50 transition-colors rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm flex-1 flex flex-col min-h-[300px]">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-sans flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Linha do Tempo ({currentSong?.linhaDoTempo.length || 0} acordes)
                    </h3>
                    <span className="text-[10px] text-zinc-500">Clique para ir ao tempo</span>
                  </div>

                  <div className="flex-1 max-h-[380px] overflow-y-auto no-scrollbar space-y-2">
                    {currentSong?.linhaDoTempo.map((item, idx) => {
                      const isActive = idx === activeChordIndex;
                      const isNext = idx === activeChordIndex + 1;

                      return (
                        <div
                          key={idx}
                          onClick={() => handleSeekToTimestamp(item.tempo)}
                          className={`flex items-center justify-between px-3.5 py-2 rounded-xl border font-mono transition cursor-pointer ${
                            isActive
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                              : isNext
                                ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                                : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] text-zinc-500 w-5">#{idx + 1}</span>
                            <span className={`text-sm font-black font-mono ${isActive ? 'text-accent' : isNext ? 'text-purple-400' : 'text-zinc-100'}`}>
                              {item.cifra}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isActive && (
                              <span className="text-[9px] bg-cyan-500 text-zinc-950 font-extrabold px-2 py-0.5 rounded-full uppercase shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                                Ativo
                              </span>
                            )}
                            {isNext && (
                              <span className="text-[9px] bg-purple-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                                Próximo
                              </span>
                            )}
                            <span className="text-xs font-bold text-zinc-400 font-mono">
                              {formatTime(item.tempo)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </section>
            </>
          )}

        </main>
      )}

      {/* --- ABA 2: SINCRONIZAÇÃO AUTOMÁTICA POR IA --- */}
      {activeTab === 'ai_sync' && (
        <main 
          className="flex-1 w-full max-w-[1295px] mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col items-center justify-center"
        >
          <div className="w-full bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-none p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden group my-auto">
            <div className="absolute w-64 h-64 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col items-center text-center gap-2 border-b-2 border-white/10 pb-5 relative z-10">
              <div className="p-2.5 bg-[#0d0d0e] text-accent border border-accent/20">
                <Wand2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-bold text-accent uppercase tracking-widest font-mono">
                  Sincronização_Automática_IA // Espectral
                </h2>
                <p className="text-[10px] sm:text-xs text-zinc-500 font-mono tracking-wide max-w-lg mx-auto uppercase">
                  Mapeamento rítmico automático de acordes por inteligência artificial
                </p>
              </div>
            </div>

            {/* FORMULÁRIO DE ENTRADA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-wider font-mono">
                    1. Nome_da_Musica
                  </label>
                  <input
                    type="text"
                    value={aiTitleInput}
                    onChange={(e) => setAiTitleInput(e.target.value)}
                    placeholder="Ex: Como Zaqueu"
                    className="w-full bg-[#0d0d0e] border border-white/10 rounded-none px-4 py-3 text-xs sm:text-sm text-zinc-100 font-mono focus:outline-none focus:border-accent transition-all placeholder:text-zinc-700 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-wider font-mono">
                    2. Link_do_YouTube
                  </label>
                  <input
                    type="text"
                    value={aiUrlInput}
                    onChange={(e) => setAiUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-[#0d0d0e] border border-white/10 rounded-none px-4 py-3 text-xs sm:text-sm text-zinc-100 font-mono focus:outline-none focus:border-accent transition-all placeholder:text-zinc-700 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-wider font-mono">
                  3. Texto_da_Cifra
                </label>
                <textarea
                  value={aiCifraInput}
                  onChange={(e) => setAiCifraInput(e.target.value)}
                  rows={6}
                  placeholder="Cole aqui a cifra com acordes (ex: C G/B Am F)..."
                  className="w-full bg-[#0d0d0e] border border-white/10 rounded-none p-3.5 text-xs sm:text-sm text-accent font-mono focus:outline-none focus:border-accent transition-all resize-none placeholder:text-zinc-700 min-h-[120px]"
                />
              </div>

            </div>

            {/* BARRA DE PROGRESSO DO LOADER */}
            {isAnalyzingAi && (
              <div className="bg-[#0d0d0e] border border-accent/40 rounded-none p-5 sm:p-6 space-y-3.5 shadow-sm relative z-10 font-mono">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                  <span className="text-accent font-bold flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    Analise_Espectral_Exec
                  </span>
                  <span className="text-zinc-100 font-bold">{aiProgressPercent}%</span>
                </div>

                <div className="w-full h-1.5 bg-zinc-950 rounded-none overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-accent transition-all duration-500 rounded-none"
                    style={{ width: `${aiProgressPercent}%` }}
                  ></div>
                </div>

                <p className="text-[10px] text-zinc-400 text-center uppercase tracking-wide">
                  {aiStatusMessage}
                </p>
              </div>
            )}

            {/* MENSAGEM DE SUCESSO */}
            {aiSuccessResult && !isAnalyzingAi && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-none p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-center sm:text-left font-mono">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs uppercase tracking-wide text-emerald-300">
                    {aiSuccessResult}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('playback')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-none bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs uppercase tracking-wider shadow-md transition shrink-0 min-h-[44px] flex items-center justify-center gap-2"
                >
                  Ir_para_reproducao →
                </button>
              </div>
            )}

            {/* BOTÃO DE AÇÃO */}
            <button
              onClick={analisarMusicaComIA}
              disabled={isAnalyzingAi}
              className={`w-full py-4 px-6 rounded-none font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition relative z-10 min-h-[50px] active:scale-[0.99] border ${
                isAnalyzingAi
                  ? 'bg-zinc-900 text-zinc-600 border-white/5 cursor-not-allowed'
                  : 'bg-accent hover:bg-accent/90 text-zinc-950 border-accent font-black'
              }`}
            >
              {isAnalyzingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando_via_IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Iniciar Sincronização Inteligente por IA</span>
                </>
              )}
            </button>

          </div>

        </main>
      )}

      {/* --- ABA 3: DICIONÁRIO COMPLETO DE ACORDES E FILTROS --- */}
      {activeTab === 'dictionary' && (
        <main 
          className="flex-1 w-full max-w-[1295px] mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col items-center justify-center"
        >
          <div className="w-full space-y-6 my-auto">
            
            {/* SEÇÃO DE FILTROS E BUSCA */}
            <div className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-none p-5 sm:p-7 space-y-5 shadow-sm relative overflow-hidden group">
            <div className="absolute w-64 h-64 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-white/10 pb-4 relative z-10 text-center sm:text-left">
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
                />
              </div>
            </div>

            {/* FILTRO 1: GRUPO DE NOTAS FUNDAMENTAIS */}
            <div className="space-y-3 relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm font-mono uppercase tracking-wider">
                <span className="text-zinc-500 font-bold text-center sm:text-left text-[11px]">1. Nota Fundamental (Tônica):</span>
                <div className="flex items-center justify-center gap-1 bg-[#0d0d0e] p-1 rounded-lg border border-white/10 text-xs">
                  {(['Todas', 'Naturais', 'Acidentes'] as const).map(grp => (
                    <button
                      key={grp}
                      onClick={() => setRootGroupFilter(grp)}
                      className={`px-3 py-1.5 rounded-lg font-bold font-mono text-[10px] uppercase tracking-wider transition min-h-[30px] border ${
                        rootGroupFilter === grp ? 'bg-accent text-zinc-950 border-accent' : 'text-zinc-400 border-transparent hover:text-white'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Notas Fundamentais Ampliados e Centralizados */}
              <div className="flex flex-wrap justify-center gap-2 ml-0 rounded-xl border border-white/10 p-2">
                {filteredRootNotes.map((note) => (
                  <button
                    key={note}
                    onClick={() => setSelectedRoot(note)}
                    className={`w-[85px] h-[42px] rounded-lg text-xs sm:text-sm font-mono font-bold transition border-2 flex items-center justify-center active:scale-[0.97] ${
                      selectedRoot === note
                        ? 'bg-accent text-zinc-950 border-accent shadow-[0_0_12px_rgba(0,255,170,0.3)]'
                        : 'bg-[#0d0d0e] text-zinc-300 border-white/10 hover:border-accent/40 hover:text-accent'
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTRO 2: CATEGORIA DE VARIAÇÃO */}
            <div className="space-y-3 pt-3 border-t border-white/10 relative z-10">
              <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block font-mono text-center sm:text-left">2. Categoria da Variação:</span>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs sm:text-sm font-mono">
                {['Todas', 'Tríades', 'Tétrades & Sétimas', 'Sextas & Nonas', 'Suspensos & Alterados'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition border min-h-[42px] flex items-center justify-center active:scale-[0.97] ${
                      selectedCategoryFilter === cat
                        ? 'bg-accent text-zinc-950 border-accent'
                        : 'bg-[#0d0d0e] text-zinc-300 border-white/10 hover:border-accent/40 hover:text-accent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* BOTÕES DE SELEÇÃO DA VARIAÇÃO */}
            <div className="space-y-3 pt-3 border-t border-white/10 relative z-10">
              <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block font-mono text-center sm:text-left">
                3. Variação Harmônica do Acorde:
              </span>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {filteredVariations.map((varName) => (
                  <button
                    key={varName}
                    onClick={() => setSelectedVariation(varName)}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition border min-h-[42px] flex items-center justify-center active:scale-[0.97] ${
                      selectedVariation === varName
                        ? 'bg-accent text-zinc-950 border-accent shadow-[0_0_12px_rgba(0,255,170,0.3)]'
                        : 'bg-[#0d0d0e] text-zinc-300 border-white/10 hover:border-accent/40 hover:text-accent'
                    }`}
                  >
                    {selectedRoot}{varName}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTRO 3: INVERSÃO DO ACORDE */}
            <div className="space-y-3 pt-3 border-t border-white/10 relative z-10">
              <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block font-mono text-center sm:text-left">4. Inversão do Acorde:</span>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs sm:text-sm font-mono">
                {['Fundamental (0ª)', '1ª Inversão', '2ª Inversão', '3ª Inversão'].map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInversion(idx)}
                    className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition border min-h-[42px] flex items-center justify-center active:scale-[0.97] ${
                      inversion === idx
                        ? 'bg-accent text-zinc-950 border-accent'
                        : 'bg-[#0d0d0e] text-zinc-300 border-white/10 hover:border-accent/40 hover:text-accent'
                    }`}
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
              <div className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-none p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden group">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Acorde Selecionado</span>
                    <h3 className="text-3xl sm:text-4xl font-black text-accent font-mono">
                      {selectedRoot}{selectedVariation}
                      {inversion > 0 && <span className="text-xs text-zinc-400 ml-2 font-mono uppercase font-bold">({inversion}ª Inversão)</span>}
                    </h3>
                  </div>

                  <button
                    onClick={() => playChordSynth(chordNotes)}
                    disabled={isPlayingSynth}
                    className="px-5 py-2.5 sm:py-3 rounded-none bg-accent/10 text-accent border border-accent/30 text-xs font-bold font-mono uppercase tracking-widest hover:bg-accent hover:text-zinc-950 transition-all flex items-center gap-2 active:scale-[0.98] min-h-[44px]"
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
              <div className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-none p-5 sm:p-6 space-y-3.5 shadow-sm relative overflow-hidden group">
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
                      className="flex items-center justify-between px-4 py-2.5 rounded-none bg-[#0d0d0e] border border-white/10 text-xs sm:text-sm font-mono"
                    >
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className={`w-2.5 h-2.5 rounded-none ${note.interval === 0 ? 'bg-accent shadow-[0_0_8px_rgba(0,255,170,0.8)]' : 'bg-[#161617] border border-accent/40'}`}></span>
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
