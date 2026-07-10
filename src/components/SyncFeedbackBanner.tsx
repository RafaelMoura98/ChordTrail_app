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
      // Quando o acorde deixa de ser correspondido, segura por 1.8 segundos para dar uma leitura confortável e fluida
      const timer = setTimeout(() => {
        setDelayedMatched(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isChordMatched]);

  const hasMidi = midiNotesPressed.length > 0;

  // Classes de estilo baseadas no estado
  let bgClass = "bg-zinc-900/40 border-white/5 text-zinc-400 shadow-sm";
  if (delayedMatched) {
    bgClass = "bg-[#003322]/40 border-accent/70 text-accent shadow-[0_0_25px_rgba(0,255,170,0.25)]";
  } else if (hasMidi) {
    bgClass = "bg-[#0f1115] border-purple-500/30 text-zinc-300 shadow-[0_0_15px_rgba(168,85,247,0.05)]";
  }

  return (
    <div 
      style={style} 
      className={`w-full border-2 rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all duration-500 ease-out relative overflow-hidden group ${bgClass}`}
    >
      {/* Luz de Fundo Pulsante / Efeito de Ping */}
      <div 
        className={`absolute top-0 right-0 bottom-0 left-0 bg-accent/5 pointer-events-none transition-opacity duration-700 ${
          delayedMatched ? 'opacity-35 animate-pulse' : 'opacity-0'
        }`}
      />

      <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
        {/* Ícone dinâmico com transições de cor e rotação */}
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all duration-500 shrink-0 ${
            delayedMatched 
              ? 'bg-accent text-zinc-950 scale-110 rotate-[360deg] shadow-[0_0_12px_rgba(0,255,170,0.6)]' 
              : hasMidi 
              ? 'bg-purple-500/20 text-purple-400 animate-pulse' 
              : 'bg-zinc-800 text-zinc-500'
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

        {/* Textos dinâmicos com fade-in ou mudanças suaves */}
        <div className="flex-1 min-w-0 transition-all duration-500">
          <h4 className={`text-xs sm:text-sm font-black uppercase tracking-wider font-mono transition-colors duration-500 ${
            delayedMatched ? 'text-accent' : hasMidi ? 'text-purple-400' : 'text-zinc-500'
          }`}>
            {delayedMatched 
              ? '✓ Sintonia Ativa!' 
              : hasMidi 
              ? 'Analisando Entrada MIDI...' 
              : 'Aguardando Conexão MIDI...'}
          </h4>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5 font-sans leading-relaxed">
            {delayedMatched ? (
              <span>Você reproduziu perfeitamente o acorde <strong className="text-accent underline decoration-accent/30 underline-offset-2">{activeChordSymbol}</strong> no teclado!</span>
            ) : hasMidi ? (
              <span>Teclas ativas. Ajuste o posicionamento dos dedos para formar o acorde <strong className="text-zinc-200">{activeChordSymbol}</strong>.</span>
            ) : (
              <span>Toque teclas físicas do controlador USB para validar o acorde <strong className="text-zinc-500">{activeChordSymbol}</strong> em tempo real.</span>
            )}
          </p>
        </div>
      </div>

      {/* Badge Lateral de Status */}
      <div className="hidden sm:flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono uppercase px-3 py-1.5 rounded-lg font-bold transition-all duration-500 relative z-10 shrink-0">
        {delayedMatched ? (
          <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/30 text-accent font-extrabold px-2.5 py-1 rounded-md">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Sincronizado
          </div>
        ) : hasMidi ? (
          <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
            Analisando
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-zinc-800/60 border border-white/5 text-zinc-500 font-medium px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
            Offline
          </div>
        )}
      </div>
    </div>
  );
}
