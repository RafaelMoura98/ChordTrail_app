import React from 'react';
import { Check, Music, HelpCircle, Activity } from 'lucide-react';

interface SyncFeedbackBannerProps {
  isChordMatched: boolean;
  midiNotesPressed: number[];
  activeChordSymbol: string;
}

export function SyncFeedbackBanner({
  isChordMatched,
  midiNotesPressed,
  activeChordSymbol
}: SyncFeedbackBannerProps) {
  if (isChordMatched) {
    return (
      <div className="w-full bg-accent/10 border-2 border-accent text-accent rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(0,255,170,0.25)] animate-pulse relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-accent/5 pointer-events-none animate-ping opacity-30"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-full bg-accent text-zinc-950 flex items-center justify-center font-black">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest font-mono">
              ✓ Sintonia Ativa!
            </h4>
            <p className="text-[10px] sm:text-xs text-accent/80 font-medium">
              Você reproduziu perfeitamente o acorde <strong>{activeChordSymbol}</strong> no teclado!
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono uppercase bg-accent text-zinc-950 px-2 py-1 rounded font-bold">
          <Activity className="w-3.5 h-3.5 animate-spin" />
          Conectado
        </div>
      </div>
    );
  }

  if (midiNotesPressed.length > 0) {
    return (
      <div className="w-full bg-[#0d0d0e] border border-white/5 text-zinc-300 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold font-mono text-xs animate-pulse">
            ...
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-zinc-400">
              Analisando Entrada MIDI...
            </h4>
            <p className="text-[10px] sm:text-xs text-zinc-500">
              Teclas ativas. Ajuste os dedos para formar o acorde <strong>{activeChordSymbol}</strong>.
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-[9px] font-mono uppercase bg-zinc-900 border border-white/5 text-zinc-500 px-2 py-1 rounded">
          Sincronizando
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-900/40 border border-white/5 text-zinc-400 rounded-xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-600 flex items-center justify-center">
          <Music className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-zinc-500">
            Aguardando Conexão MIDI...
          </h4>
          <p className="text-[10px] sm:text-xs text-zinc-600">
            Toque teclas físicas do controlador musical para validar o acorde <strong>{activeChordSymbol}</strong> em tempo real.
          </p>
        </div>
      </div>
      <div className="hidden sm:block text-[9px] font-mono uppercase text-zinc-600">
        Aguardando
      </div>
    </div>
  );
}
