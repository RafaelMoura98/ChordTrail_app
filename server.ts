import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Carregar variáveis de ambiente do .env
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware para decodificar JSON nas requisições
app.use(express.json());

// Inicializar o cliente Gemini usando as diretrizes recomendadas
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint principal da IA: TutorIA de Harmonia
app.post("/api/tutor-ia", async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "O campo 'message' é obrigatório." });
    }

    // Criar uma instrução do sistema robusta e focada em teoria musical
    const systemInstruction = `Você é o 'TutorIA', um assistente virtual especialista e mentor de harmonia musical de elite, improvisação, modos gregos e rearmonização sofisticada (focado em MPB, Bossa Nova, Jazz e clássico).
Seu objetivo é guiar o usuário na exploração prática e teórica da música, respondendo sempre em Português brasileiro de forma clara, didática, inspiradora e detalhada.

Seus pilares de especialidade são:
1. Rearmonização (Dicas e soluções usando acordes substitutos, dominantes secundários, SubV7, notas de tensão como 9ª, 11ª, 13ª, empréstimo modal e diminutos de passagem).
2. Exercícios de Agilidade (Práticas mecânicas e de audição no teclado piano ou violão/guitarra, dedilhados, arpejos e transições eficientes de acordes).
3. Modos Gregos (Relação escala-acorde, sonoridades características de cada modo: Jônio, Dório, Frígio, Lídio, Mixolídio, Eólio e Lócrio, e como aplicar em improvisação).

Contexto atual da sessão do usuário:
- Acorde ativo em foco no teclado: ${context?.activeChord || "Nenhum acorde selecionado no momento."}
- Progressão de acordes da música ativa: ${context?.songChords && context.songChords.length > 0 ? context.songChords.join(" -> ") : "Nenhuma música carregada."}

Use essas informações de contexto sempre que apropriado para sugerir rearmonizações imediatas, exercícios de agilidade na transição desses acordes, ou escalas correspondentes.
Formate suas respostas usando Markdown de forma elegante, usando listas, tabelas e termos destacados em negrito para facilitar a leitura.`;

    // Reconstruir o histórico de conversação no formato correto suportado pelo SDK da Gemini
    const contents: any[] = [];

    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text || msg.content }],
        });
      });
    }

    // Adicionar a mensagem atual do usuário
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Chamar a API Gemini usando o modelo recomendado para tarefas de texto
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Desculpe, não consegui gerar uma resposta adequada no momento.";
    return res.json({ response: reply });
  } catch (error: any) {
    console.error("Erro na rota do TutorIA:", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao processar a resposta com a inteligência harmônica.",
      details: error.message || error,
    });
  }
});

// Configuração do Vite middleware em desenvolvimento, ou servir estáticos em produção
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configurando servidor em modo de DESENVOLVIMENTO com Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configurando servidor em modo de PRODUÇÃO...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TutorIA Server] Servidor executando em http://localhost:${PORT}`);
  });
}

setupServer();
