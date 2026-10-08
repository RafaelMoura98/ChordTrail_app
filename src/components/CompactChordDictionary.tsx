import React, { useState, useMemo } from 'react';
import { Search, Volume2, ArrowRight, Music, Play, Sparkles, Layers } from 'lucide-react';
import chordsData from '../data/chords.json';
import {
  parseChordSymbolToNotes,
  getNoteNameByOffset,
  NOTE_SEMITONES,
  NOTES_CHROMATIC_FLAT,
  NOTES_CHROMATIC_SHARP,
  THEORETICAL_FULL_NAMES
} from '../utils/harmonyEngine';

type BaseNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
type AccidentalType = 'natural' | 'sharp' | 'flat';
type VariationName = keyof typeof chordsData.variacoes;

const BASE_NOTES: BaseNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const ACCIDENTAL_MAPPING: Record<BaseNote, { natural: string; sharp: string; flat: string }> = {
  C: { natural: 'C', sharp: 'C#', flat: 'B' },   // C♭ é enarmônico a B
  D: { natural: 'D', sharp: 'D#', flat: 'Db' },
  E: { natural: 'E', sharp: 'F', flat: 'Eb' },   // E♯ é enarmônico a F
  F: { natural: 'F', sharp: 'F#', flat: 'E' },   // F♭ é enarmônico a E
  G: { natural: 'G', sharp: 'G#', flat: 'Gb' },
  A: { natural: 'A', sharp: 'A#', flat: 'Ab' },
  B: { natural: 'B', sharp: 'C', flat: 'Bb' },   // B♯ é enarmônico a C
};

const THEORETICAL_NAMES: Record<string, string> = {
  'Maior': 'Tríade Maior (1 - 3M - 5J)',
  'm': 'Tríade Menor (1 - 3m - 5J)',
  '7': 'Dominante 7ª (1 - 3M - 5J - 7m)',
  'Maj7': 'Maior com 7ª Maior (1 - 3M - 5J - 7M)',
  'm7': 'Menor com 7ª (1 - 3m - 5J - 7m)',
  'm(Maj7)': 'Menor com 7ª Maior (1 - 3m - 5J - 7M)',
  'm7(♭5) / ø': 'Meio-Diminuto (1 - 3m - 5d - 7m)',
  'Dim / °': 'Tríade Diminuta (1 - 3m - 5d)',
  'Dim7 / °7': 'Tétrade Diminuta Simétrica (1 - 3m - 5d - 7d)',
  'Aug / +': 'Tríade Aumentada Simétrica (1 - 3M - 5A)',
  '7(♯5)': 'Dominante 7ª com 5ª Aumentada (1 - 3M - 5A - 7m)',
  'Maj7(♯5)': 'Maior 7M com 5ª Aumentada (1 - 3M - 5A - 7M)',
  '7(♭5)': 'Dominante com 5ª Diminuta (1 - 3M - 5d - 7m)',
  'sus4': 'Suspenso 4ª (1 - 4J - 5J)',
  'sus2': 'Suspenso 2ª (1 - 2M - 5J)',
  'add9': 'Com 9ª Adicionada (1 - 3M - 5J - 9M)',
  'm(add9)': 'Menor com 9ª Adicionada (1 - 3m - 5J - 9M)',
  'm6': 'Menor com 6ª (1 - 3m - 5J - 6M)',
  '6': 'Maior com 6ª (1 - 3M - 5J - 6M)',
  '9': 'Dominante 9ª',
  'Maj9': 'Maior com 9ª',
  'm9': 'Menor com 9ª',
  '7sus4': '7ª Suspensa (1 - 4J - 5J - 7m)',
  '6/9': 'Sexta com Nona'
};

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
  const [qualityFilter, setQualityFilter] = useState<'Todos' | 'Maior' | 'Menor' | 'Diminutos' | 'Aumentados' | 'Tétrades' | 'Extensões'>('Todos');
  const [selectedInversion, setSelectedInversion] = useState<'root' | '1st' | '2nd' | '3rd'>('root');
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
    if (varName.includes('Dim') || varName.includes('°') || varName.includes('m7(♭5)')) return 'Diminutos';
    if (varName.includes('Aug') || varName.includes('+') || varName.includes('♯5')) return 'Aumentados';
    if (['add9', '9', 'Maj9', 'm9', 'm(add9)', '7sus4', '7sus2', '11', 'Maj11', 'm11', '13', 'Maj13', 'm13', '6/9'].includes(varName)) return 'Extensões';
    if (['7', 'Maj7', 'm7', 'm(Maj7)', 'm6', '6', '7(♭5)'].includes(varName)) return 'Tétrades';
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
        if (qualityFilter === 'Diminutos' && quality !== 'Diminutos') return false;
        if (qualityFilter === 'Aumentados' && quality !== 'Aumentados') return false;
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

  // Compute Inversion Bass Note for any given chord variation
  const getInvertedChordSymbol = (root: string, varName: VariationName, inv: 'root' | '1st' | '2nd' | '3rd'): string => {
    const suffix = varName === 'Maior' ? '' : varName;
    const baseSymbol = `${root}${suffix}`;
    if (inv === 'root') return baseSymbol;

    const intervals = variations[varName] || [0, 4, 7];
    if (inv === '1st') {
      // 3ª do acorde (segunda nota da tríade/tétrade)
      const thirdInterval = intervals[1] ?? (intervals.includes(3) ? 3 : 4);
      const bassNote = getNoteNameByOffset(root, thirdInterval);
      return `${baseSymbol}/${bassNote}`;
    }
    if (inv === '2nd') {
      // 5ª do acorde (terceira nota)
      const fifthInterval = intervals[2] ?? 7;
      const bassNote = getNoteNameByOffset(root, fifthInterval);
      return `${baseSymbol}/${bassNote}`;
    }
    if (inv === '3rd') {
      // 7ª do acorde (quarta nota) se houver
      if (intervals.length >= 4) {
        const seventhInterval = intervals[3];
        const bassNote = getNoteNameByOffset(root, seventhInterval);
        return `${baseSymbol}/${bassNote}`;
      }
      return baseSymbol;
    }
    return baseSymbol;
  };

  const handlePlayChord = (varName: VariationName, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const symbol = getInvertedChordSymbol(selectedRoot, varName, selectedInversion);
    const parsed = parseChordSymbolToNotes(symbol);
    if (parsed && parsed.notes.length > 0) {
      onPlayChordSynth(parsed.notes.map((n) => ({ frequency: n.frequency })));
    }
  };

  const handleSelectChord = (varName: VariationName) => {
    setSelectedVarName(varName);
    const fullSymbol = getInvertedChordSymbol(selectedRoot, varName, selectedInversion);
    onSelectChord(fullSymbol);
  };

  return (
    <div className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[20px] sm:p-[24px] shadow-lg relative overflow-hidden">
      {/* 🔹 Título "Variações da Tônica // C" */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-[23px]">
            Variações da Tônica // {selectedRoot}
          </h3>
          <p className="font-sans font-normal text-[13px] text-[#A1A0AE] leading-[17px] mt-[4px]">
            Explore extensões, tétrades e inversões harmônicas
          </p>
        </div>
      </div>

      <div className="mt-[16px] space-y-[12px]">
        {/* 🔹 note-tabs (C D E F G A B) */}
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

        {/* 🔹 Maior/menor/dim/aug-tabs */}
        <div className="w-full h-[40px] bg-white/[0.03] border border-white/5 rounded-[8px] p-[4px] flex items-center gap-[4px] overflow-x-auto no-scrollbar">
          {(['Todos', 'Maior', 'Menor', 'Diminutos', 'Aumentados', 'Tétrades', 'Extensões'] as const).map((q) => {
            const isActive = qualityFilter === q;
            return (
              <button
                key={q}
                onClick={() => setQualityFilter(q)}
                className={`flex-1 min-w-[70px] h-[32px] rounded-[6px] text-center font-sans font-medium text-[11px] sm:text-[12px] transition-all cursor-pointer flex items-center justify-center shrink-0 ${
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

        {/* 🔹 #/b-tabs (Sustenido/Bemol) */}
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

        {/* 🔹 Seletor de Inversões (Harmonia Teórica) */}
        <div className="w-full bg-[#0A090E] border border-white/10 rounded-[8px] p-[3px] flex items-center gap-[4px]">
          {[
            { id: 'root' as const, label: 'Fundamental', tip: 'Tônica no baixo' },
            { id: '1st' as const, label: '1ª Inv (3ª)', tip: 'Baixo na terça' },
            { id: '2nd' as const, label: '2ª Inv (5ª)', tip: 'Baixo na quinta' },
            { id: '3rd' as const, label: '3ª Inv (7ª)', tip: 'Baixo na sétima' }
          ].map((inv) => {
            const isActive = selectedInversion === inv.id;
            return (
              <button
                key={inv.id}
                onClick={() => setSelectedInversion(inv.id)}
                title={inv.tip}
                className={`flex-1 h-[28px] rounded-[5px] text-center font-mono font-medium text-[11px] transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#38BDF8]/20 border border-[#38BDF8] text-[#38BDF8] font-bold shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                    : 'text-[#A1A0AE] hover:text-[#F4F4F7] hover:bg-white/[0.02]'
                }`}
              >
                {inv.label}
              </button>
            );
          })}
        </div>

        {/* 🔹 Search input */}
        <div className="relative w-full h-[40px]">
          <Search className="w-[16px] h-[16px] text-[#A1A0AE] absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar variação (ex: 7M, m9, sus4, m7b5)..."
            className="w-full h-[40px] bg-white/[0.027] border border-white/[0.07] rounded-[8px] pl-[38px] pr-[16px] py-[10px] text-[13px] text-[#F4F4F7] font-sans placeholder:text-[#6D6B7D] focus:outline-none focus:border-[#0FE49B]/60 transition-all"
          />
        </div>

        {/* 🔹 Lista de variações */}
        <div className="w-full max-h-[360px] overflow-y-auto pr-1 space-y-[4px] custom-scrollbar pt-1">
          {filteredVariations.length === 0 ? (
            <div className="w-full py-6 text-center text-[#6D6B7D] font-mono text-[12px] border border-dashed border-white/5 rounded-[8px]">
              Nenhuma variação encontrada para "{searchQuery}"
            </div>
          ) : (
            filteredVariations.map((varName) => {
              const fullChord = getInvertedChordSymbol(selectedRoot, varName, selectedInversion);
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
