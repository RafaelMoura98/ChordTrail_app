import React, { useState } from 'react';
import { Music, Volume2, FileUp, Layers, FileText, Check, Loader2, HelpCircle } from 'lucide-react';

interface MoisesPdfUploaderProps {
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

export function MoisesPdfUploader({
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
}: MoisesPdfUploaderProps) {
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
        setPdfParseError("Apenas arquivos PDF (como os do Moises App) são aceitos.");
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
            throw new Error("Aguarde o carregamento do leitor de PDF do navegador. Se persistir, recarregue a página.");
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

          // Regex para detectar padrões de acorde (C, G9, Am, F#m7(b5), Bb/D, etc.)
          const chordRegex = /\b[A-G][b#]?(?:maj|min|aug|dim|sus|add|m|M)?\d*(?:\([^)]*\))?(?:\/[A-G][b#]?)?\b/g;
          const foundChords = fullText.match(chordRegex);

          if (foundChords && foundChords.length > 0) {
            const cleanedChords = foundChords.map(c => c.trim()).filter(c => {
              if (c.length === 1) {
                return ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(c);
              }
              // Ignorar ruídos textuais comuns do PDF do Moises
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
            throw new Error("Não foi possível encontrar nenhum acorde no PDF do Moises.");
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
    <div style={style} className="bg-[#161617] border-2 border-white/10 hover:border-accent/40 transition-colors rounded-xl pl-[12px] pr-[12px] pt-[12px] pb-[12px] mt-0 space-y-5 relative overflow-hidden group shadow-sm">
      <div className="absolute w-48 h-48 -top-12 -right-12 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 relative z-10 pl-[2px] pr-[2px] pt-[2px] pb-[2px]">
        <div 
          style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '8px', marginLeft: '4px', marginRight: '4px', marginTop: '6px', marginBottom: '6px' }}
          className="flex items-center gap-3 pl-[2px] pr-[2px] pt-[2px] pb-[2px] ml-0 mt-0"
        >
          <div className="p-2 bg-[#0d0d0e] text-accent border border-accent/20 rounded-xl">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono ml-[2px] mt-0 font-sans">
                Esteira_de_Acordes // Moises_Companion
              </h3>
              {/* Tooltip de ajuda */}
              <div className="group relative">
                <button className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-help">
                  <HelpCircle className="w-4 h-4" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-950 border border-white/10 rounded-lg text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-relaxed">
                  Suba o PDF exportado do Moises ou digite os acordes na caixa de texto. O visualizador de acordes criará uma sequência de botões para você treinar com facilidade!
                </div>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-500 font-mono uppercase tracking-wide ml-[2px] mt-0">
              Suba o PDF do Moises ou digite cifras para projetá-las na esteira de estudos
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {/* PDF Drag and Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{ marginLeft: '8px', marginRight: '8px', marginTop: '8px', marginBottom: '8px', paddingLeft: '6px', paddingRight: '6px', paddingTop: '6px', paddingBottom: '6px' }}
          className={`border-2 border-dashed rounded-xl pl-[20px] pr-[20px] pt-[15px] pb-[15px] cursor-pointer transition-all duration-300 text-center relative flex flex-col items-center justify-center min-h-[110px] ${
            isDragActive
              ? "border-accent bg-accent/5 shadow-[0_0_15px_rgba(0,255,170,0.15)]"
              : "border-white/10 bg-[#0d0d0e] hover:border-white/20"
          }`}
        >
          {isParsingPdf ? (
            <div className="flex flex-col items-center gap-2 text-accent">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-mono uppercase font-bold tracking-wider">Analisando PDF do Moises...</p>
            </div>
          ) : pdfSuccess ? (
            <div className="flex flex-col items-center gap-1.5 text-accent animate-bounce">
              <Check className="w-8 h-8" />
              <p className="text-xs font-mono uppercase font-bold tracking-wider">Cifras importadas com sucesso!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 mx-auto group-hover:text-accent transition-colors">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-300">
                  Arraste o PDF do Moises aqui ou{" "}
                  <label className="text-accent hover:underline cursor-grab" style={{ cursor: 'grab' }}>
                    escolha um arquivo
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wide">
                  Formato PDF exportado diretamente do Moises App
                </p>
              </div>
            </div>
          )}

          {pdfParseError && (
            <div className="absolute inset-x-2 bottom-2 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-1.5 text-[10px] text-red-400 font-mono">
              ⚠️ {pdfParseError}
            </div>
          )}
        </div>

        {/* Collapsible Text Area Switch */}
        <div 
          style={{ marginLeft: '4px', marginRight: '4px', marginTop: '8px', marginBottom: '8px', paddingTop: '8px', paddingBottom: '8px' }}
          className="flex items-center justify-between pl-[4px] pr-[4px] pt-[2px] pb-[2px]"
        >
          <button
            onClick={() => setShowChordInputText(!showChordInputText)}
            style={{ paddingLeft: '6px', paddingRight: '6px', paddingTop: '3px', paddingBottom: '3px', marginLeft: '6px', marginRight: '6px', marginTop: '3px', marginBottom: '3px' }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d0d0e] border border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer rounded-[8px] font-medium mr-[2px] ml-[2px] mt-[2px] mb-[2px]"
          >
            <FileText className="w-4 h-4 text-accent/80" />
            <span>{showChordInputText ? "Ocultar Editor de Cifras" : "Editar / Digitar Cifras"}</span>
          </button>

          {/* Unique Chords / Compact Mode Toggle */}
          <div 
            style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px', marginLeft: '6px', marginRight: '6px', marginTop: '3px', marginBottom: '3px' }}
            className="flex items-center gap-2"
          >
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide">
              Modo Compacto (Únicos)
            </span>
            <button
              onClick={() => setCompanionUniqueOnly(!companionUniqueOnly)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer rounded-[8px] mr-[2px] ml-[2px] mt-[2px] mb-[2px] ${
                companionUniqueOnly
                  ? "bg-accent/15 border-accent text-accent shadow-[0_0_8px_rgba(0,255,170,0.1)]"
                  : "bg-[#0d0d0e] border-white/5 text-zinc-500 hover:text-zinc-300"
              }`}
              title="Exibir cada acorde apenas uma vez na esteira (ideal para estudar formatos de acordes da música)"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Area for manual chords editing */}
        {showChordInputText && (
          <div className="space-y-1.5 animate-fade-in pl-[2px] pr-[2px] pt-[2px] pb-[2px]">
            <label className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
              Sequência de Cifras de Texto
            </label>
            <textarea
              value={companionText}
              onChange={(e) => setCompanionText(e.target.value)}
              rows={2}
              placeholder="Digite ou cole acordes separados por espaço (ex: C D G Em7)..."
              className="w-full bg-[#0d0d0e] border border-white/10 rounded-xl pl-[10px] pr-[10px] pt-[10px] pb-[10px] text-xs sm:text-sm text-accent font-mono focus:outline-none focus:border-accent transition-all resize-none placeholder:text-zinc-700 min-h-[64px]"
            />
          </div>
        )}

        {/* Horizontal Chords Slider */}
        <div className="space-y-2">
          <span 
            style={{ marginLeft: '6px', marginRight: '6px', marginTop: '6px', marginBottom: '6px', paddingLeft: '6px', paddingRight: '6px', paddingTop: '3px', paddingBottom: '3px' }}
            className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono"
          >
            Estação de Prática (Cliques ou Setas ◄ ► / Pedal)
          </span>

          {companionDisplayedChords.length === 0 ? (
            <div 
              style={{ paddingTop: '12px', paddingBottom: '12px', marginTop: '8px', marginBottom: '8px', paddingLeft: '12px', paddingRight: '12px', marginLeft: '0px' }}
              className="py-5 text-center text-zinc-600 font-mono text-xs border border-dashed border-zinc-800 rounded-xl"
            >
              NENHUM ACORDE IMPORTADO OU DIGITADO
            </div>
          ) : (
            <div 
              style={{ paddingTop: '12px', paddingBottom: '12px', marginTop: '8px', marginBottom: '8px', paddingLeft: '12px', paddingRight: '12px', marginLeft: '0px' }}
              className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pl-[4px] pr-[4px] pt-[6px] pb-[6px]"
            >
              {companionDisplayedChords.map((chord, idx) => {
                const isSelected = companionIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCompanionIndex(idx)}
                    className={`text-center border transition-all shrink-0 min-w-[70px] flex flex-col justify-center items-center cursor-pointer rounded-[8px] pl-[10px] pr-[10px] pt-[10px] pb-[10px] mr-[1px] ml-[1px] mt-[1px] mb-[1px] ${
                      isSelected
                        ? "bg-accent/15 border-accent text-accent shadow-[0_0_12px_rgba(0,255,170,0.18)] font-black scale-105"
                        : "bg-[#0d0d0e] border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-100"
                    }`}
                  >
                    <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                    <span className="text-base font-bold tracking-wide mt-0.5">{chord}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tactical Controls & Page Turner Info */}
        <div 
          style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', marginLeft: '6px', marginRight: '6px', marginTop: '8px', marginBottom: '8px' }}
          className="flex items-center justify-between gap-4 pt-2 pl-[2px] pr-[2px] pt-[2px] pb-[2px]"
        >
          <button
            onClick={() => setCompanionIndex((prev) => (prev - 1 + companionDisplayedChords.length) % Math.max(1, companionDisplayedChords.length))}
            disabled={companionDisplayedChords.length <= 1}
            style={{ width: '284px' }}
            className="flex-1 rounded-[8px] bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer pl-[12px] pr-[12px] pt-[12px] pb-[12px] mr-[2px] ml-[2px] mt-[2px] mb-[2px]"
          >
            ◀ Anterior
          </button>

          <button
            onClick={() => playChordSynth(companionActiveChordParsed?.notes || [])}
            disabled={!companionActiveChordParsed}
            style={{ width: '44px' }}
            className="rounded-[8px] bg-[#0d0d0e] border border-white/10 hover:border-accent/40 text-accent transition-all flex items-center justify-center min-h-[44px] disabled:opacity-40 cursor-pointer pl-[10px] pr-[10px] pt-[10px] pb-[10px] mr-[2px] ml-[2px] mt-[2px] mb-[2px]"
            title="Ouvir som do acorde de referência"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCompanionIndex((prev) => (prev + 1) % Math.max(1, companionDisplayedChords.length))}
            disabled={companionDisplayedChords.length <= 1}
            style={{ width: '284px' }}
            className="flex-1 rounded-[8px] bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer pl-[12px] pr-[12px] pt-[12px] pb-[12px] mr-[2px] ml-[2px] mt-[2px] mb-[2px]"
          >
            Próximo ▶
          </button>
        </div>

        <p 
          style={{ fontStyle: 'italic', textAlign: 'center' }}
          className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide text-center pt-1"
        >
          💡 Dica: Use as setas do teclado ◄ e ► (ou seu pedal bluetooth de passar página) para navegar!
        </p>
      </div>
    </div>
  );
}
