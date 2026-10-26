import React, { useState } from 'react';
import { Music, Check, Loader2, FileUp, AlertTriangle } from 'lucide-react';

interface PdfUploaderProps {
  onChordsExtracted: (chordsText: string) => void;
  style?: React.CSSProperties;
}

export function PdfUploader({ onChordsExtracted, style }: PdfUploaderProps) {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [pdfParseError, setPdfParseError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        await processPdfFile(file);
      } else {
        setPdfParseError('Apenas arquivos PDF são aceitos.');
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
            throw new Error('Não foi possível carregar o buffer do arquivo.');
          }
          const typedarray = new Uint8Array(resultBuffer as ArrayBuffer);

          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            throw new Error('Aguarde o carregamento do leitor de PDF do navegador.');
          }

          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;

          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }

          const chordRegex =
            /\b[A-G][b#]?(?:maj|min|aug|dim|sus|add|m|M)?\d*(?:\([^)]*\))?(?:\/[A-G][b#]?)?\b/g;
          const foundChords = fullText.match(chordRegex);

          if (foundChords && foundChords.length > 0) {
            const cleanedChords = foundChords
              .map((c) => c.trim())
              .filter((c) => {
                if (c.length === 1) {
                  return ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(c);
                }
                if (['PDF', 'OK', 'NP', 'X', 'Y', 'TM', 'CO', 'ST', 'CH'].includes(c.toUpperCase())) {
                  return false;
                }
                return true;
              });

            if (cleanedChords.length > 0) {
              onChordsExtracted(cleanedChords.join(' '));
              setPdfSuccess(true);
              setTimeout(() => setPdfSuccess(false), 4500);
            } else {
              throw new Error('Nenhum acorde válido detectado no arquivo PDF.');
            }
          } else {
            throw new Error('Não foi possível identificar acordes ou cifras no arquivo PDF.');
          }
        } catch (err: any) {
          console.error('Erro interno no PDF.js:', err);
          setPdfParseError(err.message || 'Falha ao extrair cifras do PDF.');
        } finally {
          setIsParsingPdf(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error('Erro ao carregar arquivo PDF:', err);
      setPdfParseError('Erro ao ler o arquivo.');
      setIsParsingPdf(false);
    }
  };

  return (
    <div
      style={style}
      className="w-full bg-[#16141D] border border-white/[0.07] rounded-[16px] p-6 sm:p-7 space-y-5 relative overflow-hidden group shadow-lg"
    >
      {/* 🔹 Título & Subtítulo */}
      <div>
        <h3 className="font-display font-semibold text-[18px] text-[#F4F4F7] leading-tight">
          Upload de Cifra // PDF
        </h3>
        <p className="font-sans font-normal text-[13px] text-[#A1A0AE] leading-normal mt-1.5">
          Importe arquivos do Moises ou Cifra Club
        </p>
      </div>

      {/* 🔹 Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`w-full min-h-[140px] rounded-[12px] p-6 border border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer relative ${
          isDragActive
            ? 'bg-[#0FE49B]/[0.15] border-[#0FE49B] shadow-[0_0_16px_rgba(15,228,155,0.25)]'
            : 'bg-[#0FE49B]/[0.08] border-[#0FE49B] hover:bg-[#0FE49B]/[0.12]'
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
          <div className="flex flex-col items-center justify-center gap-2 text-[#0FE49B]">
            <Loader2 className="w-[26px] h-[26px] animate-spin" />
            <p className="font-sans font-semibold text-[14px] text-[#F4F4F7]">
              Analisando PDF de Cifras...
            </p>
            <p className="font-sans font-normal text-[12px] text-[#A1A0AE]">
              Extraindo acordes e sequências harmônicas
            </p>
          </div>
        ) : pdfSuccess ? (
          <div className="flex flex-col items-center justify-center gap-2 text-[#0FE49B]">
            <Check className="w-[26px] h-[26px] stroke-[2.5]" />
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
            className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            {/* Ícone centralizado em #0FE49B */}
            <div className="w-[28px] h-[28px] text-[#0FE49B] flex items-center justify-center">
              <FileUp className="w-[26px] h-[26px] stroke-[2]" />
            </div>

            {/* Texto upload principal */}
            <p className="font-sans font-semibold text-[14px] text-[#F4F4F7] leading-normal">
              Arraste o PDF de cifra aqui ou{' '}
              <span className="text-[#0FE49B] underline hover:text-[#38F9B6] transition-colors">
                escolha um arquivo
              </span>
            </p>

            {/* Texto upload secundário */}
            <p className="font-sans font-normal text-[12px] text-[#A1A0AE] leading-normal">
              Formato PDF contendo cifras musicais estruturadas
            </p>
          </label>
        )}

        {pdfParseError && (
          <div className="absolute bottom-2 left-4 right-4 text-[11px] text-[#FCA5A5] font-mono bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-[6px] px-3 py-1 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
            <span>{pdfParseError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
