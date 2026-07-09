import React, { useMemo, useState } from 'react';
import { Sparkles, Zap, Lightbulb, Play, Volume2, ArrowUpRight, Flame, Music2, Layers } from 'lucide-react';
import { getChordInsights, ChordInsightResult } from '../utils/harmonyEngine';

interface ChordInsightsPanelProps {
  cifraOriginal: string | null;
  onSelectChordForExperiment: (chordSymbol: string) => void;
  onPlayChordSynth: (chordSymbol: string) => void;
  onReharmonizeJazz: () => void;
  isSongLoaded: boolean;
}

export function ChordInsightsPanel({
  cifraOriginal,
  onSelectChordForExperiment,
  onPlayChordSynth,
  onReharmonizeJazz,
  isSongLoaded
}: ChordInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'tensoes' | 'substitutos' | 'escala'>('tensoes');
  const [lastTestedSymbol, setLastTestedSymbol] = useState<string | null>(null);

  const insights: ChordInsightResult | null = useMemo(() => {
    if (!cifraOriginal) return null;
    return getChordInsights(cifraOriginal);
  }, [cifraOriginal]);

  const handleTestOnKeyboard = (symbol: string) => {
    setLastTestedSymbol(symbol);
    onSelectChordForExperiment(symbol);
  };

  const handlePlaySynth = (symbol: string) => {
    setLastTestedSymbol(symbol);
    onPlayChordSynth(symbol);
  };

  if (!insights) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(34,211,238,0.15)]">
          <Sparkles className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-zinc-100 font-sans uppercase tracking-wider">
          Painel de Insights IA (Tempo Real)
        </h4>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-xs mx-auto">
          Inicie o vídeo ou selecione uma música para visualizar tensões ideais, substitutos harmônicos e escalas de improviso em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 hover:border-cyan-500/50 transition-colors rounded-2xl p-5 sm:p-6 space-y-5 relative overflow-hidden group shadow-[0_0_15px_rgba(34,211,238,0.05)]">
      
      {/* Luz Ambiente (Glow de fundo) */}
      <div className="absolute w-64 h-64 -top-12 -right-12 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* CABEÇALHO DO PAINEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-100 font-sans">
                Insights Harmônicos & Improviso IA
              </h3>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                {insights.cifraOriginal} ({insights.quality})
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Sugestões em tempo real baseadas na teoria musical e inteligência harmônica
            </p>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL (AÇÃO IA): SUGERIR VERSÃO JAZZ */}
        {isSongLoaded && (
          <button
            onClick={onReharmonizeJazz}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
            title="Rearmoniza toda a cifra da música aplicando extensões sofisticadas de Jazz"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Sugerir Versão Jazz</span>
          </button>
        )}
      </div>

      {/* NAVEGAÇÃO DE SEÇÕES DO PAINEL */}
      <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 text-xs font-sans font-medium">
        <button
          onClick={() => setActiveTab('tensoes')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'tensoes'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)] font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tensões ({insights.tensoesIdeais.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('substitutos')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'substitutos'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-[0_0_15px_rgba(192,132,252,0.2)] font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Substitutos ({insights.substitutos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('escala')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'escala'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.2)] font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
          <span>Escala Solo</span>
        </button>
      </div>

      {/* CONTEÚDO DA SEÇÃO 1: TENSÕES IDEAIS */}
      {activeTab === 'tensoes' && (
        <div className="space-y-3">
          {insights.tensoesIdeais.map((tensao, idx) => {
            const isTested = lastTestedSymbol === tensao.chordSymbol;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isTested
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      {tensao.label}: {tensao.noteName}
                    </span>
                    <span className="text-sm font-black text-zinc-100 font-mono">
                      {tensao.chordSymbol}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-snug">
                    {tensao.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTestOnKeyboard(tensao.chordSymbol)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-medium hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
                    title="Carrega este acorde estendido no Teclado Principal para visualização das teclas"
                  >
                    <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                    Testar Teclado
                  </button>

                  <button
                    onClick={() => handlePlaySynth(tensao.chordSymbol)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                    title="Tocar som deste acorde no sintetizador"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTEÚDO DA SEÇÃO 2: SUBSTITUTOS HARMÔNICOS */}
      {activeTab === 'substitutos' && (
        <div className="space-y-3">
          {insights.substitutos.map((sub, idx) => {
            const isTested = lastTestedSymbol === sub.chordSymbol;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isTested
                    ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-md">
                      {sub.title}
                    </span>
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {sub.chordSymbol}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-snug">
                    {sub.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTestOnKeyboard(sub.chordSymbol.split(' ')[0])}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-medium hover:bg-purple-500/20 transition-colors flex items-center gap-1"
                  >
                    <ArrowUpRight className="w-3 h-3 text-purple-400" />
                    Testar Teclado
                  </button>

                  <button
                    onClick={() => handlePlaySynth(sub.chordSymbol.split(' ')[0])}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTEÚDO DA SEÇÃO 3: ESCALA DE IMPROVISO */}
      {activeTab === 'escala' && (
        <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <span className="text-xs font-bold text-emerald-400 font-sans flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
              <Music2 className="w-4 h-4" />
              {insights.escalaImproviso.scaleName}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {insights.escalaImproviso.notes.length} Notas
            </span>
          </div>

          {/* NOTAS DA ESCALA DE IMPROVISO */}
          <div className="flex flex-wrap gap-2 py-1">
            {insights.escalaImproviso.notes.map((note, idx) => (
              <span
                key={idx}
                className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-black text-xs flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.15)]"
              >
                {note}
              </span>
            ))}
          </div>

          {/* DICA DE IMPROVISAÇÃO */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300 font-sans leading-relaxed">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-400 text-[11px] font-bold uppercase mb-0.5">Dica de Solo:</strong>
              {insights.escalaImproviso.tip}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
