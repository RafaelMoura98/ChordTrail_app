import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AudioWaveform, Volume2, RefreshCw } from 'lucide-react';
import { PdfUploader } from './components/PdfUploader';
import { ChordsConveyorCard } from './components/ChordsConveyorCard';
import { MidiConnectionCard } from './components/MidiConnectionCard';
import { CompactChordDictionary } from './components/CompactChordDictionary';
import { TutorIA } from './components/TutorIA';
import { HarmonicStructureCard } from './components/HarmonicStructureCard';
import { MidiStatusBar } from './components/MidiStatusBar';
import { LiveMidiPianoCard } from './components/LiveMidiPianoCard';
import { PianoKeyboard } from './components/PianoKeyboard';
import {
  parseChordSymbolToNotes,
  detectChordsFromMidi,
  validatePlayedChordAgainstTarget,
  ParsedChord,
  ParsedChordNote,
  NOTES_CHROMATIC_FLAT,
  NOTES_CHROMATIC_SHARP,
  NOTE_SEMITONES
} from './utils/harmonyEngine';

export default function App() {
  // State for Chords Conveyor
  const [companionText, setCompanionText] = useState<string>('C9 D G Em7 C G Am F');
  const [companionChords, setCompanionChords] = useState<string[]>(['C9', 'D', 'G', 'Em7', 'C', 'G', 'Am', 'F']);
  const [companionIndex, setCompanionIndex] = useState<number>(0);
  const [companionUniqueOnly, setCompanionUniqueOnly] = useState<boolean>(false);

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
    const chordRegex = /\b[A-G][b#♯♭]?(?:maj|min|aug|dim|sus|add|m|M)?\d*(?:\([^)]*\))?(?:\/[A-G][b#♯♭]?)?\b/g;
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

  // Match check between played MIDI and target chord (with accurate Inversion awareness)
  const chordMatchEvaluation = useMemo(() => {
    if (!companionActiveChordParsed || midiNotesPressed.length === 0) {
      return { isMatched: false, isExactInversion: false, details: '' };
    }
    return validatePlayedChordAgainstTarget(companionActiveChordParsed, midiNotesPressed);
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
        gain.gain.linearRampToValueAtTime(0.25 / notesToPlay.length, startTime + 0.05);
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

  const playSingleNoteSynth = (frequency: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.0);
    } catch (e) {
      console.error('Erro ao tocar nota individual:', e);
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
    <div className="min-h-screen bg-[#0A090E] text-[#F4F4F7] flex flex-col font-sans px-4 sm:px-6 md:px-8 xl:px-12 py-4 sm:py-6 selection:bg-[#0FE49B] selection:text-[#0A090E]">
      {/* 🔹 NAV-BAR (1440 × 70 | bg: #111016, border: white/7%, r:12) */}
      <header className="h-[70px] bg-[#111016] border border-white/[0.07] rounded-[14px] flex items-center px-6 mb-6 shadow-lg max-w-[1360px] w-full mx-auto">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left Brand Area */}
          <div className="flex items-center gap-3 shrink-0">
            {/* logo-icon: 32x32, fill #0FE49B, r:8 */}
            <div className="w-[32px] h-[32px] bg-[#0FE49B] rounded-[8px] flex items-center justify-center text-[#0A090E] shrink-0 shadow-[0_0_12px_rgba(15,228,155,0.3)]">
              <AudioWaveform className="w-[18px] h-[18px] stroke-[2.5]" />
            </div>

            {/* Brand Title & Badge Container */}
            <div className="flex items-center gap-2.5">
              <span className="font-display font-extrabold text-[20px] text-[#F4F4F7] tracking-[-0.5px] leading-none">
                ChordTrail
              </span>

              {/* badge v0.2.1: 60 × 22 | fill: white @ 7%, r:11 */}
              <div className="w-[60px] h-[22px] bg-white/[0.07] border border-white/[0.07] rounded-full flex items-center justify-center font-mono font-semibold text-[11px] text-[#A1A0AE] shrink-0">
                v0.2.1
              </div>
            </div>
          </div>

          {/* Right Navigation Tabs Area */}
          <div className="flex items-center gap-2 shrink-0">
            {/* tab-esteira (ativo) */}
            <div className="px-3.5 h-[34px] bg-[#0FE49B]/[0.08] border border-[#0FE49B] rounded-[8px] text-[#0FE49B] font-sans font-medium text-[13px] flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(15,228,155,0.15)] transition-all">
              <span className="w-[6px] h-[6px] rounded-full bg-[#0FE49B] animate-pulse"></span>
              Esteira de Acordes &amp; Harmonia Teórica
            </div>
          </div>
        </div>
      </header>

      {/* 🔹 MAIN CONTAINER (Grid responsiva fluida: 7 cols esquerda + 5 cols direita em telas grandes) */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 🔹 COLUNA ESQUERDA (lg:col-span-7) */}
        <div className="w-full lg:col-span-7 space-y-6">
          {/* Card 1 — TutorIA */}
          <TutorIA
            activeChord={companionActiveChordSymbol}
            songChords={companionChords}
            onSelectChord={(chord) => setCompanionText(chord)}
            onPlayChord={(chord) => handlePlayChordSynthFromSymbol(chord)}
          />

          {/* Card 2 — Upload de Cifra // PDF */}
          <PdfUploader
            onChordsExtracted={(newChords) => {
              setCompanionText(newChords);
              setCompanionIndex(0);
            }}
          />

          {/* Card 3 — Esteira de Acordes // Progressão */}
          <ChordsConveyorCard
            companionText={companionText}
            setCompanionText={setCompanionText}
            companionIndex={companionIndex}
            setCompanionIndex={setCompanionIndex}
            companionChords={companionChords}
            companionDisplayedChords={companionDisplayedChords}
            companionUniqueOnly={companionUniqueOnly}
            setCompanionUniqueOnly={setCompanionUniqueOnly}
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
              subtitle={
                companionActiveChordParsed.inversion && companionActiveChordParsed.inversion.type !== 'root'
                  ? `Posicionamento harmônico com ${companionActiveChordParsed.inversion.name} (Baixo em ${companionActiveChordParsed.bassNote})`
                  : 'Posicionamento correto das notas fundamentais e extensões no teclado'
              }
              badgeText={
                companionActiveChordParsed.inversion && companionActiveChordParsed.inversion.type !== 'root'
                  ? 'INVERSÃO ATIVA'
                  : 'GUIA DE NOTAS'
              }
              useFlats={['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'F'].includes(companionActiveChordParsed.rootNote)}
            />
          ) : (
            <div className="w-full bg-[#16141D] border border-white/[0.07] rounded-[16px] p-6 text-center font-mono text-[#A1A0AE] text-[13px] shadow-lg">
              Nenhum acorde ativo para visualização no Teclado Guia.
            </div>
          )}
        </div>

        {/* 🔹 COLUNA DIREITA (lg:col-span-5) */}
        <div className="w-full lg:col-span-5 space-y-6">
          {/* Card 5 — Conexão MIDI Hardware */}
          <MidiConnectionCard
            midiAccess={midiAccess}
            midiInputs={midiInputs}
            selectedMidiInputId={selectedMidiInputId}
            setSelectedMidiInputId={setSelectedMidiInputId}
            midiNotesPressed={midiNotesPressed}
          />

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
            onPlayNote={playSingleNoteSynth}
            onPlayAll={playChordSynth}
          />
        </div>
      </main>

      {/* 🔹 BOTTOM LIVE PANEL (1360px wide) */}
      <footer className="w-full max-w-[1360px] mx-auto px-0 pt-6 pb-10 space-y-4 mt-auto">
        {/* Card 8 — MIDI Status Bar */}
        <MidiStatusBar
          isConnected={midiInputs.length > 0}
          deviceName={midiInputs.find((i) => i.id === selectedMidiInputId)?.name || midiInputs[0]?.name}
          notesPressedCount={midiNotesPressed.length}
          expectedChordSymbol={companionActiveChordParsed?.cifraOriginal || 'C6'}
          detectedChordName={detectedChords[0]?.chordSymbol}
          activeNoteNames={midiNotesPressed.map((m) => NOTES_CHROMATIC_SHARP[m % 12])}
        />

        {/* Card 9 — Teclado MIDI Ao Vivo */}
        <LiveMidiPianoCard
          isConnected={midiInputs.length > 0}
          activeMidiNotes={midiNotesPressed}
          useFlats={['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'F'].includes(companionActiveChordParsed?.rootNote || 'C')}
        />
      </footer>
    </div>
  );
}
