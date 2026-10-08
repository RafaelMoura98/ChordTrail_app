import React from 'react';
import { Radio, AlertTriangle, CheckCircle2, Music } from 'lucide-react';

interface MidiStatusBarProps {
  isConnected: boolean;
  deviceName?: string;
  notesPressedCount?: number;
  expectedChordSymbol?: string;
  detectedChordName?: string;
  activeNoteNames?: string[];
}

export function MidiStatusBar({
  isConnected,
  deviceName,
  notesPressedCount = 0,
  expectedChordSymbol,
  detectedChordName,
  activeNoteNames = []
}: MidiStatusBarProps) {
  // 🔹 Estado de Erro / Offline (Consistente com as diretrizes do Card de Conexão MIDI)
  if (!isConnected) {
    return (
      <div className="w-full min-h-[50px] bg-[#EF4444]/[0.05] border border-[#EF4444]/60 rounded-[10px] px-[16px] py-[8px] flex items-center justify-between shadow-lg overflow-hidden transition-colors">
        <div className="flex items-center gap-[12px] min-w-0 flex-1">
          {/* Indicador vermelho (dot + ícone) */}
          <div className="flex items-center gap-[8px] shrink-0">
            <div className="w-[8px] h-[8px] rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444] animate-pulse" />
            <AlertTriangle className="w-[14px] h-[14px] text-[#EF4444] shrink-0" />
            <span className="font-sans font-semibold text-[13px] text-[#FCA5A5] whitespace-nowrap">
              Nenhum teclado MIDI detectado
            </span>
          </div>

          <div className="hidden md:block w-px h-[14px] bg-[#EF4444]/20 shrink-0" />

          {/* Texto explicativo */}
          <p className="hidden md:block font-sans font-normal text-[12px] text-[#A1A0AE] truncate flex-1">
            Conecte seu controlador via USB. Ao tocar, as notas e acordes acendem automaticamente na tela.
          </p>
        </div>

        {/* Badge "# OFFLINE" */}
        <div className="shrink-0 ml-[12px]">
          <div className="w-[84px] h-[22px] rounded-full bg-[#EF4444]/[0.10] border border-[#EF4444]/40 flex items-center justify-center">
            <span className="font-mono font-bold text-[10px] text-[#EF4444] tracking-wider leading-none">
              # OFFLINE
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 🔹 Estado Ativo (Conectado - Tocando teclas ao vivo)
  if (notesPressedCount > 0) {
    return (
      <div className="w-full min-h-[50px] bg-[#0FE49B]/[0.08] border border-[#0FE49B] rounded-[10px] px-[16px] py-[8px] flex items-center justify-between shadow-lg overflow-hidden transition-all">
        <div className="flex items-center gap-[12px] min-w-0 flex-1">
          {/* Indicador de execução ao vivo */}
          <div className="flex items-center gap-[8px] shrink-0">
            <div className="w-[8px] h-[8px] rounded-full bg-[#0FE49B] shadow-[0_0_10px_#0FE49B] animate-ping" />
            <span className="font-display font-bold text-[14px] text-[#0FE49B] whitespace-nowrap">
              {detectedChordName || 'Harmonia ao Vivo'}
            </span>
          </div>

          <div className="w-px h-[14px] bg-[#0FE49B]/30 shrink-0" />

          {/* Detalhes das notas tocadas */}
          <div className="flex items-center gap-[8px] min-w-0 overflow-hidden">
            <span className="font-mono text-[11px] text-[#0A090E] font-bold bg-[#0FE49B] px-[8px] py-[2px] rounded-[4px] shrink-0">
              {notesPressedCount} {notesPressedCount === 1 ? 'tecla' : 'teclas'}
              {activeNoteNames.length > 0 && ` (${activeNoteNames.join(' · ')})`}
            </span>

            {expectedChordSymbol && (
              <span className="hidden lg:inline font-sans text-[12px] text-[#F4F4F7]/80 truncate">
                Acorde alvo na esteira: <strong className="text-[#0FE49B]">{expectedChordSymbol}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Badge "# AO VIVO" */}
        <div className="shrink-0 ml-[12px]">
          <div className="w-[84px] h-[22px] rounded-full bg-[#0FE49B]/[0.15] border border-[#0FE49B] flex items-center justify-center gap-[4px]">
            <Music className="w-[10px] h-[10px] text-[#0FE49B]" />
            <span className="font-mono font-bold text-[10px] text-[#0FE49B] tracking-wider leading-none">
              AO VIVO
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 🔹 Estado Ativo (Conectado - Aguardando teclas)
  return (
    <div className="w-full min-h-[50px] bg-[#0FE49B]/[0.04] border border-[#0FE49B]/40 rounded-[10px] px-[16px] py-[8px] flex items-center justify-between shadow-lg overflow-hidden transition-colors">
      <div className="flex items-center gap-[12px] min-w-0 flex-1">
        {/* Dot verde online */}
        <div className="flex items-center gap-[8px] shrink-0">
          <div className="w-[8px] h-[8px] rounded-full bg-[#0FE49B] shadow-[0_0_8px_#0FE49B]" />
          <CheckCircle2 className="w-[14px] h-[14px] text-[#0FE49B] shrink-0" />
          <span className="font-sans font-medium text-[13px] text-[#0FE49B] whitespace-nowrap">
            Controlador MIDI Conectado
          </span>
        </div>

        <div className="hidden md:block w-px h-[14px] bg-[#0FE49B]/20 shrink-0" />

        {/* Texto explicativo de aguardo */}
        <p className="hidden md:block font-sans font-normal text-[12px] text-[#A1A0AE] truncate flex-1">
          Dispositivo ativo: <span className="text-[#F4F4F7] font-medium">{deviceName || 'Teclado USB'}</span>. Aguardando você tocar as teclas para análise harmônica.
        </p>
      </div>

      {/* Badge "# ONLINE" */}
      <div className="shrink-0 ml-[12px]">
        <div className="w-[84px] h-[22px] rounded-full bg-[#0FE49B]/[0.08] border border-[#0FE49B]/30 flex items-center justify-center">
          <span className="font-mono font-bold text-[10px] text-[#0FE49B] tracking-wider leading-none">
            # ONLINE
          </span>
        </div>
      </div>
    </div>
  );
}

