import React from 'react';
import { Layers, Volume2, Play, Music, Sparkles } from 'lucide-react';
import {
  ParsedChord,
  ParsedChordNote,
  THEORETICAL_FULL_NAMES,
  INTERVAL_DESCRIPTIONS,
  parseChordSymbolToNotes
} from '../utils/harmonyEngine';

let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

interface HarmonicStructureCardProps {
  parsedChord: ParsedChord | null;
  activeChordSymbol?: string;
  onPlayNote?: (frequency: number) => void;
  onPlayAll?: (notes: { frequency: number }[]) => void;
}

export function HarmonicStructureCard({
  parsedChord,
  activeChordSymbol = 'C6',
  onPlayNote,
  onPlayAll
}: HarmonicStructureCardProps) {
  const currentParsed = parsedChord || parseChordSymbolToNotes(activeChordSymbol) || parseChordSymbolToNotes('C6');
  const currentSymbol = currentParsed?.cifraOriginal || activeChordSymbol || 'C6';
  const variationStr = currentParsed?.variationStr ?? '6';
  const notes = currentParsed?.notes || [];

  const baseTheoreticalName =
    THEORETICAL_FULL_NAMES[variationStr] ||
    THEORETICAL_FULL_NAMES[currentSymbol.replace(/^[A-G][#b]?/, '')] ||
    'Acorde Harmônico Estruturado';

  const inversionInfo = currentParsed?.inversion;
  const theoreticalFullName = inversionInfo && inversionInfo.type !== 'root'
    ? `${baseTheoreticalName} — ${inversionInfo.name}`
    : baseTheoreticalName;

  const handleSoundNote = (freq: number) => {
    if (onPlayNote) {
      onPlayNote(freq);
    } else {
      try {
        const ctx = getSharedAudioContext();
        if (ctx) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
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
    <div className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-6 sm:p-7 shadow-lg relative overflow-hidden space-y-5">
      {/* 🔹 Header: Título "Estrutura Harmônica" */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-tight">
            Estrutura Harmônica
          </h3>
          {/* 🔹 Subtítulo teórico */}
          <p className="font-sans text-[13px] leading-normal mt-1.5">
            <span className="font-bold text-[#F4F4F7]">Nome Teórico: </span>
            <span className="font-normal text-[#A1A0AE]">{theoreticalFullName}</span>
          </p>
        </div>

        <button
          onClick={handlePlayFullChord}
          className="h-[28px] px-2.5 rounded-[6px] bg-white/[0.03] hover:bg-[#0FE49B]/10 border border-[#0FE49B] text-[#0FE49B] font-mono text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          title="Ouvir acorde completo"
        >
          <Volume2 className="w-[13px] h-[13px]" />
          <span>Ouvir</span>
        </button>
      </div>

      {/* Inversion Banner se houver baixo/inversão */}
      {inversionInfo && inversionInfo.type !== 'root' && (
        <div className="w-full py-1.5 px-3 rounded-[8px] bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-between text-[11px]">
          <span className="font-sans font-medium text-[#38BDF8]">
            {inversionInfo.name}
          </span>
          <span className="font-mono text-[#A1A0AE]">
            {inversionInfo.description}
          </span>
        </div>
      )}

      {/* 🔹 Notas da estrutura */}
      <div className="w-full space-y-1.5 pt-1">
        {notes.map((note, idx) => {
          const intervalInfo = INTERVAL_DESCRIPTIONS[note.interval] || {
            name: `Intervalo +${note.interval} st`,
            short: `+${note.interval}`,
            role: 'Extensão'
          };
          const isRoot = note.interval === 0 && !note.isBass;
          const isBass = note.isBass;

          return (
            <div
              key={idx}
              className="w-full h-[42px] rounded-[8px] px-3.5 bg-white/[0.027] border border-white/[0.07] hover:border-white/20 hover:bg-white/[0.05] transition-all flex items-center justify-between group"
            >
              {/* Esquerda: Indicador circular + Nome da Nota e Tônica/Baixo */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0 ${
                    isBass && currentParsed?.bassNote && currentParsed?.bassNote !== currentParsed?.rootNote
                      ? 'bg-[#38BDF8]'
                      : isRoot
                      ? 'bg-[#0FE49B]'
                      : 'border border-[#0FE49B]/60 bg-[#0FE49B]/10'
                  }`}
                />

                <span
                  className={`font-display font-bold text-[14px] leading-none ${
                    isBass && currentParsed?.bassNote && currentParsed?.bassNote !== currentParsed?.rootNote
                      ? 'text-[#38BDF8]'
                      : isRoot
                      ? 'text-[#0FE49B]'
                      : 'text-[#F4F4F7]'
                  }`}
                >
                  {note.noteName}
                  <span className="text-[10px] text-[#A1A0AE] font-mono font-normal ml-0.5">
                    {note.octave}
                  </span>
                </span>

                <span className="font-sans font-normal text-[12px] text-[#A1A0AE] truncate">
                  {note.label || intervalInfo.name}
                </span>
              </div>

              {/* Direita: Intervalo / Semitons / Botão de Play */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold border ${
                  isBass && currentParsed?.bassNote && currentParsed?.bassNote !== currentParsed?.rootNote
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/30'
                    : 'bg-black/40 text-[#A1A0AE] border-white/5'
                }`}>
                  {isBass && currentParsed?.bassNote && currentParsed?.bassNote !== currentParsed?.rootNote
                    ? `Baixo ${note.noteName}`
                    : intervalInfo.short}
                </span>

                <span className="font-mono text-[10px] text-[#6D6B7D] hidden sm:inline">
                  {note.frequency.toFixed(1)} Hz
                </span>

                <button
                  onClick={() => handleSoundNote(note.frequency)}
                  className="w-[28px] h-[28px] rounded-[6px] bg-white/[0.05] hover:bg-[#0FE49B] hover:text-[#0A090E] text-[#A1A0AE] transition-all flex items-center justify-center cursor-pointer"
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
