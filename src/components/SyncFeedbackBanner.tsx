import React, { useState, useEffect } from 'react';
import { Check, Music, Activity } from 'lucide-react';

interface SyncFeedbackBannerProps {
  isChordMatched: boolean;
  midiNotesPressed: number[];
  activeChordSymbol: string;
  style?: React.CSSProperties;
}

export function SyncFeedbackBanner({
  isChordMatched,
  midiNotesPressed,
  activeChordSymbol,
  style
}: SyncFeedbackBannerProps) {
  // Estado persistente para manter a tela de sucesso ("Sintonia Ativa") visível por mais tempo de forma fluida
  const [delayedMatched, setDelayedMatched] = useState(false);

  useEffect(() => {
    if (isChordMatched) {
      setDelayedMatched(true);
    } else {
      const timer = setTimeout(() => {
        setDelayedMatched(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isChordMatched]);

  const hasMidi = midiNotesPressed.length > 0;

  // Classes de estilo baseadas no estado
  let bgClass = "bg-[#12111A] border-white/10 text-zinc-400";
  if (delayedMatched) {
    bgClass = "bg-[#06291C]/80 border-accent text-accent shadow-[0_0_20px_rgba(15,228,155,0.2)]";
  } else if (hasMidi) {
    bgClass = "bg-[#151221] border-purple-500/30 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)]";
  }

  return (
    <div
      style={style}
      className={`w-full border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between transition-all duration-300 relative overflow-hidden group ${bgClass}`}
    >
      {/* Background Pulse Glow */}
      <div
        className={`absolute inset-0 bg-accent/5 pointer-events-none transition-opacity duration-700 ${
          delayedMatched ? 'opacity-40 animate-pulse' : 'opacity-0'
        }`}
      />

      <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all duration-300 shrink-0 ${
            delayedMatched
              ? 'bg-accent text-zinc-950 scale-105 shadow-[0_0_12px_rgba(15,228,155,0.6)]'
              : hasMidi
              ? 'bg-purple-500/20 text-purple-400 animate-pulse'
              : 'bg-[#0A090E] border border-white/5 text-zinc-500'
          }`}
        >
          {delayedMatched ? (
            <Check className="w-5 h-5 stroke-[3]" />
          ) : hasMidi ? (
            <span className="text-xs font-mono font-bold animate-pulse">...</span>
          ) : (
            <Music className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-display transition-colors ${
              delayedMatched ? 'text-accent' : hasMidi ? 'text-purple-300' : 'text-zinc-400'
            }`}
          >
            {delayedMatched
              ? '✓ Sintonia Perfeita!'
              : hasMidi
              ? 'Analisando Entrada MIDI...'
              : 'Aguardando Teclas MIDI...'}
          </h4>
          <p className="text-[10px] sm:text-xs text-zinc-400 font-mono mt-0.5 leading-tight">
            {delayedMatched ? (
              <span>
                Você reproduziu com precisão o acorde <strong className="text-accent underline decoration-accent/30">{activeChordSymbol}</strong>!
              </span>
            ) : hasMidi ? (
              <span>
                Teclas ativas. Ajuste o posicionamento para formar <strong className="text-zinc-200">{activeChordSymbol}</strong>.
              </span>
            ) : (
              <span>
                Toque as teclas no controlador USB para validar o acorde <strong className="text-zinc-400">{activeChordSymbol}</strong>.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right status badge */}
      <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono uppercase px-2.5 py-1 rounded-lg font-bold relative z-10 shrink-0">
        {delayedMatched ? (
          <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/30 text-accent font-extrabold px-2.5 py-1 rounded-md shadow-[0_0_8px_rgba(15,228,155,0.2)]">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Sincronizado
          </div>
        ) : hasMidi ? (
          <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
            Analisando
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#0A090E] border border-white/5 text-zinc-500 px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            Aguardando
          </div>
        )}
      </div>
    </div>
  );
}

