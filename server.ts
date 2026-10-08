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

// Inicializar o cliente Gemini se a chave estiver configurada
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.warn("Aviso ao inicializar GoogleGenAI:", err);
  }
}

// Gerador inteligente de respostas teóricas locais (fallback robusto)
function generateHarmonicTheoryResponse(message: string, context: { activeChord?: string; songChords?: string[] }) {
  const activeChord = context?.activeChord || "C9";
  const songChords = context?.songChords && context.songChords.length > 0 ? context.songChords.join(" → ") : "C9 → D → G → Em7";
  const lowerMsg = message.toLowerCase();
  const root = activeChord.match(/^[A-G][#b]?/)?.[0] || "C";

  // RESPOSTA ESPECÍFICA PARA DIMINUTOS
  if (lowerMsg.includes("diminut") || lowerMsg.includes("°") || activeChord.includes("dim") || activeChord.includes("°") || activeChord.includes("m7(b5)") || activeChord.includes("m7b5") || activeChord.includes("ø")) {
    return `### 💎 Teoria & Aplicação dos Acordes Diminutos e Meio-Diminutos: **${activeChord}**

1. **Estrutura & Formação Teórica:**
   - **Tríade Diminuta (° / dim):** 1 (Tônica) - 3m (Terça Menor) - 5d (Quinta Diminuta). Intervalos: \`[0, 3, 6]\`.
   - **Tétrade Diminuta (°7 / dim7):** 1 - 3m - 5d - 7d (Sétima Diminuta / 9 st). Simetria perfeita em 4 terças menores consecutivas.
   - **Meio-Diminuto (m7♭5 / ø):** 1 - 3m - 5d - 7m (Sétima Menor / 10 st). II grau de tonalidades menores ou VII grau maior.

2. **Propriedade Simétrica Única da Tétrade Diminuta:**
   - Devido à simetria de terças menores, **${root}°7** compartilha exatamente as mesmas notas que suas inversões situadas a cada 3 semitons!
   - Atua como substituto direto de dominantes com 9ª menor **V7(♭9)** sem fundamental.

3. **Escalas de Improviso Recomendadas:**
   - **Escala Diminuta Tom-Semitom (Octafônica):** Aceita tensões a 1 tom acima de cada nota da tétrade (9ª, 11ª, ♭13, 7M).
   - **Modo Lócrio / Lócrio ♮9 (para m7♭5):** Cria fluidez modal e sonoridade jazzística moderna.`;
  }

  // RESPOSTA ESPECÍFICA PARA AUMENTADOS
  if (lowerMsg.includes("aumentad") || lowerMsg.includes("aug") || lowerMsg.includes("+") || activeChord.includes("+") || activeChord.includes("aug") || activeChord.includes("#5") || activeChord.includes("♯5")) {
    return `### ✨ Teoria & Aplicação dos Acordes Aumentados: **${activeChord}**

1. **Estrutura & Formação Teórica:**
   - **Tríade Aumentada (+ / aug):** 1 (Tônica) - 3M (Terça Maior) - 5A (Quinta Aumentada / 8 st). Intervalos: \`[0, 4, 8]\`.
   - **Dominante Aumentado (7♯5):** 1 - 3M - 5A - 7m. Forte atração tonal com a 5ª aumentada atuando como sensível ascendente.
   - **Maior 7M com 5ª Aumentada (Maj7♯5):** 1 - 3M - 5A - 7M. Sonoridade impressionista e moderna.

2. **Propriedade Simétrica da Tríade Aumentada:**
   - Divide a oitava em 3 partes perfeitamente iguais de 4 semitons (3M). Qualquer uma de suas 3 notas pode funcionar como fundamental.

3. **Escalas de Improviso Recomendadas:**
   - **Escala de Tons Inteiros (Hexafônica / Whole Tone):** 6 notas separadas por 1 tom inteiro (\`1 - 2 - 3 - ♯4 - ♯5 - ♭7\`).
   - **Escala Lídia Aumentada (3º modo da Menor Melódica):** Ideal para acordes Maj7(♯5) e extensões sofisticadas.`;
  }

  // 1. REARMONIZAÇÃO
  if (lowerMsg.includes("rearm") || lowerMsg.includes("substitu") || lowerMsg.includes("tensão") || lowerMsg.includes("subv")) {
    const root = activeChord.match(/^[A-G][#b]?/)?.[0] || "C";
    return `### 🎼 Sugestões de Rearmonização para **${activeChord}**

Aqui estão 3 caminhos harmônicos sofisticados para aplicar sobre o acorde **${activeChord}** ou na progressão \`${songChords}\`:

1. **SubV7 (Substituto de Tritono):**
   - Substitua ou anteceda com o dominante a um semitom acima da resolução: experimente **Db7(9,#11)** ou **Db7(13)** resolvendo no acorde alvo.
   
2. **Empréstimo Modal (Subdominante Menor):**
   - Introduza o acorde **${root}m6** ou **Fm7(9)** para criar uma sensação de nostalgia típica da Bossa Nova e MPB.

3. **Cadeia II-V Secundária:**
   - Antes de **${activeChord}**, insira uma preparação com **Gm7** → **C7(9,13)** ou **Dm7(b5)** → **G7(b9)**.

> 💡 *Dica:* Clique nos botões de acordes gerados acima para visualizá-los e ouvi-los no teclado!`;
  }

  // 2. EXERCÍCIO DE AGILIDADE
  if (lowerMsg.includes("agilidade") || lowerMsg.includes("exercício") || lowerMsg.includes("dedilhado") || lowerMsg.includes("arpejo") || lowerMsg.includes("treino")) {
    return `### 🎹 Exercício de Agilidade e Dedilhado: **${activeChord}**

**Objetivo:** Desenvolver fluidez de transição, abertura de mão e independência dos dedos.

#### 1. Arpejo Ascendente e Descendente (Mão Direita):
- **Dedos:** 1 (Polegar) → 2 (Indicador) → 3 (Médio) → 4 (Anelar) → 5 (Mínimo)
- **Execução:** Toque a fundamental, 3ª maior, 5ª justa, 7ª menor e a 9ª maior em 2 oitavas a 70 BPM.
- **Variação:** Alterne para **Dm7** e **G7** mantendo a nota guia no topo.

#### 2. Voice Leading & Condução Suave:
- Mantenha notas comuns fixas ao transitar de **${activeChord}** para **Am7** ou **Fmaj7**.
- Pratique em 4 repetições sustentando cada acorde por 2 tempos.`;
  }

  // 3. MODOS GREGOS
  if (lowerMsg.includes("modo") || lowerMsg.includes("grego") || lowerMsg.includes("escala") || lowerMsg.includes("solar") || lowerMsg.includes("improvis")) {
    return `### 🌟 Modos Gregos Recomendados para **${activeChord}**

Para solar e improvisar com precisão melódica sobre **${activeChord}**:

1. **Mixolídio (5º Modo Maior):**
   - **Fórmula:** 1 - 2 - 3 - 4 - 5 - 6 - b7
   - **Sonoridade:** É o modo perfeito para dominantes com 9ª natural. Destaque a 3ª e a 7ª para definir a harmonia.

2. **Lídio Dominante (4º Modo da Menor Melódica):**
   - **Fórmula:** 1 - 2 - 3 - #4 - 5 - 6 - b7
   - **Sonoridade:** Tensão moderna e brilhante com a 11ª aumentada (**#11**). Ideal em arranjos de Jazz e MPB.

3. **Pentatônica Maior com 9ª:**
   - Toque as notas **C - D - E - G - A** para linhas melódicas limpas e expressivas.`;
  }

  // Resposta padrão didática
  return `### 🎵 Análise Harmônica para **${activeChord}**

O acorde **${activeChord}** possui uma sonoridade rica e versátil dentro do contexto tonal.

- **Função Harmônica Típica:** Dominante ou preparação dinâmica com tensão de 9ª maior.
- **Acordes Relacionados na Sessão:** \`${songChords}\`
- **Sugestões Práticas:**
  - Experimente a cadência **Dm7(9)** → **G7(13)** → **${activeChord}** → **Fmaj7**.
  - No teclado, mantenha a 3ª e a 7ª na mão esquerda e as extensões na mão direita.

Selecione um dos atalhos rápidos abaixo (**Rearmonização**, **Exercício Agilidade** ou **Modos Gregos**) para explorar detalhes específicos!`;
}

// Endpoint principal da IA: TutorIA de Harmonia
app.post("/api/tutor-ia", async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "O campo 'message' é obrigatório." });
    }

    // Se tiver cliente Gemini configurado, tentar chamada à API
    if (ai && process.env.GEMINI_API_KEY) {
      try {
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
Formate suas respostas usando Markdown de forma elegante, usando listas, tabelas e termos destacados em negrito para facilitar a leitura. Sempre inclua acordes cifrados (ex: C9, Dm7, G7, Fmaj7) para que o aluno possa interagir com eles na interface.`;

        const contents: any[] = [];
        if (history && Array.isArray(history)) {
          history.forEach((msg: any) => {
            contents.push({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.text || msg.content }],
            });
          });
        }

        contents.push({
          role: "user",
          parts: [{ text: message }],
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });

        const reply = response.text;
        if (reply && reply.trim().length > 0) {
          return res.json({ response: reply });
        }
      } catch (geminiError) {
        console.warn("Erro ao chamar API Gemini, utilizando fallback de teoria harmônica:", geminiError);
      }
    }

    // Fallback inteligente garantido com dados de teoria musical
    const fallbackReply = generateHarmonicTheoryResponse(message, context || {});
    return res.json({ response: fallbackReply });
  } catch (error: any) {
    console.error("Erro na rota do TutorIA:", error);
    // Fallback de segurança para não travar o frontend
    const safeFallback = generateHarmonicTheoryResponse(req.body?.message || "", req.body?.context || {});
    return res.json({ response: safeFallback });
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
