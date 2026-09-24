import React, { useState, useMemo } from 'react';
import { Search, Volume2, ArrowRight, Music, Play, Sparkles } from 'lucide-react';
import chordsData from '../data/chords.json';

type BaseNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
type AccidentalType = 'natural' | 'sharp' | 'flat';
type VariationName = keyof typeof chordsData.variacoes;

const BASE_NOTES: BaseNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const ACCIDENTAL_MAPPING: Record<BaseNote, { natural: string; sharp: string; flat: string }> = {
  C: { natural: 'C', sharp: 'C#', flat: 'C' },
  D: { natural: 'D', sharp: 'D#', flat: 'Db' },
  E: { natural: 'E', sharp: 'E', flat: 'Eb' },
  F: { natural: 'F', sharp: 'F#', flat: 'F' },
  G: { natural: 'G', sharp: 'G#', flat: 'Gb' },
  A: { natural: 'A', sharp: 'A#', flat: 'Ab' },
  B: { natural: 'B', sharp: 'B', flat: 'Bb' },
};

const THEORETICAL_NAMES: Record<string, string> = {
  'Maior': 'Tríade Maior',
  'm': 'Tríade Menor',
  '7': 'Dominante 7ª',
  'Maj7': 'Maior com 7ª Maior',
  'm7': 'Menor com 7ª',
  'm7b5': 'Meio-Diminuto',
  'Dim / °': 'Diminuto',
  'Aug / +': 'Aumentado',
  'sus4': 'Suspenso 4ª',
  'sus2': 'Suspenso 2ª',
  'add9': 'Com 9ª Adicionada',
  'm6': 'Menor com 6ª',
  '6': 'Maior com 6ª',
  '9': 'Dominante 9ª',
  'Maj9': 'Maior com 9ª',
  'm9': 'Menor com 9ª',
  '7sus4': '7ª Suspensa'
};

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

interface CompactChordDictionaryProps {
  onSelectChord: (chordSymbol: string) => void;
  onPlayChordSynth: (notes: Array<{ frequency: number }>) => void;
  activeChordSymbol?: string;
}

export function CompactChordDictionary({
  onSelectChord,
  onPlayChordSynth,
  activeChordSymbol
}: CompactChordDictionaryProps) {
  const [baseNote, setBaseNote] = useState<BaseNote>('C');
  const [accidental, setAccidental] = useState<AccidentalType>('natural');
  const [qualityFilter, setQualityFilter] = useState<'Todos' | 'Maior' | 'Menor' | 'Tétrades' | 'Extensões'>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVarName, setSelectedVarName] = useState<VariationName>('Maior');

  // Compute effective Root Note
  const selectedRoot = useMemo(() => {
    return ACCIDENTAL_MAPPING[baseNote][accidental];
  }, [baseNote, accidental]);

  const variations = chordsData.variacoes as Record<VariationName, number[]>;
  const variationKeys = Object.keys(variations) as VariationName[];

  const getChordQuality = (varName: VariationName): string => {
    const intervals = variations[varName] || [];
    if (['add9', '9', 'Maj9', 'm9', '7sus4'].includes(varName)) return 'Extensões';
    if (['7', 'Maj7', 'm7', 'm7b5', 'm6', '6'].includes(varName)) return 'Tétrades';
    if (intervals.includes(3)) return 'Menor';
    if (intervals.includes(4)) return 'Maior';
    return 'Maior';
  };

  const filteredVariations = useMemo(() => {
    return variationKeys.filter((varName) => {
      if (qualityFilter !== 'Todos') {
        const quality = getChordQuality(varName);
        if (qualityFilter === 'Maior' && quality !== 'Maior') return false;
        if (qualityFilter === 'Menor' && quality !== 'Menor') return false;
        if (qualityFilter === 'Tétrades' && quality !== 'Tétrades') return false;
        if (qualityFilter === 'Extensões' && quality !== 'Extensões') return false;
      }
      if (searchQuery.trim()) {
        const fullChord = `${selectedRoot}${varName === 'Maior' ? '' : varName}`.toLowerCase();
        const search = searchQuery.toLowerCase().trim();
        const theoretical = (THEORETICAL_NAMES[varName] || '').toLowerCase();
        return varName.toLowerCase().includes(search) || fullChord.includes(search) || theoretical.includes(search);
      }
      return true;
    });
  }, [variationKeys, selectedRoot, qualityFilter, searchQuery]);

  const useFlats = useMemo(() => ['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(selectedRoot), [selectedRoot]);

  const getNoteFrequencies = (root: string, varName: VariationName) => {
    const intervals = variations[varName] || [0, 4, 7];
    const scale = useFlats ? NOTES_FLAT : NOTES_SHARP;
    const rootIndex = scale.indexOf(root);
    return intervals.map((interval) => {
      const semitonesFromC = (rootIndex >= 0 ? rootIndex : 0) + interval;
      const pitchClass = semitonesFromC % 12;
      const octave = 4 + Math.floor(semitonesFromC / 12);
      const midiNote = 12 * (octave + 1) + pitchClass;
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
      return { frequency };
    });
  };

  const handlePlayChord = (varName: VariationName, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const notes = getNoteFrequencies(selectedRoot, varName);
    onPlayChordSynth(notes);
  };

  const handleSelectChord = (varName: VariationName) => {
    setSelectedVarName(varName);
    const suffix = varName === 'Maior' ? '' : varName;
    const fullSymbol = `${selectedRoot}${suffix}`;
    onSelectChord(fullSymbol);
  };

  return (
    <div className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[20px] sm:p-[24px] shadow-lg relative overflow-hidden">
      {/* 🔹 Título "Variações da Tônica // C" (910, 305 | 470 × 23 | Outfit SemiBold 18px) */}
      <div className="w-full">
        <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-[23px]">
          Variações da Tônica // {selectedRoot}
        </h3>
        {/* 🔹 Subtítulo (910, 332 | 470 × 17 | Geist Regular 13px, #A1A0AE) */}
        <p className="font-sans font-normal text-[13px] text-[#A1A0AE] leading-[17px] mt-[4px]">
          Explore todas as extensões, tétrades e estruturas harmônicas
        </p>
      </div>

      <div className="mt-[16px] space-y-[12px]">
        {/* 🔹 note-tabs (C D E F G A B) (910, 365 | 470 × 40 | HORIZONTAL, gap:4, pad:4, fill: #FFF @3%, r:8) */}
        <div className="w-full h-[40px] bg-white/[0.03] border border-white/5 rounded-[8px] p-[4px] flex items-center gap-[4px]">
          {BASE_NOTES.map((note) => {
            const isActive = baseNote === note;
            return (
              <button
                key={note}
                onClick={() => setBaseNote(note)}
                className={`flex-1 h-[32px] rounded-[6px] text-center font-display font-semibold text-[13px] transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#0FE49B]/[0.08] border border-[#0FE49B] text-[#0FE49B] shadow-[0_0_8px_rgba(15,228,155,0.2)]'
                    : 'text-[#A1A0AE] hover:text-[#F4F4F7] hover:bg-white/[0.02]'
                }`}
              >
                {note}
              </button>
            );
          })}
        </div>

        {/* 🔹 Maior/menor-tabs (910, 411 | 470 × 40 | Mesmo padrão de tab-group) */}
        <div className="w-full h-[40px] bg-white/[0.03] border border-white/5 rounded-[8px] p-[4px] flex items-center gap-[4px] overflow-x-auto no-scrollbar">
          {(['Todos', 'Maior', 'Menor', 'Tétrades', 'Extensões'] as const).map((q) => {
            const isActive = qualityFilter === q;
            return (
              <button
                key={q}
                onClick={() => setQualityFilter(q)}
                className={`flex-1 min-w-[64px] h-[32px] rounded-[6px] text-center font-sans font-medium text-[12px] transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-[#0FE49B]/[0.08] border border-[#0FE49B] text-[#0FE49B] font-semibold shadow-[0_0_8px_rgba(15,228,155,0.2)]'
                    : 'text-[#A1A0AE] hover:text-[#F4F4F7] hover:bg-white/[0.02]'
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>

        {/* 🔹 #/b-tabs (Sustenido/Bemol) (909, 457 | 470 × 40 | Mesmo padrão de tab-group) */}
        <div className="w-full h-[40px] bg-white/[0.03] border border-white/5 rounded-[8px] p-[4px] flex items-center gap-[4px]">
          {[
            { id: 'natural' as AccidentalType, label: 'Natural ♮' },
            { id: 'sharp' as AccidentalType, label: 'Sustenido ♯' },
            { id: 'flat' as AccidentalType, label: 'Bemol ♭' }
          ].map((item) => {
            const isActive = accidental === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAccidental(item.id)}
                className={`flex-1 h-[32px] rounded-[6px] text-center font-sans font-medium text-[12px] transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#0FE49B]/[0.08] border border-[#0FE49B] text-[#0FE49B] font-semibold shadow-[0_0_8px_rgba(15,228,155,0.2)]'
                    : 'text-[#A1A0AE] hover:text-[#F4F4F7] hover:bg-white/[0.02]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* 🔹 Search input (910, 503 | 469 × 40 | fill: #1E1E1E, r:9999 (pill), stroke: #444, pad:12,16) */}
        <div className="relative w-full h-[40px]">
          <Search className="w-[16px] h-[16px] text-[#A1A0AE] absolute left-[16px] top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar variação (ex: 7M, m9, sus4)..."
            className="w-full h-[40px] bg-[#1E1E1E] border border-[#444] rounded-full pl-[42px] pr-[16px] py-[12px] text-[13px] text-[#F4F4F7] font-sans placeholder:text-[#6D6B7D] focus:outline-none focus:border-[#0FE49B] transition-all"
          />
        </div>

        {/* 🔹 Lista de variações (×10) (914, 569 | 470 × 38 cada | gap:4, fill: #FFF @3%, stroke: #FFF, r:8, pad:10) */}
        <div className="w-full max-h-[380px] overflow-y-auto pr-1 space-y-[4px] custom-scrollbar pt-1">
          {filteredVariations.length === 0 ? (
            <div className="w-full py-6 text-center text-[#6D6B7D] font-mono text-[12px] border border-dashed border-white/5 rounded-[8px]">
              Nenhuma variação encontrada para "{searchQuery}"
            </div>
          ) : (
            filteredVariations.map((varName) => {
              const suffix = varName === 'Maior' ? '' : varName;
              const fullChord = `${selectedRoot}${suffix}`;
              const isSelected = selectedVarName === varName || activeChordSymbol === fullChord;
              const theoretical = THEORETICAL_NAMES[varName] || varName;
              const intervals = variations[varName] || [];

              return (
                <div
                  key={varName}
                  onClick={() => handleSelectChord(varName)}
                  className={`w-full h-[38px] rounded-[8px] px-[10px] flex items-center justify-between border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-[#0FE49B]/[0.08] border-[#0FE49B] shadow-[0_0_10px_rgba(15,228,155,0.15)]'
                      : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-[10px] min-w-0">
                    <span className={`font-display font-bold text-[14px] ${isSelected ? 'text-[#0FE49B]' : 'text-[#F4F4F7]'}`}>
                      {fullChord}
                    </span>
                    <span className="font-sans font-normal text-[11px] text-[#A1A0AE] truncate hidden sm:inline">
                      {theoretical}
                    </span>
                  </div>

                  <div className="flex items-center gap-[6px] shrink-0">
                    <span className="font-mono text-[10px] text-[#6D6B7D] hidden md:inline">
                      {intervals.join('-')}
                    </span>
                    <button
                      onClick={(e) => handlePlayChord(varName, e)}
                      className="w-[26px] h-[26px] rounded-[6px] bg-white/[0.05] hover:bg-[#0FE49B] hover:text-[#0A090E] text-[#A1A0AE] transition-all flex items-center justify-center cursor-pointer"
                      title={`Ouvir ${fullChord}`}
                    >
                      <Play className="w-[12px] h-[12px] fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectChord(varName);
                      }}
                      className="h-[26px] px-[8px] rounded-[6px] bg-[#0FE49B]/10 hover:bg-[#0FE49B] text-[#0FE49B] hover:text-[#0A090E] font-sans font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                      title={`Projetar ${fullChord} no app`}
                    >
                      <span>Usar</span>
                      <ArrowRight className="w-[10px] h-[10px]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

