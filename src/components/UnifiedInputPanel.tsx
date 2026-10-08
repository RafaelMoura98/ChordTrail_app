import React from 'react';
import { Cpu, Info, Volume2 } from 'lucide-react';

interface UnifiedInputPanelProps {
  midiAccess: any;
  midiInputs: any[];
  selectedMidiInputId: string;
  setSelectedMidiInputId: (id: string) => void;
  midiNotesPressed: number[];
  detectedChords: any[];
  handlePlayChordSynthFromSymbol?: (symbol: string) => void;
}

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function UnifiedInputPanel({
  midiAccess,
  midiInputs,
  selectedMidiInputId,
  setSelectedMidiInputId,
  midiNotesPressed,
  detectedChords,
  handlePlayChordSynthFromSymbol
}: UnifiedInputPanelProps) {
  return (
    <div className="bg-[#12111A] border border-white/10 hover:border-accent/30 transition-all rounded-2xl p-4 sm:p-5 space-y-4 relative overflow-hidden shadow-lg group">
      <div className="absolute w-40 h-40 -top-10 -right-10 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#0A090E] text-accent border border-accent/20 rounded-xl shadow-[0_0_10px_rgba(15,228,155,0.15)]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 font-display uppercase tracking-wider">
              Conexão Hardware // MIDI
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono">
              Controladores USB e detecção harmônica
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase">
          {midiInputs.length > 0 ? (
            <span className="flex items-center gap-1 text-accent font-bold bg-accent/10 border border-accent/30 px-2.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(15,228,155,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Online ({midiInputs.length})
            </span>
          ) : (
            <span className="flex items-center gap-1 text-zinc-500 font-medium bg-[#0A090E] border border-white/5 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-3.5">
        {typeof navigator !== 'undefined' && !('requestMIDIAccess' in navigator) ? (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]">
              ⚠️ API MIDI Incompatível
            </p>
            <p className="leading-relaxed text-zinc-400 text-[10px]">
              Seu navegador não suporta a API de MIDI Web. Recomendamos usar o Google Chrome ou Edge.
            </p>
          </div>
        ) : midiInputs.length === 0 ? (
          <div className="p-3 bg-[#0A090E] border border-white/5 text-zinc-400 rounded-xl text-xs space-y-1">
            <p className="font-bold uppercase font-mono tracking-wider text-zinc-300 text-[11px] flex items-center gap-1.5">
              🔌 Nenhum teclado MIDI detectado
            </p>
            <p className="leading-relaxed text-zinc-500 text-[10px]">
              Conecte seu controlador via USB. Ao tocar, as notas acendem automaticamente na tela.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5 tracking-wider font-mono">
                  Dispositivo Ativo
                </label>
                <select
                  value={selectedMidiInputId}
                  onChange={(e) => setSelectedMidiInputId(e.target.value)}
                  className="w-full bg-[#0A090E] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-accent transition-all cursor-pointer"
                >
                  {midiInputs.map((input) => (
                    <option key={input.id} value={input.id} className="bg-[#12111A]">
                      {input.name || `MIDI (${input.id})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5 tracking-wider font-mono">
                  Notas Físicas Ativas
                </label>
                <div className="w-full bg-[#0A090E] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-accent font-mono min-h-[38px] flex items-center gap-1 flex-wrap">
                  {midiNotesPressed.length === 0 ? (
                    <span className="text-zinc-600 text-[10px] font-mono">Aguardando teclas...</span>
                  ) : (
                    midiNotesPressed.map((midiNote) => {
                      const pitchClass = midiNote % 12;
                      const noteName = NOTES_SHARP[pitchClass];
                      const octave = Math.floor(midiNote / 12) - 1;
                      return (
                        <span
                          key={midiNote}
                          className="bg-accent/15 border border-accent/30 text-accent font-bold px-1.5 py-0.5 rounded text-[10px] shadow-[0_0_6px_rgba(15,228,155,0.2)]"
                        >
                          {noteName}{octave}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Live Chord Detection from MIDI */}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                Detecção Harmônica em Tempo Real
              </span>

              {midiNotesPressed.length === 0 ? (
                <div className="py-4 text-center text-zinc-600 font-mono text-[11px] border border-dashed border-white/10 rounded-xl bg-[#0A090E]/50">
                  Toque notas no teclado físico para identificar o acorde
                </div>
              ) : detectedChords.length === 0 ? (
                <div className="py-3 text-center text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 text-xs font-mono">
                  <Info className="w-3.5 h-3.5" />
                  <span>Estrutura de acorde não identificada</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {detectedChords.slice(0, 2).map((match, idx) => {
                    const isPerfect = match.confidence === 100;
                    const chordSymbol = match.chordSymbol || match.name;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 border rounded-xl flex flex-col justify-between gap-1.5 transition-all ${
                          isPerfect
                            ? 'bg-accent/10 border-accent/40 text-accent shadow-[0_0_8px_rgba(15,228,155,0.15)]'
                            : 'bg-[#0A090E] border-white/10 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black font-display tracking-wide">{chordSymbol}</span>
                          <span
                            className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                              isPerfect ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {match.confidence}%
                          </span>
                        </div>
                        {handlePlayChordSynthFromSymbol && (
                          <button
                            onClick={() => handlePlayChordSynthFromSymbol(chordSymbol)}
                            className="w-full text-[9px] font-mono py-1 rounded bg-[#16141D] border border-white/5 hover:border-accent hover:text-accent transition-all text-center text-zinc-400 uppercase flex items-center justify-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Ouvir</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

