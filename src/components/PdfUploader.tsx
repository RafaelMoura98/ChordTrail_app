import React, { useState } from 'react';
import { Music, Volume2, FileText, Check, Loader2, ArrowRight, ArrowLeft, AudioWaveform, FileUp, Sparkles, Play } from 'lucide-react';

interface PdfUploaderProps {
  companionText: string;
  setCompanionText: (text: string) => void;
  companionIndex: number;
  setCompanionIndex: React.Dispatch<React.SetStateAction<number>>;
  companionChords: string[];
  companionDisplayedChords: string[];
  companionUniqueOnly: boolean;
  setCompanionUniqueOnly: (val: boolean) => void;
  showChordInputText: boolean;
  setShowChordInputText: (val: boolean) => void;
  playChordSynth: (notes: any[]) => void;
  companionActiveChordParsed: any;
  style?: React.CSSProperties;
}

export function PdfUploader({
  companionText,
  setCompanionText,
  companionIndex,
  setCompanionIndex,
  companionChords,
  companionDisplayedChords,
  companionUniqueOnly,
  setCompanionUniqueOnly,
  showChordInputText,
  setShowChordInputText,
  playChordSynth,
  companionActiveChordParsed,
  style
}: PdfUploaderProps) {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [pdfParseError, setPdfParseError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        await processPdfFile(file);
      } else {
        setPdfParseError("Apenas arquivos PDF são aceitos.");
        setPdfSuccess(false);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processPdfFile(e.target.files[0]);
    }
  };

  const processPdfFile = async (file: File) => {
    setIsParsingPdf(true);
    setPdfParseError(null);
    setPdfSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const resultBuffer = e.target?.result;
          if (!resultBuffer) {
            throw new Error("Não foi possível carregar o buffer do arquivo.");
          }
          const typedarray = new Uint8Array(resultBuffer as ArrayBuffer);

          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            throw new Error("Aguarde o carregamento do leitor de PDF do navegador.");
          }

          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;

          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }

          const chordRegex = /\b[A-G][b#]?(?:maj|min|aug|dim|sus|add|m|M)?\d*(?:\([^)]*\))?(?:\/[A-G][b#]?)?\b/g;
          const foundChords = fullText.match(chordRegex);

          if (foundChords && foundChords.length > 0) {
            const cleanedChords = foundChords.map(c => c.trim()).filter(c => {
              if (c.length === 1) {
                return ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(c);
              }
              if (['PDF', 'OK', 'NP', 'X', 'Y', 'TM', 'CO', 'ST', 'CH'].includes(c.toUpperCase())) {
                return false;
              }
              return true;
            });

            if (cleanedChords.length > 0) {
              setCompanionText(cleanedChords.join(' '));
              setCompanionIndex(0);
              setPdfSuccess(true);
              setTimeout(() => setPdfSuccess(false), 4000);
            } else {
              throw new Error("Nenhum acorde válido detectado no PDF.");
            }
          } else {
            throw new Error("Não foi possível encontrar nenhum acorde no PDF de cifras.");
          }
        } catch (err: any) {
          console.error("Erro interno no PDF.js:", err);
          setPdfParseError(err.message || "Falha ao extrair cifras do PDF.");
        } finally {
          setIsParsingPdf(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error("Erro ao carregar arquivo PDF:", err);
      setPdfParseError("Erro ao carregar o arquivo.");
      setIsParsingPdf(false);
    }
  };

  return (
    <div className="space-y-[24px] w-full">
      {/* 🔹 Card 2 — PDF Companion (40, 506 | 810 × 238) */}
      <div className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[24px] space-y-[16px] relative overflow-hidden group shadow-lg">
        {/* Título & Subtítulo */}
        <div>
          <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-[23px]">
            PDF Companion
          </h3>
          <p className="font-sans font-normal text-[13px] text-[#A1A0AE] leading-[17px] mt-[4px]">
            Projete cifras estruturadas diretamente no seu fluxo de estudo
          </p>
        </div>

        {/* upload-zone (762 × 130 | fill: #0FE49B @8%, stroke: #0FE49B, r:12, pad:28) */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`w-full min-h-[130px] rounded-[12px] p-[28px] border transition-all flex flex-col items-center justify-center text-center cursor-pointer relative ${
            isDragActive
              ? "bg-[#0FE49B]/[0.14] border-[#0FE49B] shadow-[0_0_16px_rgba(15,228,155,0.25)]"
              : "bg-[#0FE49B]/[0.08] border-[#0FE49B] hover:bg-[#0FE49B]/[0.12]"
          }`}
        >
          <input
            type="file"
            id="pdf-companion-file-input"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isParsingPdf ? (
            <div className="flex flex-col items-center justify-center gap-[8px] text-[#0FE49B]">
              <Loader2 className="w-[24px] h-[24px] animate-spin" />
              <p className="font-sans font-semibold text-[14px] text-[#F4F4F7]">
                Analisando PDF de Cifras...
              </p>
              <p className="font-sans font-normal text-[12px] text-[#A1A0AE]">
                Extraindo acordes e sequências harmônicas
              </p>
            </div>
          ) : pdfSuccess ? (
            <div className="flex flex-col items-center justify-center gap-[6px] text-[#0FE49B]">
              <Check className="w-[24px] h-[24px] stroke-[2.5]" />
              <p className="font-sans font-semibold text-[14px] text-[#0FE49B]">
                Cifras importadas com sucesso!
              </p>
              <p className="font-sans font-normal text-[12px] text-[#A1A0AE]">
                Acordes carregados na esteira de estudo
              </p>
            </div>
          ) : (
            <label
              htmlFor="pdf-companion-file-input"
              className="w-full flex flex-col items-center justify-center gap-[6px] cursor-pointer"
            >
              {/* Ícone file-music (dentro): 24 × 24 centralizado */}
              <div className="w-[24px] h-[24px] text-[#0FE49B] flex items-center justify-center">
                <Music className="w-[24px] h-[24px] stroke-[2]" />
              </div>

              {/* Texto upload principal: Geist SemiBold 14px */}
              <p className="font-sans font-semibold text-[14px] text-[#F4F4F7] leading-tight">
                Arraste o PDF de cifra aqui ou{" "}
                <span className="text-[#0FE49B] underline hover:text-[#38F9B6] transition-colors">
                  escolha um arquivo
                </span>
              </p>

              {/* Texto upload secundário: Geist Regular 12px, #A1A0AE */}
              <p className="font-sans font-normal text-[12px] text-[#A1A0AE] leading-tight">
                Formato PDF contendo cifras musicais estruturadas
              </p>
            </label>
          )}

          {pdfParseError && (
            <div className="mt-[8px] text-[11px] text-[#FCA5A5] font-mono bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[6px] px-3 py-1">
              {pdfParseError}
            </div>
          )}
        </div>

        {/* Toggle para editor manual de cifras */}
        <div className="flex items-center justify-between text-[12px] text-[#A1A0AE] pt-[2px]">
          <button
            onClick={() => setShowChordInputText(!showChordInputText)}
            className="hover:text-[#F4F4F7] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#0FE49B]" />
            <span>{showChordInputText ? "Ocultar editor de texto" : "Digitar cifras manualmente"}</span>
          </button>
        </div>

        {showChordInputText && (
          <div className="pt-1 space-y-1.5 animate-fadeIn">
            <textarea
              value={companionText}
              onChange={(e) => setCompanionText(e.target.value)}
              rows={2}
              placeholder="Digite os acordes separados por espaço (ex: C9 D G Em7 C G Am F)..."
              className="w-full bg-[#0A090E] border border-white/10 rounded-[8px] p-3 text-[13px] text-[#0FE49B] font-mono focus:outline-none focus:border-[#0FE49B] transition-all resize-none placeholder-[#6D6B7D]"
            />
          </div>
        )}
      </div>

      {/* 🔹 Card 3 — Estação de Prática (40, 768 | 810 × 299) */}
      <div className="w-full bg-[#16141D] border border-white/10 rounded-[16px] p-[24px] space-y-[20px] relative overflow-hidden group shadow-lg">
        {/* Título + Subtítulo & compact-toggle-group */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-[23px]">
              Estação de Prática
            </h3>
            <p className="font-sans font-normal text-[13px] text-[#A1A0AE] leading-[17px] mt-[4px]">
              Estude a progressão no seu próprio ritmo
            </p>
          </div>

          {/* compact-toggle-group (644, 805 | 182 × 18) */}
          <div className="flex items-center gap-[8px] shrink-0">
            <span className="text-[12px] text-[#A1A0AE] font-sans select-none">
              Modo Compacto (Únicos)
            </span>
            <button
              onClick={() => setCompanionUniqueOnly(!companionUniqueOnly)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                companionUniqueOnly ? "bg-[#0FE49B]" : "bg-[#0A090E] border border-white/15"
              }`}
              title="Filtrar apenas acordes únicos na esteira"
            >
              <div
                className={`w-3.5 h-3.5 rounded-full transition-transform absolute top-[2px] ${
                  companionUniqueOnly ? "left-[18px] bg-[#0A090E]" : "left-[3px] bg-[#A1A0AE]"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Progression strip (64, 856 | 762 × 61 | HORIZONTAL, gap:8) */}
        <div className="flex items-center gap-[8px] overflow-x-auto pb-1 no-scrollbar w-full min-h-[61px]">
          {companionDisplayedChords.length === 0 ? (
            <div className="w-full h-[61px] flex items-center justify-center text-[#6D6B7D] font-mono text-[12px] border border-dashed border-white/10 rounded-[10px] bg-white/[0.02]">
              NENHUM ACORDE IMPORTADO
            </div>
          ) : (
            companionDisplayedChords.map((chord, idx) => {
              const isSelected = companionIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCompanionIndex(idx)}
                  className={`w-[88px] h-[61px] min-w-[88px] rounded-[10px] p-[12px] flex flex-col items-center justify-center text-center cursor-pointer transition-all shrink-0 ${
                    isSelected
                      ? "bg-[#0FE49B]/[0.08] border border-[#0FE49B] shadow-[0_0_12px_rgba(15,228,155,0.18)]"
                      : "bg-white/[0.03] border border-white/10 hover:border-white/20"
                  }`}
                >
                  <span className={`text-[10px] font-mono leading-none ${isSelected ? "text-[#0FE49B]" : "text-[#6D6B7D]"}`}>
                    #{idx + 1}
                  </span>
                  <span className={`text-[16px] font-bold font-display mt-[3px] leading-tight ${isSelected ? "text-[#0FE49B]" : "text-[#F4F4F7]"}`}>
                    {chord}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Navigation Controls: btn-anterior (102 × 38), btn-play (46 × 46 r:23), btn-proximo (102 × 38) */}
        <div className="flex items-center justify-between gap-3 w-full">
          {/* btn-anterior: 102 × 38 | fill: #FFF @3%, stroke: #FFF, r:8 */}
          <button
            onClick={() => setCompanionIndex((prev) => (prev - 1 + companionDisplayedChords.length) % Math.max(1, companionDisplayedChords.length))}
            disabled={companionDisplayedChords.length <= 1}
            className="w-[102px] h-[38px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-[#F4F4F7] text-[13px] font-sans font-medium rounded-[8px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ◀ Anterior
          </button>

          {/* btn-play: 46 × 46 | fill: #0FE49B, r:23 (círculo) */}
          <button
            onClick={() => playChordSynth(companionActiveChordParsed?.notes || [])}
            disabled={!companionActiveChordParsed}
            className="w-[46px] h-[46px] rounded-full bg-[#0FE49B] text-[#0A090E] hover:bg-[#38F9B6] transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 shadow-[0_0_14px_rgba(15,228,155,0.3)]"
            title="Ouvir som do acorde"
          >
            <Play className="w-[20px] h-[20px] fill-current ml-0.5" />
          </button>

          {/* btn-proximo: 102 × 38 | fill: #0FE49B, r:8 */}
          <button
            onClick={() => setCompanionIndex((prev) => (prev + 1) % Math.max(1, companionDisplayedChords.length))}
            disabled={companionDisplayedChords.length <= 1}
            className="w-[102px] h-[38px] bg-[#0FE49B] hover:bg-[#38F9B6] text-[#0A090E] text-[13px] font-sans font-semibold rounded-[8px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(15,228,155,0.2)]"
          >
            Próximo ▶
          </button>
        </div>

        {/* tip-banner: 762 × 40 | fill: #FFF @3%, stroke: #FFF, r:8, ícone + texto */}
        <div className="w-full h-[40px] bg-white/[0.03] border border-white/10 rounded-[8px] px-[14px] flex items-center gap-[10px] text-[12px] text-[#A1A0AE] font-sans">
          <Sparkles className="w-[16px] h-[16px] text-[#0FE49B] shrink-0" />
          <span className="truncate">
            Dica: Use as setas do teclado ← e → (ou seu pedal de expressão) para navegar pelos acordes!
          </span>
        </div>
      </div>
    </div>
  );
}

