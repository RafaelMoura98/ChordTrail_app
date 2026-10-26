import React, { useState } from 'react';
import { Cpu, Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MidiConnectionCardProps {
  midiAccess: any;
  midiInputs: any[];
  selectedMidiInputId: string;
  setSelectedMidiInputId: (id: string) => void;
  midiNotesPressed?: number[];
}

export function MidiConnectionCard({
  midiAccess,
  midiInputs,
  selectedMidiInputId,
  setSelectedMidiInputId,
  midiNotesPressed = [],
}: MidiConnectionCardProps) {
  const [showSettings, setShowSettings] = useState(false);

  const isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  const isConnected = midiInputs.length > 0;

  return (
    <div className="w-full bg-[#16141D] border border-white/[0.07] rounded-[16px] p-5 sm:p-6 space-y-4 shadow-lg relative overflow-hidden">
      {/* 🔹 Título + Ícone CPU & Ícone Settings */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-[18px] h-[18px] text-[#0FE49B] shrink-0" />
          <h3 className="font-display font-semibold text-[16px] text-[#F4F4F7] leading-tight">
            Conexão MIDI
          </h3>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-[#A1A0AE] hover:text-[#F4F4F7] transition-colors p-1 cursor-pointer"
          title="Configurações MIDI"
          aria-label="Configurações MIDI"
        >
          <Settings
            className={`w-[16px] h-[16px] transition-transform ${
              showSettings ? 'rotate-45 text-[#0FE49B]' : ''
            }`}
          />
        </button>
      </div>

      {/* 🔹 Error Box / Status Box */}
      {!isSupported ? (
        <div className="w-full min-h-[85px] bg-[#EF4444]/[0.05] border border-[#EF4444] rounded-[10px] p-3.5 flex flex-col justify-center space-y-1.5">
          <div className="flex items-center gap-2 text-[#FCA5A5]">
            <AlertTriangle className="w-[16px] h-[16px] text-[#EF4444] shrink-0" />
            <span className="font-sans font-semibold text-[13px] text-[#FCA5A5] leading-tight">
              Navegador Incompatível
            </span>
          </div>
          <p className="font-sans font-normal text-[12px] text-[#A1A0AE] leading-normal">
            Seu navegador não suporta a Web MIDI API. Use o Google Chrome ou Microsoft Edge.
          </p>
        </div>
      ) : !isConnected ? (
        /* Error Box: Nenhum teclado detectado */
        <div className="w-full min-h-[85px] bg-[#EF4444]/[0.05] border border-[#EF4444] rounded-[10px] p-3.5 flex flex-col justify-center space-y-1.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-[16px] h-[16px] text-[#EF4444] shrink-0" />
            <span className="font-sans font-semibold text-[13px] text-[#FCA5A5] leading-tight">
              Nenhum teclado MIDI detectado
            </span>
          </div>
          <p className="font-sans font-normal text-[12px] text-[#A1A0AE] leading-normal">
            Conecte seu controlador via USB. Ao tocar, as notas acendem automaticamente na tela.
          </p>
        </div>
      ) : (
        /* Status Box: Controlador Conectado */
        <div className="w-full min-h-[85px] bg-[#0FE49B]/[0.05] border border-[#0FE49B]/50 rounded-[10px] p-3.5 flex flex-col justify-center space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-[16px] h-[16px] text-[#0FE49B] shrink-0" />
              <span className="font-sans font-semibold text-[13px] text-[#0FE49B] leading-tight">
                Controlador MIDI Conectado
              </span>
            </div>
            {midiNotesPressed.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0FE49B] text-[#0A090E]">
                {midiNotesPressed.length} {midiNotesPressed.length === 1 ? 'tecla' : 'teclas'}
              </span>
            )}
          </div>
          <p className="font-sans font-normal text-[12px] text-[#A1A0AE] leading-normal truncate">
            Dispositivo: {midiInputs.find((i) => i.id === selectedMidiInputId)?.name || midiInputs[0]?.name || 'Controlador USB'}
          </p>
        </div>
      )}

      {/* Drawer de Configurações / Seletor de Dispositivo */}
      {showSettings && isConnected && (
        <div className="pt-2 border-t border-white/[0.07] space-y-2 animate-fadeIn">
          <label className="block text-[11px] font-mono text-[#A1A0AE] uppercase">
            Selecionar Porta de Entrada
          </label>
          <select
            value={selectedMidiInputId}
            onChange={(e) => setSelectedMidiInputId(e.target.value)}
            className="w-full bg-[#0A090E] border border-white/[0.07] rounded-[8px] px-3 py-1.5 text-[12px] text-[#F4F4F7] font-sans focus:outline-none focus:border-[#0FE49B] transition-all cursor-pointer"
          >
            {midiInputs.map((input) => (
              <option key={input.id} value={input.id} className="bg-[#16141D]">
                {input.name || `Dispositivo MIDI (${input.id})`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
