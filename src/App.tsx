import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AudioWaveform,
  Volume2,
  RefreshCw
} from 'lucide-react';
import chordsData from './data/chords.json';
import { PdfUploader } from './components/PdfUploader';
import { CompactChordDictionary } from './components/CompactChordDictionary';
import { TutorIA } from './components/TutorIA';
import { HarmonicStructureCard } from './components/HarmonicStructureCard';
import { MidiStatusBar } from './components/MidiStatusBar';
import { LiveMidiPianoCard } from './components/LiveMidiPianoCard';
import { PianoKeyboard, ParsedChord, ParsedChordNote } from './components/PianoKeyboard';

type RootNote = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';
type VariationName = keyof typeof chordsData.variacoes;

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const VARIATION_DISPLAY_SUFFIX: Record<string, string> = {
  'Maior': '',
  'm': 'm',
  '7': '7',
  'Maj7': 'Maj7',
  'm7': 'm7',
  'm7b5': 'm7(b5)',
  'Dim / °': 'dim',
  'Aug / +': 'aug',
  'sus4': 'sus4',
  'sus2': 'sus2',
  'add9': 'add9',
  'm6': 'm6',
  '6': '6',
  '9': '9',
  'Maj9': 'Maj9',
  'm9': 'm9',
  '7sus4': '7sus4'
};

export function getNoteNameAndOctave(root: string, interval: number, useFlats: boolean) {
  const scale = useFlats ? NOTES_FLAT : NOTES_SHARP;
  const rootIndex = scale.indexOf(root);
  const semitonesFromC = (rootIndex >= 0 ? rootIndex : 0) + interval;
  const pitchClass = semitonesFromC % 12;
  const octave = 4 + Math.floor(semitonesFromC / 12);
  const noteName = scale[pitchClass];
  const midiNote = 12 * (octave + 1) + pitchClass;
  const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

  return {
    noteName,
    octave,
    midiNote,
    frequency
  };
}

export function parseChordSymbolToNotes(cifra: string): ParsedChord | null {
  if (!cifra || typeof cifra !== 'string') return null;
  const clean = cifra.trim();
  if (!clean) return null;

  const slashParts = clean.split('/');
  const baseChord = slashParts[0].trim();
  const bassNote = slashParts[1] ? slashParts[1].trim() : null;

  const rootMatch = baseChord.match(/^[A-G][b#]?/);
  if (!rootMatch) return null;

  const rootNote = rootMatch[0];
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

export function detectChordsFromMidi(midiNotes: number[]): {
  chordSymbol: string;
  rootNote: string;
  variationStr: string;
  intervals: number[];
  notes: ParsedChordNote[];
  confidence: number;
}[] {
  if (midiNotes.length === 0) return [];

  const uniquePitchClasses = Array.from(new Set(midiNotes.map((n) => n % 12)));
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
        .map((pc) => (pc - rootPc + 12) % 12)
        .sort((a, b) => a - b);

      for (const [varName, intervals] of Object.entries(variacoesMap)) {
        const varIntervalsMod12 = Array.from(new Set(intervals.map((i) => i % 12))).sort((a, b) => a - b);

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
          const isSubset = playedRelIntervals.every((val) => varIntervalsMod12.includes(val));
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

export default function App() {
  // State for Chords Conveyor
  const [companionText, setCompanionText] = useState<string>('C9 D G Em7 C G Am F');
  const [companionChords, setCompanionChords] = useState<string[]>(['C9', 'D', 'G', 'Em7', 'C', 'G', 'Am', 'F']);
  const [companionIndex, setCompanionIndex] = useState<number>(0);
  const [companionUniqueOnly, setCompanionUniqueOnly] = useState<boolean>(false);
  const [showChordInputText, setShowChordInputText] = useState<boolean>(false);

  // State for MIDI Hardware Connection
  const [midiAccess, setMidiAccess] = useState<any>(null);
  const [midiInputs, setMidiInputs] = useState<any[]>([]);
  const [selectedMidiInputId, setSelectedMidiInputId] = useState<string>('');
  const [midiNotesPressed, setMidiNotesPressed] = useState<number[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web MIDI Access
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      navigator
        .requestMIDIAccess()
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
          console.warn('API MIDI não suportada ou permissão negada:', err);
        });
    }
  }, []);

  // Listen to MIDI input messages
  useEffect(() => {
    if (!midiAccess || !selectedMidiInputId) return;
    const input = midiAccess.inputs.get(selectedMidiInputId);
    if (!input) return;

    const handleMidiMessage = (message: any) => {
      const [status, note, velocity] = message.data;
      const command = status & 0xf0;

      if (command === 0x90 && velocity > 0) {
        // Note On
        setMidiNotesPressed((prev) => {
          if (prev.includes(note)) return prev;
          return [...prev, note].sort((a, b) => a - b);
        });
      } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        // Note Off
        setMidiNotesPressed((prev) => prev.filter((n) => n !== note));
      }
    };

    input.onmidimessage = handleMidiMessage;
    return () => {
      input.onmidimessage = null;
    };
  }, [midiAccess, selectedMidiInputId]);

  // Parse typed / loaded chords
  useEffect(() => {
    const chordRegex = /\b[A-G][b#]?(?:maj|min|aug|dim|sus|add|m|M)?\d*(?:\([^)]*\))?(?:\/[A-G][b#]?)?\b/g;
    const matches = companionText.match(chordRegex);
    if (matches && matches.length > 0) {
      setCompanionChords(matches);
      setCompanionIndex((prev) => Math.min(prev, matches.length - 1));
    } else {
      const words = companionText.split(/\s+/).filter((w) => w.trim().length > 0);
      if (words.length > 0) {
        setCompanionChords(words);
        setCompanionIndex((prev) => Math.min(prev, words.length - 1));
      } else {
        setCompanionChords([]);
        setCompanionIndex(0);
      }
    }
  }, [companionText]);

  // Unique chords filter
  const companionDisplayedChords = useMemo(() => {
    if (companionUniqueOnly) {
      const unique: string[] = [];
      companionChords.forEach((c) => {
        if (!unique.includes(c)) {
          unique.push(c);
        }
      });
      return unique;
    }
    return companionChords;
  }, [companionChords, companionUniqueOnly]);

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

  // Match check between played MIDI and target chord
  const isChordMatched = useMemo(() => {
    if (!companionActiveChordParsed || midiNotesPressed.length === 0) return false;
    const requiredPitchClasses = companionActiveChordParsed.notes.map((n) => n.midiNote % 12);
    const playedPitchClasses = midiNotesPressed.map((n) => n % 12);
    if (requiredPitchClasses.length === 0) return false;
    return requiredPitchClasses.every((pc) => playedPitchClasses.includes(pc));
  }, [companionActiveChordParsed, midiNotesPressed]);

  // Synthesizer Web Audio API
  const playChordSynth = (notesToPlay: Array<{ frequency: number }>) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      notesToPlay.forEach((note, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.frequency, now);

        const startTime = now + index * 0.035;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2 / notesToPlay.length, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.2);
      });
    } catch (e) {
      console.error('Erro no sintetizador:', e);
    }
  };

  const handlePlayChordSynthFromSymbol = (symbol: string) => {
    const parsed = parseChordSymbolToNotes(symbol);
    if (parsed && parsed.notes) {
      playChordSynth(parsed.notes);
    }
  };

  // Detected chords from MIDI
  const detectedChords = useMemo(() => {
    return detectChordsFromMidi(midiNotesPressed);
  }, [midiNotesPressed]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [companionDisplayedChords.length]);

  return (
    <div className="min-h-screen bg-[#0A090E] text-[#F4F4F7] flex flex-col font-sans px-[12px] selection:bg-[#0FE49B] selection:text-[#0A090E]">
      {/* 🔹 NAV-BAR (0, 0 | 1440 × 70) */}
      <header className="h-[70px] bg-[#111016] border border-white/10 rounded-[12px] flex items-center px-6 py-[12px] my-[12px] mb-[12px] shadow-lg">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-[16px]">
          {/* Left Brand Area */}
          <div className="flex items-center gap-[10px] sm:gap-[14px] shrink-0 pl-[10px]">
            {/* logo-icon: 32x32, fill #0FE49B, r:8 */}
            <div className="w-[34px] h-[34px] bg-[#0FE49B] rounded-[8px] flex items-center justify-center text-[#0A090E] shrink-0 shadow-[0_0_12px_rgba(15,228,155,0.25)]">
              <AudioWaveform className="w-[18px] h-[18px] stroke-[2.5]" />
            </div>

            {/* Brand Title & Tagline / Badge Container */}
            <div className="flex items-center gap-[8px] sm:gap-[10px]">
              <span className="font-display font-extrabold text-[18px] sm:text-[20px] text-[#F4F4F7] tracking-tight leading-none">
                ChordTrail
              </span>

              {/* badge v0.2.1 */}
              <div className="px-[8px] h-[22px] bg-white/[0.07] border border-white/5 rounded-full flex items-center justify-center font-mono font-semibold text-[10px] sm:text-[11px] text-[#A1A0AE] shrink-0">
                v0.2.1
              </div>
            </div>
          </div>

          {/* Right Navigation Tabs Area */}
          <div className="flex items-center gap-[8px] sm:gap-[12px] shrink-0">
            {/* tab-esteira (ativo) */}
            <div className="px-[8px] mr-[10px] h-[36px] bg-[#0FE49B]/[0.08] border border-[#0FE49B] rounded-[8px] text-[#0FE49B] font-medium text-[12px] sm:text-[13px] flex items-center justify-center gap-[6px] shadow-[0_0_10px_rgba(15,228,155,0.15)] transition-all">
              <span className="w-[6px] h-[6px] rounded-full bg-[#0FE49B] animate-pulse"></span>
              Esteira de Acordes &amp; Harmonia
            </div>
          </div>
        </div>
      </header>

      {/* 🔹 MAIN CONTAINER (1440 × 1257 | HORIZONTAL, gap: 24, pad: 12) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-[8px] flex flex-col lg:flex-row gap-[24px] items-start">
        {/* 🔹 COLUNA ESQUERDA (810px wide, VERTICAL, gap: 20) */}
        <div className="w-full lg:w-[810px] space-y-[20px] shrink-0">
          {/* Card 1 — Tutor Chat */}
          <TutorIA
            activeChord={companionActiveChordSymbol}
            songChords={companionChords}
            onSelectChord={(chord) => setCompanionText(chord)}
            onPlayChord={(chord) => handlePlayChordSynthFromSymbol(chord)}
          />

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

          {/* Card 4 — Acorde Alvo / Piano */}
          {companionActiveChordParsed ? (
            <PianoKeyboard
              idContainer="companion-live-keyboard"
              parsedChord={companionActiveChordParsed}
              variant="current"
              title={`Acorde Alvo / Piano: ${companionActiveChordSymbol}`}
              subtitle="Posicionamento correto das notas e intervalos no teclado"
              badgeText="GUIA DE NOTAS"
              useFlats={['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(companionActiveChordParsed.rootNote)}
            />
          ) : (
            <div className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[20px] text-center font-mono text-[#A1A0AE] text-[13px] shadow-lg">
              Nenhum acorde ativo para visualização no Teclado Guia.
            </div>
          )}
        </div>

        {/* 🔹 COLUNA DIREITA (510px wide, VERTICAL, gap: 20) */}
        <div className="w-full lg:flex-1 lg:max-w-[550px] space-y-[20px]">
          {/* Card 6 — Dicionário Compacto / Variações da Tônica */}
          <CompactChordDictionary
            onSelectChord={(chord) => {
              setCompanionText(chord);
              setCompanionIndex(0);
            }}
            onPlayChordSynth={playChordSynth}
            activeChordSymbol={companionActiveChordSymbol}
          />

          {/* Card 7 — Estrutura Harmônica */}
          <HarmonicStructureCard
            parsedChord={companionActiveChordParsed}
            activeChordSymbol={companionActiveChordSymbol || 'C6'}
            onPlayAll={playChordSynth}
          />
        </div>
      </main>

      {/* 🔹 BOTTOM LIVE PANEL (1440 × 326 | gap: 16) */}
      <footer className="w-full max-w-[1440px] mx-auto px-0 pt-[12px] pb-[24px] space-y-[16px] mt-auto">
        {/* MIDI Status Bar */}
        <MidiStatusBar
          isConnected={midiInputs.length > 0}
          deviceName={midiInputs.find((i) => i.id === selectedMidiInputId)?.name || midiInputs[0]?.name}
          notesPressedCount={midiNotesPressed.length}
          expectedChordSymbol={companionActiveChordParsed?.cifraOriginal || 'C6'}
          detectedChordName={detectedChords[0]?.chordSymbol}
          activeNoteNames={midiNotesPressed.map((m) => NOTES_SHARP[m % 12])}
        />

        {/* Teclado MIDI Ao Vivo */}
        <LiveMidiPianoCard
          isConnected={midiInputs.length > 0}
          activeMidiNotes={midiNotesPressed}
          useFlats={['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(companionActiveChordParsed?.rootNote || 'C')}
        />
      </footer>
    </div>
  );
}
