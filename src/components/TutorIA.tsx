import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Trash2, Bot, User, Loader2, Volume2, Eye, AlertTriangle, Sparkles } from "lucide-react";
import Markdown from "react-markdown";

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
  const [messages, setMessages] = useState<TutorIAMessage[]>([
    {
      role: "assistant",
      text: "Olá! Sou o **TutorIA**, seu mentor de harmonia. Como posso te ajudar hoje? Posso sugerir rearmonizações sofisticadas para o seu C9 ou explicar modos gregos.",
      detectedChords: [],
    },
    {
      role: "user",
      text: "Quais são os Modos Gregos recomendados para solar sobre o acorde C9?",
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

  // Função para limpar o chat
  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: "Olá! Sou o **TutorIA**, seu mentor de harmonia. Como posso te ajudar hoje? Posso sugerir rearmonizações sofisticadas para o seu C9 ou explicar modos gregos.",
        detectedChords: [],
      },
    ]);
    setErrorMessage(null);
  };

  // Extrair acordes em potencial do texto da IA para torná-los interativos
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
      return !["A", "E", "O", "DO", "NO", "DE", "DA", "EM", "ME", "AM", "PDF", "OK"].includes(upper);
    });
  };

  // Enviar mensagem para o backend
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
      const response = await fetch("/api/tutor-ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-10),
          context: {
            activeChord: activeChord || "C9",
            songChords: songChords,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Não consegui me conectar com a base de conhecimento de harmonia.");
      }

      const data = await response.json();
      const aiReplyText = data.response;
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
      setErrorMessage("Erro de Conexão: Não consegui me conectar com a base de conhecimento de harmonia.");
    } finally {
      setIsLoading(false);
    }
  };

  // Preset prompts
  const handlePresetClick = (type: "rearm" | "agilidade" | "modos") => {
    let prompt = "";
    if (type === "rearm") {
      prompt = activeChord
        ? `Quais são as melhores sugestões de rearmonização para o acorde ${activeChord}?`
        : "Quais são as melhores ideias para rearmonizar uma progressão com acordes dominantes e tensões?";
    } else if (type === "agilidade") {
      prompt = activeChord
        ? `Crie um exercício de agilidade e dedilhado no teclado focado no acorde ${activeChord}.`
        : "Crie um exercício de agilidade para transição rápida entre acordes de tétrades e nonas.";
    } else if (type === "modos") {
      prompt = activeChord
        ? `Quais são os Modos Gregos recomendados para solar sobre o acorde ${activeChord}?`
        : "Quais são os Modos Gregos recomendados para solar sobre o acorde C9?";
    }

    handleSendMessage(prompt);
  };

  return (
    <div className="bg-[#16141D] border border-white/10 rounded-[16px] p-[20px] space-y-[16px] relative overflow-hidden group shadow-lg flex flex-col w-full">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-semibold text-[#F4F4F7] font-display">
              Tutoria Harmônico
            </h3>
            <span className="w-[47px] h-[22px] bg-[#8B5CF6]/[0.13] rounded-full text-[#A78BFA] text-[11px] font-mono font-semibold flex items-center justify-center tracking-wider">
              BETA
            </span>
          </div>
          <p className="text-[13px] text-[#A1A0AE] font-sans mt-0.5">
            Mentor de harmonia baseado no Gemini 1.5
          </p>
        </div>

        <button
          onClick={handleClearChat}
          className="p-1 text-[#6D6B7D] hover:text-[#EF4444] rounded-[6px] transition-colors cursor-pointer"
          title="Limpar conversa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Área de Mensagens (bot-message / user-message) */}
      <div className="space-y-[12px] max-h-[220px] overflow-y-auto pr-1 text-[13px]">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-[6px] bg-[#0FE49B]/15 border border-[#0FE49B]/30 text-[#0FE49B] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`p-3 rounded-[8px] max-w-[88%] leading-relaxed ${
                  isUser
                    ? "bg-[#0A090E] border border-[#0FE49B] text-[#F4F4F7]"
                    : "bg-white/[0.03] border border-white/5 text-[#F4F4F7]"
                }`}
              >
                <div className="markdown-body text-[13px]">
                  <Markdown>{msg.text}</Markdown>
                </div>

                {/* Acordes interativos sugeridos pela IA */}
                {!isUser && msg.detectedChords && msg.detectedChords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-1 border-t border-white/5">
                    <span className="text-[10px] font-mono text-[#6D6B7D] uppercase font-bold mr-1">
                      Acordes:
                    </span>
                    {msg.detectedChords.map((chord, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-center bg-[#0A090E] border border-white/10 rounded-[4px] px-2 py-0.5 text-[11px] font-mono text-[#F4F4F7]"
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
                <div className="w-6 h-6 rounded-[6px] bg-[#16141D] border border-white/10 text-[#A1A0AE] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-[6px] bg-[#0FE49B]/15 border border-[#0FE49B]/30 text-[#0FE49B] flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white/[0.03] border border-white/5 p-2.5 rounded-[8px] flex items-center gap-2 text-[#A1A0AE] text-[12px] font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0FE49B]" />
              <span>Analisando harmonia com IA...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* System Alert (fill: #EF4444 @ 6%, stroke: #EF4444, r:8) */}
      {errorMessage && (
        <div className="w-full min-h-[36px] bg-[#EF4444]/[0.06] border border-[#EF4444] rounded-[8px] px-3 py-2 text-[12px] text-[#FCA5A5] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Chips (3 chips, gap: 6, fill: #FFF @ 3%, stroke: #FFF, r:6, pad: 6, 10) */}
      <div className="flex flex-wrap items-center gap-[6px] pt-1">
        <button
          onClick={() => handlePresetClick("rearm")}
          className="bg-white/[0.03] border border-white/10 hover:border-[#0FE49B]/60 text-[#A1A0AE] hover:text-[#0FE49B] text-[12px] font-medium py-[6px] px-[10px] rounded-[6px] transition-all cursor-pointer"
        >
          Rearmonização
        </button>

        <button
          onClick={() => handlePresetClick("agilidade")}
          className="bg-white/[0.03] border border-white/10 hover:border-[#0FE49B]/60 text-[#A1A0AE] hover:text-[#0FE49B] text-[12px] font-medium py-[6px] px-[10px] rounded-[6px] transition-all cursor-pointer"
        >
          Exercício Agilidade
        </button>

        <button
          onClick={() => handlePresetClick("modos")}
          className="bg-white/[0.03] border border-white/10 hover:border-[#0FE49B]/60 text-[#A1A0AE] hover:text-[#0FE49B] text-[12px] font-medium py-[6px] px-[10px] rounded-[6px] transition-all cursor-pointer"
        >
          Modos Gregos
        </button>
      </div>

      {/* Chat Input (fill: #FFF @ 3%, stroke: #FFF, r:8, pad: 6) com Send-btn (28x28, fill: #0FE49B, r:6) */}
      <div className="w-full bg-white/[0.03] border border-white/10 rounded-[8px] p-[6px] flex items-center gap-2 min-h-[40px]">
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
        >
          <ArrowRight className="w-3.5 h-3.5 text-[#0A090E] stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

