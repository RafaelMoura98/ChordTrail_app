# 🎹 KeyChord

> **KeyChord** é uma estação de trabalho harmônica e prática musical interativa baseada na web. O aplicativo permite que instrumentistas e estudantes visualizem acordes em teclados de piano digitais, importem cifras diretamente de arquivos PDF, conectem teclados controladores MIDI físicos por USB e utilizem o microfone para detecção de tom em tempo real.

Este projeto foi construído de forma totalmente iterativa através do processo de **Vibe Coding** com assistentes de IA, unindo design moderno de alta fidelidade a tecnologias de ponta disponíveis nativamente nos navegadores modernos.

---

## 🚀 Demonstração Visual & Design

O design do **KeyChord** foi projetado para ser **futurista, imersivo e de alta performance**:
*   **Tema Cosmic Slate**: Interface escura com contrastes em tons de cinza profundos, neon verde-esmeralda (`accent`) e detalhes em roxo/fuchsia para indicar estados secundários.
*   **Fidelidade Responsiva**: Otimizado para desktop, com melhorias de responsividade mobile em andamento.
*   **Feedback de Estado**: Efeitos de brilho dinâmico (glow) e micro-animações para transições suaves.

---

## 🛠️ Principais Funcionalidades

### 1. 📄 Esteira de Acordes & PDF Companion
*   **Leitura de PDF no Client-Side**: O aplicativo integra a biblioteca `pdf.js` diretamente no navegador. Você pode arrastar ou selecionar um PDF contendo cifras. O app faz a leitura binária por `ArrayBuffer`, analisa o texto com expressões regulares e extrai a sequência de acordes de forma instantânea.
*   **Modo Compacto (Únicos)**: Filtra acordes duplicados para que você estude apenas a fôrma e estrutura harmônica das notas únicas da música.
*   **Estação de Prática**: Controle de avanço por cliques, setas do teclado (◄ e ►) ou pedais controladores bluetooth, simulando um passador de página real.
*   **Teclado de Preparação**: Mostra em tempo real o formato do **acorde atual** no teclado principal e já antecipa o **próximo acorde** no teclado lateral, otimizando o tempo de reação do músico.

### 2. 🔌 Teclado MIDI ao Vivo (USB / MIDI-to-USB)
*   **Web MIDI API**: Reconhece de forma plug-and-play qualquer teclado controlador físico conectado ao seu computador ou tablet.
*   **Mapeamento de 61 Teclas**: Exibe visualmente no monitor (C1 a C7) quais teclas físicas você está pressionando com latência ultrabaixa.
*   **Reconhecimento Harmônico Inteligente**: O algoritmo analisa as notas pressionadas simultaneamente no controlador e decifra qual acorde está sendo formado no teclado (ex: se pressionar C, E, G, Bb, ele detecta instantaneamente `C7`).

### 3. 🎤 Sincronizador de Áudio (Microfone)
*   **Web Audio API**: Solicita autorização de microfone para escutar o áudio ambiente do seu instrumento físico (ex: violão, teclado, voz).
*   **Algoritmo de Auto-Correlação**: Um analisador de frequência em tempo real calcula a frequência fundamental do som e mapeia qual nota tônica (A, B, C...) está sendo executada, sugerindo variações de acordes na hora.

### 4. 📖 Dicionário de Acordes Avançado
*   **Exploração Teórica**: Escolha uma tônica, o modo (Maior, Menor, Tétrades, Suspensos) e as inversões (Fundamental, 1ª, 2ª ou 3ª inversão).
*   **Sintetizador Integrado**: Ouça como o acorde soa através de osciladores nativos da Web Audio API que sintetizam o som das notas polifônicas instantaneamente.

---

## 📁 Estrutura de Arquivos Detalhada

*   `index.html`: Ponto de entrada do site. Configura metadados, links de fontes do Google (Inter, JetBrains Mono) e carrega os scripts globais (como o worker do `pdf.js`).
*   `src/main.tsx`: Inicializa a árvore de componentes do React 18 e monta o aplicativo no elemento `#root`.
*   `src/App.tsx`: O coração do projeto. Gerencia os estados de abas, conexões de hardware MIDI, manipulação de áudio do microfone, e define os componentes visuais principais (como o `PianoKeyboard`).
*   `src/components/`:
    *   `PdfUploader.tsx`: Componente responsável por ler arquivos PDF, decodificar os blocos de texto do PDF.js, realizar expressão regular para capturar os acordes e exibir a esteira de prática deslizante.
    *   `ChordInsightsPanel.tsx`: Painel lateral inteligente que traz sugestões, explicações e variações harmônicas do acorde atualmente selecionado.
    *   `UnifiedInputPanel.tsx`: Central de digitação manual de cifras de fácil uso.
    *   `SyncFeedbackBanner.tsx`: Banner superior elegante para feedbacks e notificações.
*   `src/utils/harmonyEngine.ts`: O motor de teoria musical. Contém matrizes de intervalos, conversores de símbolos de acordes para notas MIDI e frequências, e o algoritmo de rearmonização Jazz.
*   `src/data/chords.json`: Dicionário estático estruturado contendo as variações de acordes para o módulo dicionário.
*   `tsconfig.json`: Configurações do compilador do TypeScript, impondo tipagem forte e boas práticas.
*   `vite.config.ts`: Configurações de empacotamento ultrarrápido do Vite.
*   `metadata.json`: Metadados do aplicativo para integradores e controle de permissões de hardware (câmera, microfone).

---

## 🌐 Acesso Direto Online

O aplicativo está publicado e pronto para ser usado diretamente no seu navegador, sem necessidade de qualquer instalação ou configuração local:

👉 **[Acesse o KeyChord no Vercel (https://key-chord-app.vercel.app/)](https://key-chord-app.vercel.app/)**

Basta conectar seu teclado controlador MIDI físico na porta USB ou habilitar seu microfone e começar a praticar!

---

## 🎓 Desenvolvido em Processo de Vibe Coding

Este repositório serve como um excelente caso de estudo para recrutadores que queiram avaliar:
*   **Domínio de APIs de Hardware do Navegador** (Web MIDI e Web Audio).
*   **Manipulação de Arquivos e Binários Complexos** no frontend (PDF Parsing, FileReader, Uint8Array).
*   **Construção de Algoritmos Matemáticos** (frequências de notas, intervalos harmônicos, auto-correlação de Pitch).
*   **Componentização Limpa em React + TS** e maestria em estilização responsiva com **Tailwind CSS**.
