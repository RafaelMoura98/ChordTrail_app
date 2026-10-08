import React from 'react';
import { Play, Sparkles, Music, ChevronLeft, ChevronRight } from 'lucide-react';

interface ChordsConveyorCardProps {
  companionText: string;
  setCompanionText: (text: string) => void;
  companionIndex: number;
  setCompanionIndex: React.Dispatch<React.SetStateAction<number>>;
  companionChords: string[];
  companionDisplayedChords: string[];
  companionUniqueOnly: boolean;
  setCompanionUniqueOnly: (val: boolean) => void;
  playChordSynth: (notes: any[]) => void;
  companionActiveChordParsed: any;
}

export function ChordsConveyorCard({
  companionText,
  setCompanionText,
  companionIndex,
  setCompanionIndex,
  companionChords,
  companionDisplayedChords,
  companionUniqueOnly,
  setCompanionUniqueOnly,
  playChordSynth,
  companionActiveChordParsed,
}: ChordsConveyorCardProps) {
  const handlePrev = () => {
    setCompanionIndex((prev) =>
      (prev - 1 + companionDisplayedChords.length) % Math.max(1, companionDisplayedChords.length)
    );
  };

  const handleNext = () => {
    setCompanionIndex((prev) =>
      (prev + 1) % Math.max(1, companionDisplayedChords.length)
    );
  };

  const handlePlayActive = () => {
    if (companionActiveChordParsed?.notes) {
      playChordSynth(companionActiveChordParsed.notes);
    }
  };

  return (
    <div className="w-full bg-[#16141D] border border-white/[0.07] rounded-[16px] p-[24px] space-y-[20px] relative overflow-hidden group shadow-lg">
      {/* 🔹 Header: Título + Subtítulo & Toggle "Modo Compacto (Únicos)" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-[23px]">
            Esteira de Acordes
          </h3>
          <p className="font-sans font-normal text-[13px] text-[#A1A0AE] leading-[17px] mt-[4px]">
            Estude a progressão no seu próprio ritmo
          </p>
        </div>

        {/* Toggle compacto (36 × 18) */}
        <div className="flex items-center gap-[8px] shrink-0">
          <span className="text-[12px] text-[#A1A0AE] font-sans select-none">
            Modo Compacto (Únicos)
          </span>
          <button
            onClick={() => setCompanionUniqueOnly(!companionUniqueOnly)}
            className={`w-[36px] h-[18px] rounded-full transition-colors relative cursor-pointer ${
              companionUniqueOnly ? 'bg-[#0FE49B]' : 'bg-[#0A090E] border border-white/15'
            }`}
            title="Filtrar apenas acordes únicos na esteira"
            aria-label="Filtrar acordes únicos"
          >
            <div
              className={`w-[14px] h-[14px] rounded-full transition-transform absolute top-[1px] ${
                companionUniqueOnly
                  ? 'left-[19px] bg-[#0A090E]'
                  : 'left-[2px] bg-[#A1A0AE]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 🔹 Progression strip (Cards de acordes em sequência: 88 × 61) */}
      <div className="flex items-center gap-[8px] overflow-x-auto pb-1 no-scrollbar w-full min-h-[61px]">
        {companionDisplayedChords.length === 0 ? (
          <div className="w-full h-[61px] flex items-center justify-center text-[#6D6B7D] font-mono text-[12px] border border-dashed border-white/[0.07] rounded-[10px] bg-white/[0.02]">
            NENHUM ACORDE NA SEQUÊNCIA
          </div>
        ) : (
          companionDisplayedChords.map((chord, idx) => {
            const isSelected = companionIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setCompanionIndex(idx)}
                className={`w-[88px] h-[61px] min-w-[88px] rounded-[10px] p-[10px] flex flex-col items-center justify-center text-center cursor-pointer transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#0FE49B]/[0.08] border border-[#0FE49B] shadow-[0_0_12px_rgba(15,228,155,0.2)]'
                    : 'bg-white/[0.027] border border-white/[0.07] hover:border-white/20'
                }`}
              >
                <span
                  className={`text-[10px] font-mono leading-none ${
                    isSelected ? 'text-[#0FE49B]' : 'text-[#6D6B7D]'
                  }`}
                >
                  #{idx + 1}
                </span>
                <span
                  className={`text-[16px] font-bold font-display mt-[3px] leading-tight ${
                    isSelected ? 'text-[#0FE49B]' : 'text-[#F4F4F7]'
                  }`}
                >
                  {chord}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* 🔹 Navigation Controls: Anterior (102 × 38), Play (46 × 46 r:23), Próximo (102 × 38) */}
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Botão Anterior */}
        <button
          onClick={handlePrev}
          disabled={companionDisplayedChords.length <= 1}
          className="w-[102px] h-[38px] bg-white/[0.027] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/20 text-[#F4F4F7] text-[13px] font-sans font-medium rounded-[8px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 text-[#A1A0AE]" />
          <span>Anterior</span>
        </button>

        {/* Botão Play Circular (46 × 46 | fill: #0FE49B, r:23) */}
        <button
          onClick={handlePlayActive}
          disabled={!companionActiveChordParsed}
          className="w-[46px] h-[46px] rounded-full bg-[#0FE49B] text-[#0A090E] hover:bg-[#38F9B6] transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 shadow-[0_0_16px_rgba(15,228,155,0.35)]"
          title="Ouvir acorde ativo"
          aria-label="Tocar acorde ativo"
        >
          <Play className="w-[20px] h-[20px] fill-current ml-0.5" />
        </button>

        {/* Botão Próximo (102 × 38 | fill: #0FE49B) */}
        <button
          onClick={handleNext}
          disabled={companionDisplayedChords.length <= 1}
          className="w-[102px] h-[38px] bg-[#0FE49B] hover:bg-[#38F9B6] text-[#0A090E] text-[13px] font-sans font-semibold rounded-[8px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(15,228,155,0.2)]"
        >
          <span>Próximo</span>
          <ChevronRight className="w-4 h-4 text-[#0A090E]" />
        </button>
      </div>

      {/* 🔹 Input de Sequência de Cifras (762 × 40 | fill: #FFF @2.7%, stroke: #FFF @7%, r:8) */}
      <div className="w-full h-[40px] bg-white/[0.027] border border-white/[0.07] rounded-[8px] px-[12px] flex items-center gap-[10px] focus-within:border-[#0FE49B]/50 transition-colors">
        <Music className="w-[16px] h-[16px] text-[#0FE49B] shrink-0" />
        <input
          type="text"
          value={companionText}
          onChange={(e) => setCompanionText(e.target.value)}
          placeholder="Digite ou cole a sequência de acordes (ex: C9 D G Em7 C G Am F)..."
          className="w-full bg-transparent border-none text-[13px] text-[#F4F4F7] font-mono placeholder:text-[#6D6B7D] focus:outline-none"
        />
      </div>
    </div>
  );
}
