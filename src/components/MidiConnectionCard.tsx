import React, { useState } from 'react';
import { Cpu, Settings, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

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
  midiNotesPressed = []
}: MidiConnectionCardProps) {
  const [showSettings, setShowSettings] = useState(false);

  const isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  const isConnected = midiInputs.length > 0;

  return (
    <div className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[20px] space-y-[14px] shadow-lg relative overflow-hidden">
      {/* 🔹 Título + Ícone CPU & Ícone Settings (910, 122 | 470 × 20 | HORIZONTAL, gap:8) */}
      <div className="flex items-center justify-between w-full h-[20px]">
        <div className="flex items-center gap-[8px]">
          <Cpu className="w-[18px] h-[18px] text-[#0FE49B] shrink-0" />
          <h3 className="font-display font-semibold text-[16px] text-[#F4F4F7] leading-none">
            Conexão MIDI
          </h3>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-[#A1A0AE] hover:text-[#F4F4F7] transition-colors p-0.5 cursor-pointer"
          title="Configurações MIDI"
          aria-label="Configurações MIDI"
        >
          {/* Ícone settings (1364, 124 | 16 × 16) */}
          <Settings className={`w-[16px] h-[16px] transition-transform ${showSettings ? 'rotate-45 text-[#0FE49B]' : ''}`} />
        </button>
      </div>

      {/* 🔹 Error Box / Status Box (910, 156 | 470 × 85 | pad:12, r:10) */}
      {!isSupported ? (
        <div className="w-full min-h-[85px] bg-[#EF4444]/[0.05] border border-[#EF4444] rounded-[10px] p-[12px] flex flex-col justify-center space-y-[6px]">
          <div className="flex items-center gap-[8px] text-[#FCA5A5]">
            <AlertTriangle className="w-[16px] h-[16px] text-[#EF4444] shrink-0" />
            <span className="font-sans font-semibold text-[13px] text-[#FCA5A5] leading-none">
              Navegador Incompatível
            </span>
          </div>
          <p className="font-sans font-normal text-[12px] text-[#A1A0AE] leading-[17px]">
            Seu navegador não suporta a Web MIDI API. Use o Google Chrome ou Microsoft Edge.
          </p>
        </div>
      ) : !isConnected ? (
        /* Error box (910, 156 | 470 × 85 | fill: #EF4444 @5%, stroke: #EF4444, r:10, pad:12) */
        <div className="w-full min-h-[85px] bg-[#EF4444]/[0.05] border border-[#EF4444] rounded-[10px] p-[12px] flex flex-col justify-center space-y-[6px]">
          {/* → Ícone alert-triangle + label (922, 168 | Geist SemiBold 13px, #FCA5A5) */}
          <div className="flex items-center gap-[8px]">
            <AlertTriangle className="w-[16px] h-[16px] text-[#EF4444] shrink-0" />
            <span className="font-sans font-semibold text-[13px] text-[#FCA5A5] leading-none">
              Nenhum teclado MIDI detectado
            </span>
          </div>
          {/* → Texto explicativo (922, 195 | 446 × 34 | Geist Regular 12px, #A1A0AE) */}
          <p className="font-sans font-normal text-[12px] text-[#A1A0AE] leading-[17px]">
            Conecte seu controlador via USB. Ao tocar, as notas acendem automaticamente na tela.
          </p>
        </div>
      ) : (
        /* Status Conectado */
        <div className="w-full min-h-[85px] bg-[#0FE49B]/[0.05] border border-[#0FE49B]/50 rounded-[10px] p-[12px] flex flex-col justify-center space-y-[6px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <CheckCircle2 className="w-[16px] h-[16px] text-[#0FE49B] shrink-0" />
              <span className="font-sans font-semibold text-[13px] text-[#0FE49B] leading-none">
                Controlador MIDI Conectado
              </span>
            </div>
            {midiNotesPressed.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0FE49B] text-[#0A090E]">
                {midiNotesPressed.length} {midiNotesPressed.length === 1 ? 'tecla' : 'teclas'}
              </span>
            )}
          </div>
          <p className="font-sans font-normal text-[12px] text-[#A1A0AE] leading-[17px] truncate">
            Dispositivo: {midiInputs.find((i) => i.id === selectedMidiInputId)?.name || midiInputs[0]?.name || 'Controlador USB'}
          </p>
        </div>
      )}

      {/* Drawer de Configurações / Seletor de Dispositivo */}
      {showSettings && isConnected && (
        <div className="pt-2 border-t border-white/5 space-y-2 animate-fadeIn">
          <label className="block text-[11px] font-mono text-[#A1A0AE] uppercase">
            Selecionar Porta de Entrada
          </label>
          <select
            value={selectedMidiInputId}
            onChange={(e) => setSelectedMidiInputId(e.target.value)}
            className="w-full bg-[#0A090E] border border-white/10 rounded-[8px] px-3 py-1.5 text-[12px] text-[#F4F4F7] font-sans focus:outline-none focus:border-[#0FE49B] transition-all cursor-pointer"
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
