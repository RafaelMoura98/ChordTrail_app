import React, { useMemo } from 'react';
import { Keyboard, Music, WifiOff, CheckCircle2 } from 'lucide-react';

interface LiveMidiPianoCardProps {
  isConnected: boolean;
  activeMidiNotes?: number[];
  useFlats?: boolean;
}

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function LiveMidiPianoCard({
  isConnected,
  activeMidiNotes = [],
  useFlats = false
}: LiveMidiPianoCardProps) {
  // 61 Keys: 36 White Keys, 25 Black Keys (From C2 [MIDI 36] to C7 [MIDI 96] or C1 [MIDI 24])
  // Total 61 notes: 36 white keys, 25 black keys
  const startMidi = 36; // C2 to C7 (61 keys)
  const numKeys = 61;

  const keys = useMemo(() => {
    const scale = useFlats ? NOTES_FLAT : NOTES_SHARP;
    const whites: {
      midi: number;
      noteName: string;
      octave: number;
      isPressed: boolean;
      blackKeyAfter?: {
        midi: number;
        noteName: string;
        octave: number;
        isPressed: boolean;
      };
    }[] = [];

    for (let i = 0; i < numKeys; i++) {
      const midi = startMidi + i;
      const pitchClass = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const isBlack = [1, 3, 6, 8, 10].includes(pitchClass);
      const noteName = scale[pitchClass];
      const isPressed = activeMidiNotes.includes(midi);

      if (!isBlack) {
        let blackKeyAfter = undefined;
        if (i + 1 < numKeys) {
          const nextMidi = midi + 1;
          const nextPitchClass = nextMidi % 12;
          if ([1, 3, 6, 8, 10].includes(nextPitchClass)) {
            blackKeyAfter = {
              midi: nextMidi,
              noteName: scale[nextPitchClass],
              octave: Math.floor(nextMidi / 12) - 1,
              isPressed: activeMidiNotes.includes(nextMidi)
            };
          }
        }

        whites.push({
          midi,
          noteName,
          octave,
          isPressed,
          blackKeyAfter
        });
      }
    }

    return whites;
  }, [startMidi, numKeys, useFlats, activeMidiNotes]);

  return (
    <div className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[24px] space-y-[16px] shadow-lg relative overflow-hidden">
      {/* 🔹 Header (64, 1493) */}
      <div className="flex items-center justify-between w-full h-[22px]">
        {/* Ícone keyboard-music + Título (Outfit SemiBold 16px, #F4F4F7) */}
        <div className="flex items-center gap-[10px]">
          <div className="flex items-center text-[#0FE49B]">
            <Keyboard className="w-[18px] h-[18px]" />
          </div>
          <h3 className="font-display font-semibold text-[16px] text-[#F4F4F7] leading-none">
            Teclado MIDI Ao Vivo
          </h3>
        </div>

        {/* Badge "Controlador Offline / Online" */}
        <div className="w-[146px] h-[22px] rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center gap-[6px]">
          {isConnected ? (
            <>
              <span className="w-[6px] h-[6px] rounded-full bg-[#0FE49B] shadow-[0_0_6px_#0FE49B] animate-pulse" />
              <span className="font-sans font-medium text-[11px] text-[#0FE49B] leading-none">
                {activeMidiNotes.length > 0
                  ? `${activeMidiNotes.length} ${activeMidiNotes.length === 1 ? 'Tecla Ativa' : 'Teclas Ativas'}`
                  : 'Controlador Ativo'}
              </span>
            </>
          ) : (
            <>
              <span className="w-[6px] h-[6px] rounded-full bg-[#EF4444]" />
              <span className="font-sans font-medium text-[11px] text-[#A1A0AE] leading-none">
                Controlador Offline
              </span>
            </>
          )}
        </div>
      </div>

      {/* 🔹 Piano Container */}
      <div className="w-full bg-[#09080E] rounded-[12px] p-[2px] border border-white/5 overflow-x-auto no-scrollbar">
        <div className="relative h-[126px] min-w-[1000px] w-full select-none flex gap-[1px]">
          {keys.map((key) => {
            const isPressed = key.isPressed;
            const isC = key.noteName === 'C';
            const blackKey = key.blackKeyAfter;

            return (
              <div key={key.midi} className="relative flex-1 h-[126px]">
                {/* White Key */}
                <div
                  className={`w-full h-full rounded-b-[4px] border-b-2 transition-all flex flex-col justify-end pb-[6px] items-center cursor-pointer ${
                    isPressed
                      ? 'bg-[#0FE49B] border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_14px_rgba(15,228,155,0.85)] z-10'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:bg-white'
                  }`}
                  title={`${key.noteName}${key.octave} (MIDI ${key.midi})`}
                >
                  <span
                    className={`font-mono text-[9px] leading-none font-bold ${
                      isPressed ? 'text-[#0A090E]' : isC ? 'text-[#0F172A] font-extrabold' : 'text-[#94A3B8]'
                    }`}
                  >
                    {key.noteName}
                    {isC && <span className="text-[7px]">{key.octave}</span>}
                  </span>
                </div>

                {/* Black Key attached to boundary */}
                {blackKey && (
                  <div
                    style={{
                      width: '16px',
                      height: '76px'
                    }}
                    className={`absolute top-0 -right-[8px] rounded-b-[3px] border transition-all flex flex-col justify-end pb-[4px] items-center z-20 cursor-pointer shadow-md ${
                      blackKey.isPressed
                        ? 'bg-[#0FE49B] border-[#0FE49B] text-[#0A090E] font-black shadow-[0_0_12px_rgba(15,228,155,0.9)]'
                        : 'bg-[#0F172A] border-[#020617] text-[#64748B] hover:bg-[#1E293B]'
                    }`}
                    title={`${blackKey.noteName}${blackKey.octave} (MIDI ${blackKey.midi})`}
                  >
                    <span
                      className={`font-mono text-[7px] leading-none ${
                        blackKey.isPressed ? 'text-[#0A090E] font-bold' : 'text-[#64748B]'
                      }`}
                    >
                      {blackKey.noteName.length > 2 ? blackKey.noteName.slice(0, 2) : blackKey.noteName}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔹 Footer / Range Label */}
      <div className="flex items-center justify-between w-full pt-[2px]">
        <span className="font-mono text-[11px] text-[#A1A0AE] hidden sm:inline">
          {isConnected
            ? 'Transmissão contínua ativa de canais MIDI'
            : 'Conecte um teclado USB para tocar'}
        </span>
        <span className="font-mono font-normal text-[12px] text-[#6D6B7D] ml-auto">
          C2 a C7
        </span>
      </div>
    </div>
  );
}
