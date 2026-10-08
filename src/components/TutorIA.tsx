import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Trash2, Bot, User, Loader2, Volume2, Eye, AlertTriangle } from "lucide-react";
import Markdown from "react-markdown";
import { generateHarmonicTheoryResponse } from "../utils/tutorAiEngine";

interface TutorIAMessage {
  role: "user" | "assistant";
  text: string;
  detectedChords?: string[];
}

interface TutorIAProps {
  activeChord: string | null;
  songChords: string[];
  onSelectChord: (chord: string) => void;
  onPlayChord: (chord: string) => void;
}

export function TutorIA({
  activeChord,
  songChords,
  onSelectChord,
  onPlayChord,
}: TutorIAProps) {
  const currentChord = activeChord || "C9";

  const [messages, setMessages] = useState<TutorIAMessage[]>([
    {
      role: "assistant",
      text: "Olá! Sou o **TutorIA**, seu mentor de harmonia musical. Como posso te ajudar hoje? Posso sugerir rearmonizações sofisticadas para **C9**, exercícios de agilidade no teclado ou explicar modos gregos para improvisação.",
      detectedChords: ["C9", "Gm7", "Fmaj7", "Db7"],
    },
    {
      role: "user",
      text: "Quais são os Modos Gregos recomendados para solar sobre o acorde C9?",
    },
    {
      role: "assistant",
      text: "Para solar com precisão sobre o acorde dominante **C9**:\n\n1. **Mixolídio (C - D - E - F - G - A - Bb):** O modo natural para dominantes com 9ª, conferindo sonoridade alegre e aberta.\n2. **Lídio Dominante (#11):** Adiciona a nota de tensão **F#** (11ª aumentada), conferindo a sonoridade sofisticada do Jazz e da Bossa Nova.\n3. **Pentatônica Maior de C:** Cria linhas melódicas limpas e expressivas.",
      detectedChords: ["C9", "C7", "Fmaj7"],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a mensagem mais recente
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Limpar histórico do chat
  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: `Olá! Sou o **TutorIA**, seu mentor de harmonia musical. Como posso te ajudar hoje? Posso sugerir rearmonizações sofisticadas para **${currentChord}**, exercícios de agilidade ou explicar modos gregos.`,
        detectedChords: [currentChord],
      },
    ]);
    setErrorMessage(null);
  };

  // Extrair acordes do texto para botões interativos
  const extractChordsFromAiText = (text: string): string[] => {
    const chordRegex = /\b([A-G][#b♯♭]?(?:m|min|maj|Maj|M|aug|dim|sus|add|°|ø|\+|-)*(?:\([#b♭♯]?\d+\)|[0-9])*(?:\/[A-G][#b♯♭]?)?)(?![a-zÀ-ÿ1-9])/g;
    const matches = text.match(chordRegex);
    if (!matches) return [];

    const unique = Array.from(new Set(matches.map((c) => c.trim())));
    return unique.filter((c) => {
      if (c.length === 1) {
        return ["A", "B", "C", "D", "E", "F", "G"].includes(c.toUpperCase());
      }
      const upper = c.toUpperCase();
      return !["A", "E", "O", "DO", "NO", "DE", "DA", "EM", "ME", "AM", "PDF", "OK", "BETA", "IA"].includes(upper);
    });
  };

  // Processar mensagem usando motor de harmonia teórico Client-Side
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: TutorIAMessage = {
      role: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Simulação de micro-delay para fluidez visual
      await new Promise((resolve) => setTimeout(resolve, 260));

      const aiReplyText = generateHarmonicTheoryResponse(textToSend, {
        activeChord: currentChord,
        songChords: songChords,
      });

      const detected = extractChordsFromAiText(aiReplyText);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: aiReplyText,
          detectedChords: detected,
        },
      ]);
    } catch (error: any) {
      console.error("Erro TutorIA:", error);
      setErrorMessage("Erro ao processar teoria harmônica.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (type: "rearm" | "agilidade" | "modos") => {
    let prompt = "";
    if (type === "rearm") {
      prompt = `Quais são as melhores sugestões de rearmonização para o acorde ${currentChord}?`;
    } else if (type === "agilidade") {
      prompt = `Crie um exercício de agilidade e dedilhado no teclado focado no acorde ${currentChord}.`;
    } else if (type === "modos") {
      prompt = `Quais são os Modos Gregos recomendados para solar sobre o acorde ${currentChord}?`;
    }

    handleSendMessage(prompt);
  };

  return (
    <div className="w-full bg-[#16141D] border border-white/[0.07] rounded-[16px] p-[24px] space-y-[16px] relative overflow-hidden group shadow-lg flex flex-col">
      {/* 🔹 Header: Título "TutorIA" + Badge BETA + Botão Limpar */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="flex items-center gap-[8px]">
            <h3 className="text-[18px] font-semibold text-[#F4F4F7] font-display leading-[23px]">
              TutorIA
            </h3>
            {/* badge BETA: 47 × 22 | fill: #8B5CF6 @ 12.5%, text: #A78BFA, r:11 */}
            <span className="w-[47px] h-[22px] bg-[#8B5CF6]/[0.125] rounded-full text-[#A78BFA] text-[11px] font-mono font-semibold flex items-center justify-center tracking-wider shrink-0">
              BETA
            </span>
          </div>
          <p className="text-[13px] text-[#A1A0AE] font-sans mt-[4px] leading-[17px]">
            Mentor de harmonia musical
          </p>
        </div>

        <button
          onClick={handleClearChat}
          className="p-1.5 text-[#6D6B7D] hover:text-[#EF4444] hover:bg-white/[0.05] rounded-[6px] transition-colors cursor-pointer"
          title="Limpar conversa"
          aria-label="Limpar conversa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 🔹 Área de Mensagens (Scroll suave: 180px) */}
      <div className="space-y-[12px] max-h-[190px] overflow-y-auto pr-1 text-[13px]">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex items-start gap-[10px] ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                /* Avatar Assistant: 28 × 28, r:14, fill: #059669 (accent-dark) */
                <div className="w-[28px] h-[28px] rounded-full bg-[#059669] text-[#F4F4F7] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`p-[12px] rounded-[8px] max-w-[88%] leading-[140%] ${
                  isUser
                    ? "bg-[#0A090E] border border-[#0FE49B]/50 text-[#F4F4F7]"
                    : "bg-white/[0.027] border border-white/[0.07] text-[#F4F4F7]"
                }`}
              >
                <div className="markdown-body text-[13px] font-sans">
                  <Markdown>{msg.text}</Markdown>
                </div>

                {/* Acordes interativos sugeridos pela IA */}
                {!isUser && msg.detectedChords && msg.detectedChords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-[6px] pt-2 mt-2 border-t border-white/[0.07]">
                    <span className="text-[10px] font-mono text-[#6D6B7D] uppercase font-bold mr-1">
                      Acordes:
                    </span>
                    {msg.detectedChords.map((chord, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-center bg-[#0A090E] border border-white/[0.07] rounded-[4px] px-[8px] py-[2px] text-[11px] font-mono text-[#F4F4F7]"
                      >
                        <span className="font-bold text-[#0FE49B] mr-1.5">{chord}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onSelectChord(chord)}
                            className="p-0.5 text-[#A1A0AE] hover:text-[#0FE49B] transition-colors cursor-pointer"
                            title="Visualizar no piano"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onPlayChord(chord)}
                            className="p-0.5 text-[#A1A0AE] hover:text-[#0FE49B] transition-colors cursor-pointer"
                            title="Ouvir acorde"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                /* Avatar User: 28 × 28, r:14, fill: white @ 7% */
                <div className="w-[28px] h-[28px] rounded-full bg-white/[0.07] border border-white/[0.07] text-[#A1A0AE] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-[10px]">
            <div className="w-[28px] h-[28px] rounded-full bg-[#059669] text-[#F4F4F7] flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white/[0.027] border border-white/[0.07] p-[10px] rounded-[8px] flex items-center gap-2 text-[#A1A0AE] text-[12px] font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0FE49B]" />
              <span>Analisando harmonia...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 🔹 Alerta de Erro (770 × 36 | fill: #EF4444 @ 5%, stroke: #EF4444, r:8) */}
      {errorMessage && (
        <div className="w-full min-h-[36px] bg-[#EF4444]/[0.05] border border-[#EF4444] rounded-[8px] px-3 py-1.5 text-[12px] text-[#FCA5A5] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 🔹 Action Chips (fill: #FFF @ 2.7%, stroke: #FFF @ 7%, r:6, pad: 6 10) */}
      <div className="flex flex-wrap items-center gap-[6px] pt-1">
        <button
          onClick={() => handlePresetClick("rearm")}
          className="h-[28px] bg-white/[0.027] border border-white/[0.07] hover:border-[#0FE49B] text-[#A1A0AE] hover:text-[#0FE49B] text-[12px] font-medium px-[10px] rounded-[6px] transition-all flex items-center justify-center cursor-pointer"
        >
          Rearmonização
        </button>

        <button
          onClick={() => handlePresetClick("agilidade")}
          className="h-[28px] bg-white/[0.027] border border-white/[0.07] hover:border-[#0FE49B] text-[#A1A0AE] hover:text-[#0FE49B] text-[12px] font-medium px-[10px] rounded-[6px] transition-all flex items-center justify-center cursor-pointer"
        >
          Exercício Agilidade
        </button>

        <button
          onClick={() => handlePresetClick("modos")}
          className="h-[28px] bg-white/[0.027] border border-white/[0.07] hover:border-[#0FE49B] text-[#A1A0AE] hover:text-[#0FE49B] text-[12px] font-medium px-[10px] rounded-[6px] transition-all flex items-center justify-center cursor-pointer"
        >
          Modos Gregos
        </button>
      </div>

      {/* 🔹 Chat Input: 770 × 40 | fill: #FFF @ 2.7%, stroke: #FFF @ 7%, r:8 | Send-btn: 28 × 28, fill: #0FE49B, r:6 */}
      <div className="w-full h-[40px] bg-white/[0.027] border border-white/[0.07] rounded-[8px] p-[6px] flex items-center gap-2 focus-within:border-[#0FE49B]/50 transition-colors">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
          placeholder="Pergunta ao tutor (ex: Qual a escala de Cmaj7?)"
          className="flex-1 bg-transparent border-none px-2 text-[13px] text-[#F4F4F7] font-sans placeholder-[#6D6B7D] focus:outline-none"
        />
        <button
          onClick={() => handleSendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
          className="w-[28px] h-[28px] rounded-[6px] bg-[#0FE49B] text-[#0A090E] hover:bg-[#059669] transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(15,228,155,0.25)]"
          title="Enviar"
          aria-label="Enviar pergunta"
        >
          <ArrowRight className="w-3.5 h-3.5 text-[#0A090E] stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
