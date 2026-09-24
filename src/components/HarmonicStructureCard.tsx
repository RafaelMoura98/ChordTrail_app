import React from 'react';
import { Layers, Volume2, Play, Music, Sparkles } from 'lucide-react';
import { ParsedChord, ParsedChordNote } from './PianoKeyboard';
import chordsData from '../data/chords.json';

interface HarmonicStructureCardProps {
  parsedChord: ParsedChord | null;
  activeChordSymbol?: string;
  onPlayNote?: (frequency: number) => void;
  onPlayAll?: (notes: { frequency: number }[]) => void;
}

const THEORETICAL_FULL_NAMES: Record<string, string> = {
  '': 'ACORDE MAIOR (TRÍADE)',
  'Maior': 'ACORDE MAIOR (TRÍADE)',
  'M': 'ACORDE MAIOR (TRÍADE)',
  'm': 'ACORDE MENOR (TRÍADE)',
  '7': 'ACORDE DOMINANTE COM SÉTIMA MENOR',
  'Maj7': 'ACORDE MAIOR COM SÉTIMA MAIOR (7M)',
  '7M': 'ACORDE MAIOR COM SÉTIMA MAIOR',
  'm7': 'ACORDE MENOR COM SÉTIMA MENOR',
  'm7b5': 'ACORDE MEIO-DIMINUTO (m7♭5)',
  'm7(♭5) / ø': 'ACORDE MEIO-DIMINUTO (m7♭5)',
  'Dim / °': 'ACORDE DIMINUTO',
  'Dim7 / °7': 'ACORDE DIMINUTO COM SÉTIMA',
  'Aug / +': 'ACORDE AUMENTADO',
  'sus4': 'ACORDE SUSPENSO DE QUARTA',
  'sus2': 'ACORDE SUSPENSO DE SEGUNDA',
  '6': 'ACORDE MAIOR COM SEXTA',
  'm6': 'ACORDE MENOR COM SEXTA',
  'add9': 'ACORDE COM NONA ADICIONADA',
  '9': 'ACORDE DOMINANTE COM NONA MAIOR',
  'Maj9': 'ACORDE MAIOR COM NONA MAIOR',
  'm9': 'ACORDE MENOR COM NONA',
  '7sus4': 'ACORDE COM SÉTIMA E QUARTA SUSPENSA',
  '6/9': 'ACORDE COM SEXTA E NONA ADICIONADA'
};

const INTERVAL_DESCRIPTIONS: Record<number, { name: string; short: string; role: string }> = {
  0: { name: 'Tônica Fundamental', short: '1P', role: 'Raiz' },
  1: { name: 'Segunda Menor', short: '2m', role: 'Tensão b9' },
  2: { name: 'Segunda Maior', short: '2M', role: 'Tensão 9' },
  3: { name: 'Terça Menor', short: '3m', role: 'Modo Menor' },
  4: { name: 'Terça Maior', short: '3M', role: 'Modo Maior' },
  5: { name: 'Quarta Justa', short: '4J', role: 'Suspensão 4' },
  6: { name: 'Quinta Diminuta / Trítono', short: '5d', role: 'Tensão b5' },
  7: { name: 'Quinta Justa', short: '5J', role: 'Estabilidade' },
  8: { name: 'Quinta Aumentada / Sexta Menor', short: '5A', role: 'Tensão #5' },
  9: { name: 'Sexta Maior', short: '6M', role: 'Consonância 6' },
  10: { name: 'Sétima Menor', short: '7m', role: 'Dominante' },
  11: { name: 'Sétima Maior', short: '7M', role: 'Sensível 7M' },
  12: { name: 'Oitava Justa', short: '8P', role: 'Dobro' },
  13: { name: 'Nona Menor', short: 'b9', role: 'Tensão Alterada' },
  14: { name: 'Nona Maior', short: '9', role: 'Extensão Natural' },
  15: { name: 'Nona Aumentada', short: '#9', role: 'Tensão Blues' },
  17: { name: 'Décima Primeira Justa', short: '11', role: 'Extensão 11' },
  18: { name: 'Décima Primeira Aumentada', short: '#11', role: 'Lídio' },
  21: { name: 'Décima Terceira Maior', short: '13', role: 'Extensão 13' }
};

export function HarmonicStructureCard({
  parsedChord,
  activeChordSymbol = 'C6',
  onPlayNote,
  onPlayAll
}: HarmonicStructureCardProps) {
  // Default fallback if no active chord is currently parsed (e.g. C6 as in prompt)
  const defaultNotes: ParsedChordNote[] = [
    { noteName: 'C', octave: 4, midiNote: 60, frequency: 261.63, interval: 0, label: 'Tônica' },
    { noteName: 'E', octave: 4, midiNote: 64, frequency: 329.63, interval: 4, label: '3ª Maior' },
    { noteName: 'G', octave: 4, midiNote: 67, frequency: 392.00, interval: 7, label: '5ª Justa' },
    { noteName: 'A', octave: 4, midiNote: 69, frequency: 440.00, interval: 9, label: '6ª Maior' }
  ];

  const notes = parsedChord && parsedChord.notes.length > 0 ? parsedChord.notes : defaultNotes;
  const currentSymbol = parsedChord?.cifraOriginal || activeChordSymbol || 'C6';
  const variationStr = parsedChord?.variationStr ?? '6';

  const theoreticalName =
    THEORETICAL_FULL_NAMES[variationStr] ||
    (THEORETICAL_FULL_NAMES[currentSymbol.replace(/^[A-G][#b]?/, '')] || 'ACORDE HARMÔNICO');

  const handleSoundNote = (freq: number) => {
    if (onPlayNote) {
      onPlayNote(freq);
    } else {
      // Direct Web Audio Synth fallback
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        }
      } catch (err) {
        console.error('Audio error:', err);
      }
    }
  };

  const handlePlayFullChord = () => {
    if (onPlayAll) {
      onPlayAll(notes.map((n) => ({ frequency: n.frequency })));
    } else {
      notes.forEach((n) => handleSoundNote(n.frequency));
    }
  };

  return (
    <div className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[20px] sm:p-[24px] shadow-lg relative overflow-hidden space-y-[16px]">
      {/* 🔹 Header: Título "Estrutura Harmônica" (910, 1049 | 470 × 23 | Outfit SemiBold 18px) */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-[23px]">
            Estrutura Harmônica
          </h3>
          {/* 🔹 Subtítulo teórico (910, 1076 | 470 × 17 | Geist Bold 13px + Regular 13px) */}
          <p className="font-sans text-[13px] leading-[17px] mt-[4px]">
            <span className="font-bold text-[#F4F4F7]">Nome Teórico: </span>
            <span className="font-normal text-[#A1A0AE]">{theoreticalName}</span>
          </p>
        </div>

        <button
          onClick={handlePlayFullChord}
          className="h-[28px] px-[10px] rounded-[6px] bg-white/[0.03] hover:bg-[#0FE49B]/10 border border-[#0FE49B] text-[#0FE49B] font-mono text-[11px] font-semibold transition-all flex items-center gap-[6px] cursor-pointer"
          title="Ouvir acorde completo"
        >
          <Volume2 className="w-[13px] h-[13px]" />
          <span>Ouvir</span>
        </button>
      </div>

      {/* 🔹 Notas da estrutura (×4) (910, 1113 | 470 × 38 cada | gap:4, mesmo estilo das variações) */}
      <div className="w-full space-y-[4px] pt-1">
        {notes.map((note, idx) => {
          const intervalInfo = INTERVAL_DESCRIPTIONS[note.interval] || {
            name: `Intervalo +${note.interval} st`,
            short: `+${note.interval}`,
            role: 'Extensão'
          };
          const isRoot = note.interval === 0;

          return (
            <div
              key={idx}
              className="w-full h-[38px] rounded-[8px] px-[12px] bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] transition-all flex items-center justify-between group"
            >
              {/* Esquerda: Nome da Nota e Tônica */}
              <div className="flex items-center gap-[10px] min-w-0">
                <span
                  className={`font-display font-bold text-[14px] ${
                    isRoot ? 'text-[#0FE49B]' : 'text-[#F4F4F7]'
                  }`}
                >
                  {note.noteName}
                  <span className="text-[10px] text-[#A1A0AE] font-mono font-normal ml-0.5">
                    {note.octave}
                  </span>
                </span>

                <span className="font-sans font-normal text-[12px] text-[#A1A0AE] truncate">
                  {intervalInfo.name}
                </span>
              </div>

              {/* Direita: Intervalo / Semitons / Botão de Play */}
              <div className="flex items-center gap-[8px] shrink-0">
                <span className="px-[6px] py-[2px] rounded-[4px] bg-black/40 text-[10px] font-mono font-bold text-[#A1A0AE] border border-white/5">
                  {intervalInfo.short}
                </span>

                <span className="font-mono text-[10px] text-[#6D6B7D] hidden sm:inline">
                  {note.frequency.toFixed(1)} Hz
                </span>

                <button
                  onClick={() => handleSoundNote(note.frequency)}
                  className="w-[26px] h-[26px] rounded-[6px] bg-white/[0.05] hover:bg-[#0FE49B] hover:text-[#0A090E] text-[#A1A0AE] transition-all flex items-center justify-center cursor-pointer"
                  title={`Tocar nota ${note.noteName}${note.octave}`}
                >
                  <Play className="w-[11px] h-[11px] fill-current" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
