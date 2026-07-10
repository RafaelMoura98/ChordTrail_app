import React from 'react';
import { Keyboard, Cpu, Info } from 'lucide-react';

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
    <div className="pl-[4px] pr-[4px] pt-[4px] pb-[4px]">
      <div 
        style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '12px', paddingBottom: '12px', marginLeft: '12px', marginRight: '12px', marginTop: '12px', marginBottom: '12px' }}
        className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-xl pl-[12px] pr-[12px] pt-[12px] pb-[12px] mt-0 space-y-5 relative overflow-hidden group shadow-sm"
      >
        <div className="absolute w-48 h-48 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0d0d0e] text-accent border border-accent/20 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div style={{ paddingLeft: '6px', paddingRight: '6px', paddingTop: '3px', paddingBottom: '3px', marginLeft: '0px', marginRight: '0px', marginTop: '0px' }}>
              <h3 
                style={{ marginTop: '8px', marginBottom: '8px', paddingTop: '6px', paddingBottom: '6px' }}
                className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono"
              >
                Conexão Hardware // MIDI
              </h3>
              <p 
                style={{ paddingTop: '4px', paddingBottom: '4px', marginTop: '2px', marginBottom: '8px', paddingLeft: '1px' }}
                className="text-[10px] sm:text-xs text-zinc-500 font-mono uppercase tracking-wide"
              >
                Conecte seu teclado ou controlador musical via USB
              </p>
            </div>
          </div>
        </div>

        {/* Render Panel Content (MIDI ONLY) */}
        <div className="relative z-10">
          <div className="space-y-4 animate-fade-in">
            {typeof navigator !== 'undefined' && !('requestMIDIAccess' in navigator) ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs space-y-1.5">
                <p className="font-bold flex items-center gap-2 uppercase font-mono tracking-wider">
                  ⚠️ API MIDI Incompatível
                </p>
                <p className="leading-relaxed text-zinc-400">
                  Seu navegador não suporta a API de MIDI Web. Use o <strong>Google Chrome</strong> ou <strong>Edge</strong> para conectar seu teclado físico.
                </p>
              </div>
            ) : midiInputs.length === 0 ? (
              <div className="p-4 bg-[#0d0d0e] border border-white/5 text-zinc-400 rounded-xl text-xs space-y-1.5">
                <p className="font-bold uppercase font-mono tracking-wider text-zinc-300 flex items-center gap-2">
                  🔌 Nenhum teclado MIDI detectado
                </p>
                <p className="leading-relaxed text-zinc-500">
                  Conecte seu teclado controlador no computador usando um cabo USB/MIDI e certifique-se de que esteja ligado para acender as teclas virtuais!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="pl-[2px] pr-[2px] pt-[2px] pb-[2px]">
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-wider font-mono">
                      Hardware MIDI Ativo
                    </label>
                    <select
                      value={selectedMidiInputId}
                      onChange={(e) => setSelectedMidiInputId(e.target.value)}
                      className="w-full bg-[#0d0d0e] border border-white/10 rounded-[8px] pl-[10px] pr-[10px] pt-[8px] pb-[8px] text-xs text-zinc-200 font-mono focus:outline-none focus:border-accent cursor-pointer"
                    >
                      {midiInputs.map((input) => (
                        <option key={input.id} value={input.id} className="bg-[#161617]">
                          {input.name || `Dispositivo MIDI (${input.id})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-wider font-mono">
                      Notas Pressionadas
                    </label>
                    <div className="w-full bg-[#0d0d0e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-accent font-mono min-h-[42px] flex items-center gap-1.5 flex-wrap">
                      {midiNotesPressed.length === 0 ? (
                        <span className="text-zinc-600 uppercase text-[10px]">Aguardando teclas...</span>
                      ) : (
                        midiNotesPressed.map((midiNote) => {
                          const pitchClass = midiNote % 12;
                          const noteName = NOTES_SHARP[pitchClass];
                          const octave = Math.floor(midiNote / 12) - 1;
                          return (
                            <span key={midiNote} className="bg-accent/15 border border-accent/30 text-accent font-bold px-1.5 py-0.5 rounded text-[10px] drop-shadow-[0_0_5px_rgba(0,255,170,0.1)]">
                              {noteName}{octave}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Real-time MIDI Chord Detector */}
                <div className="border-t border-zinc-800 pt-4 space-y-3">
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
                    Análise Harmônica das Teclas Pressionadas
                  </span>

                  {midiNotesPressed.length === 0 ? (
                    <div className="py-6 text-center text-zinc-600 font-mono text-xs border border-dashed border-zinc-800 rounded-xl">
                      Toque acordes físicos no controlador para identificá-los em tempo real
                    </div>
                  ) : detectedChords.length === 0 ? (
                    <div className="py-6 text-center text-amber-500/70 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-center gap-2 text-xs">
                      <Info className="w-4 h-4" />
                      <span>Estrutura de acorde não identificada</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {detectedChords.slice(0, 2).map((match, idx) => {
                        const isPerfect = match.confidence === 100;
                        return (
                          <div
                            key={idx}
                            className={`p-3 border rounded-xl flex flex-col justify-between gap-2 transition-all ${
                              isPerfect
                                ? 'bg-accent/10 border-accent/30 text-accent shadow-[0_0_8px_rgba(0,255,170,0.1)]'
                                : 'bg-[#0d0d0e] border-white/5 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-sm font-black font-mono tracking-wide">{match.name}</span>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                                isPerfect ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {match.confidence}%
                              </span>
                            </div>
                            {handlePlayChordSynthFromSymbol && (
                              <button
                                onClick={() => handlePlayChordSynthFromSymbol(match.name)}
                                className="w-full text-[9px] font-mono py-1 rounded bg-zinc-900 border border-white/5 hover:border-accent hover:text-zinc-950 hover:font-bold transition-all text-center text-zinc-400 uppercase"
                              >
                                Ouvir Acorde
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
      </div>
    </div>
  );
}
