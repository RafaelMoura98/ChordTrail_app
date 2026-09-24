import React, { useMemo } from 'react';
import { Music, Eye, Radio, Sparkles } from 'lucide-react';

export interface ParsedChordNote {
  noteName: string;
  octave: number;
  midiNote: number;
  frequency: number;
  interval: number;
  label?: string;
}

export interface ParsedChord {
  cifraOriginal: string;
  rootNote: string;
  variationStr: string;
  bassNote: string | null;
  intervals: number[];
  notes: ParsedChordNote[];
}

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

interface PianoKeyboardProps {
  idContainer: string;
  parsedChord: ParsedChord | null;
  variant: 'current' | 'next';
  title: string;
  subtitle?: string;
  badgeText?: string;
  useFlats?: boolean;
  activeMidiNotes?: number[];
  style?: React.CSSProperties;
  numKeys?: number;
  startMidi?: number;
  fullWidth?: boolean;
}

export function PianoKeyboard({
  idContainer,
  parsedChord,
  variant,
  title,
  subtitle,
  badgeText = 'GUIA DE NOTAS',
  useFlats = false,
  activeMidiNotes,
  style,
  numKeys,
  startMidi,
  fullWidth = false
}: PianoKeyboardProps) {
  const isCurrent = variant === 'current';
  const actualNumKeys = numKeys !== undefined ? numKeys : 28;
  const actualStartMidi = startMidi !== undefined ? startMidi : 48; // Note C3 default

  // Generate piano keys
  const keys = useMemo(() => {
    const result = [];
    const scale = useFlats ? NOTES_FLAT : NOTES_SHARP;

    for (let i = 0; i < actualNumKeys; i++) {
      const midi = actualStartMidi + i;
      const noteInOctave = midi % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
      const noteName = scale[noteInOctave];
      const octave = Math.floor(midi / 12) - 1;

      // Check if note is part of the parsed target chord
      const chordNote = parsedChord?.notes.find((n) => {
        return (n.midiNote % 12) === noteInOctave;
      });

      // Check if pressed via live MIDI
      const isLiveMidiActive = activeMidiNotes?.includes(midi) || false;
      const isPressed = Boolean(chordNote) || isLiveMidiActive;

      result.push({
        midi,
        noteName,
        octave,
        isBlack,
        isPressed,
        chordNote,
        isLiveMidiActive
      });
    }
    return result;
  }, [actualNumKeys, actualStartMidi, useFlats, parsedChord, activeMidiNotes]);

  // Full-width variant (Bottom Live MIDI Keyboard 61-keys)
  if (fullWidth) {
    return (
      <div
        id={idContainer}
        style={style}
        className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[24px] space-y-[16px] shadow-lg relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-[12px]">
          <div>
            <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-[23px]">
              {title}
            </h3>
            {subtitle && (
              <p className="font-sans font-normal text-[13px] text-[#A1A0AE] leading-[17px] mt-[4px]">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-[8px]">
            <span className="px-[12px] py-[4px] rounded-full text-[11px] font-mono font-semibold bg-[#0FE49B]/[0.08] text-[#0FE49B] border border-[#0FE49B]/30 flex items-center gap-1.5 shadow-[0_0_8px_rgba(15,228,155,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0FE49B] animate-pulse" />
              {badgeText}
            </span>
          </div>
        </div>

        {/* 61 Keys Viewport */}
        <div className="w-full bg-[#09080E] border border-white/5 rounded-[12px] p-[4px] overflow-x-auto no-scrollbar">
          <div className="flex select-none relative h-[140px] min-w-[900px] justify-center mx-auto">
            {keys.map((key) => {
              if (key.isBlack) return null;
              const blackKeyAfter = keys.find((k) => k.isBlack && k.midi === key.midi + 1);
              const isRoot = key.chordNote?.interval === 0;

              return (
                <div
                  key={key.midi}
                  className="relative flex-1 min-w-[16px] max-w-[28px] h-full"
                >
                  {/* White Key */}
                  <div
                    className={`w-full h-full rounded-b-[4px] border transition-all flex flex-col justify-end pb-1.5 items-center ${
                      key.isPressed
                        ? isRoot
                          ? 'bg-[#0FE49B] border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_12px_rgba(15,228,155,0.7)] z-10'
                          : 'bg-[#0FE49B]/85 border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_10px_rgba(15,228,155,0.5)] z-10'
                        : 'bg-[#EDEDF0] border-[#D1D0DC] text-[#4A4858] hover:bg-white'
                    }`}
                  >
                    <span className="text-[8px] font-mono font-bold leading-none">
                      {key.noteName}
                    </span>
                  </div>

                  {/* Black Key */}
                  {blackKeyAfter && (
                    <div
                      className={`absolute top-0 -right-[40%] w-[80%] h-[58%] z-20 rounded-b-[3px] border transition-all flex flex-col justify-end pb-1 items-center ${
                        blackKeyAfter.isPressed
                          ? blackKeyAfter.chordNote?.interval === 0
                            ? 'bg-[#0FE49B] border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_12px_rgba(15,228,155,0.8)]'
                            : 'bg-[#0FE49B]/85 border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_10px_rgba(15,228,155,0.6)]'
                          : 'bg-[#181622] border-[#09080E] text-[#716F82] hover:bg-[#232030]'
                      }`}
                    >
                      <span className="text-[6px] font-mono leading-none">
                        {blackKeyAfter.noteName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Card 4 — Acorde Alvo / Piano (40, 1091 | 810 × 268)
  return (
    <div
      id={idContainer}
      style={style}
      className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[24px] space-y-[16px] shadow-lg relative overflow-hidden"
    >
      {/* Header: Título + Subtítulo (64, 1115 | 630 × 44) & btn-guia (694, 1123 | 132 × 28) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="max-w-[630px]">
          <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-[23px]">
            {title}
          </h3>
          {subtitle && (
            <p className="font-sans font-normal text-[13px] text-[#A1A0AE] leading-[17px] mt-[4px]">
              {subtitle}
            </p>
          )}
        </div>

        {/* btn-guia: 132 × 28 | fill: #FFF @3%, stroke: #0FE49B, r:6 */}
        <div className="w-[132px] h-[28px] bg-white/[0.03] border border-[#0FE49B] rounded-[6px] text-[#0FE49B] font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 shrink-0 select-none shadow-[0_0_8px_rgba(15,228,155,0.15)]">
          <Sparkles className="w-[13px] h-[13px] text-[#0FE49B]" />
          <span>{badgeText}</span>
        </div>
      </div>

      {/* piano-container: 64, 1175 | 762 × 160 | fill: #09080E, r:12, pad:4 */}
      <div className="w-full h-[160px] bg-[#09080E] border border-white/5 rounded-[12px] p-[4px] flex items-center justify-center overflow-hidden">
        {/* Piano viewport: 68, 1179 | 754 × 152 | Teclas brancas + pretas */}
        <div className="w-full h-[152px] flex select-none relative justify-center">
          {keys.map((key) => {
            if (key.isBlack) return null;
            const blackKeyAfter = keys.find((k) => k.isBlack && k.midi === key.midi + 1);
            const isRoot = key.chordNote?.interval === 0;

            return (
              <div
                key={key.midi}
                className="relative flex-1 min-w-[24px] max-w-[48px] h-full"
              >
                {/* White Key */}
                <div
                  className={`w-full h-full rounded-b-[6px] border transition-all flex flex-col justify-end pb-2 items-center ${
                    key.isPressed
                      ? isRoot
                        ? 'bg-[#0FE49B] border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_16px_rgba(15,228,155,0.7)] z-10 scale-[0.98]'
                        : 'bg-[#0FE49B]/85 border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_12px_rgba(15,228,155,0.5)] z-10 scale-[0.98]'
                      : 'bg-[#EDEDF0] border-[#D1D0DC] text-[#4A4858] hover:bg-white'
                  }`}
                >
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold leading-none mb-0.5">
                    {key.noteName}
                  </span>
                  {key.chordNote && (
                    <span className="text-[8px] font-mono text-[#0A090E] font-semibold">
                      {key.chordNote.interval === 0 ? 'T' : `${key.chordNote.interval}st`}
                    </span>
                  )}
                </div>

                {/* Black Key Overlay */}
                {blackKeyAfter && (
                  <div
                    className={`absolute top-0 -right-[38%] w-[76%] h-[58%] z-20 rounded-b-[5px] border transition-all flex flex-col justify-end pb-1.5 items-center ${
                      blackKeyAfter.isPressed
                        ? blackKeyAfter.chordNote?.interval === 0
                          ? 'bg-[#0FE49B] border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_14px_rgba(15,228,155,0.8)]'
                          : 'bg-[#0FE49B]/85 border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_12px_rgba(15,228,155,0.6)]'
                        : 'bg-[#181622] border-[#09080E] text-[#868496] hover:bg-[#232030]'
                    }`}
                  >
                    <span className="text-[8px] font-mono leading-none mb-0.5">
                      {blackKeyAfter.noteName}
                    </span>
                    {blackKeyAfter.chordNote && (
                      <span className="text-[7px] font-mono text-[#0A090E] font-bold">
                        {blackKeyAfter.chordNote.interval === 0 ? 'T' : `${blackKeyAfter.chordNote.interval}st`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
