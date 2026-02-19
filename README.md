# Trampo-lin 🚀

> **Um salto na sua carreira.**

Trampo-lin é uma plataforma completa para criação de currículos e gestão de candidaturas, construída com **React + TypeScript** e potencializada pela **IA do Google Gemini**. Funciona 100% no navegador — sem backend, sem cadastro, sem complicação.

---

## ✨ Funcionalidades

### 📝 Editor de Currículos

- **Edição em tempo real** com preview instantâneo lado a lado
- **Histórico de undo/redo** para desfazer alterações
- **Ditado por voz** nas caixas de texto (Web Speech API)
- **Modo Foco** — esconde a navbar para uma experiência sem distrações
- **Modo Privacidade** — aplica blur nos dados pessoais durante apresentações
- **Completude do perfil** — barra de progresso que indica o quanto do currículo está preenchido
- **Drag & drop** para reordenar seções e itens de experiência/educação
- **Foto de perfil** com compressão automática para WebP

#### Seções suportadas
| Seção | Seção |
|---|---|
| Informações Pessoais | Habilidades (com nível 1–5) |
| Resumo Profissional | Idiomas |
| Experiência | Projetos |
| Educação | Certificações |
| Voluntariado | Prêmios |
| Publicações | Interesses |
| Referências | Seções Personalizadas |

---

### 🤖 Assistente de IA (Google Gemini / OpenRouter)

Todas as funções de IA são acionadas por botões dentro do editor. A chave de API pode ser configurada pelo usuário diretamente no app.

| Função | Descrição |
|---|---|
| **Melhorar Texto** | Reescreve descrições com tom profissional, criativo, acadêmico ou entusiasmado |
| **Corrigir Gramática** | Correção ortográfica e gramatical |
| **Encurtar / Expandir** | Ajusta o tamanho do texto mantendo o conteúdo |
| **Gerar Bullet Points** | Cria bullets orientados a resultados para experiências |
| **Gerar Resumo** | Cria um resumo profissional de alto impacto |
| **Sugerir Habilidades** | Sugere skills relevantes para o cargo informado |
| **Gerar Carta de Apresentação** | Cria carta personalizada para empresa e vaga |
| **Adaptar para Vaga** | Reescreve resumo e experiências para uma descrição de vaga específica |
| **Análise de Gaps** | Compara o CV com uma vaga e aponta o que falta |
| **Simulador de Entrevista** | Gera perguntas técnicas e comportamentais baseadas no perfil |
| **Estimativa Salarial** | Estima faixa salarial com base em cargo e experiência |
| **Tradução** | Traduz o currículo inteiro para Inglês ou Espanhol |
| **Análise de Foto** | Avalia a foto de perfil (iluminação, profissionalismo) via visão computacional |
| **Importar PDF** | Extrai dados de um currículo em PDF e preenche o editor automaticamente |
| **Análise ATS** | Pontua o currículo para sistemas de rastreamento de candidatos |

---

### 🎨 Temas e Customização

**9 temas profissionais incluídos:**

| Tema | Estilo |
|---|---|
| **Moderno Slate** | Sidebar esquerda, equilibrado — favorito dos recrutadores |
| **The CEO** | Coluna única, serifa elegante, minimalismo de alto nível |
| **Tech Lead** | Sidebar escura com accent cyan, alto contraste |
| **Creative Studio** | Cabeçalho com gradiente orgânico, para designers |
| **Swiss Grid** | Tipografia ousada, layout de revista, accent vermelho |
| **Startup Pop** | Jovem e dinâmico, fundo azul claro |
| **Ivy League** | Acadêmico, tons creme e marrom, fontes serifadas |
| **System.Out** | Estilo terminal, fonte monoespaçada, fundo verde |
| **Timeline Pro** | Sidebar direita com linha do tempo visual |

**Opções de customização:**
- Escala de fonte, espaçamento e margens
- Altura de linha
- Cor primária personalizada (16 presets + picker)
- Família tipográfica (11 fontes: Inter, Merriweather, Poppins, Raleway, Montserrat, Lato, Open Sans, Oswald, Playfair Display, Roboto Mono, Comic Neue)
- 7 combinações de fontes pré-definidas
- Estilo do cabeçalho: simples, sublinhado, caixa, barra lateral, gradiente
- Alinhamento do cabeçalho: esquerda, centro, direita
- Forma da foto: quadrada, arredondada, circular
- Estilo das habilidades: tags, barra, pontos, círculos, oculto
- Formato de data: MM/aaaa, Mmm aaaa, aaaa, completo
- Tamanho do papel: A4 ou Letter
- Padrão de fundo: nenhum, pontos, grade, linhas, geométrico
- Glassmorphism, marca d'água, modo compacto, escala de cinza, QR Code

---

### 💼 Gerenciador de Vagas (Job Tracker)

- **Quadro Kanban** com 5 colunas: Interesse → Aplicado → Entrevista → Oferta → Recusado
- **Drag & drop** para mover candidaturas entre etapas
- **Registro de data** com exibição de tempo decorrido
- Campos: empresa, cargo, URL da vaga, salário esperado, notas

---

### 🔗 Gerador de Perfil LinkedIn

Transforma seu currículo em conteúdo otimizado para o LinkedIn:

- **Headlines** — gera múltiplas opções de título profissional
- **Seção "Sobre"** — bio narrativa em formato storytelling
- **Experiências** — reescreve descrições técnicas como posts de conquistas

---

### 📤 Exportação

| Formato | Método |
|---|---|
| **PDF** | Impressão nativa do navegador (`Ctrl+P`) com layout otimizado |
| **Word (.doc)** | Exporta o HTML do preview como documento Word |
| **Texto (.txt)** | Exporta dados em texto puro |
| **JSON** | Exporta/importa o currículo completo para backup |

---

### 👤 Perfis Múltiplos

- Salve versões diferentes do currículo (ex: "Versão Backend", "Versão Freelancer")
- Carregue e alterne entre perfis com confirmação
- Dados persistidos no `localStorage`

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Estilização | Tailwind CSS 3 |
| Ícones | Lucide React |
| IA | Google Generative AI SDK (`@google/genai`) |
| Datas | date-fns 4 |
| Deploy | Netlify / Vercel (pronto para uso) |

---

## 📦 Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/trampo-lin.git
cd trampo-lin

# 2. Instale as dependências
npm install

# 3. (Opcional) Configure a API Key via variável de ambiente
# Crie um arquivo .env na raiz:
echo "API_KEY=sua_chave_google_ai_studio" > .env

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

> **Nota:** A API Key também pode ser inserida diretamente no app pelo ícone 🤖 na navbar, sem necessidade de arquivo `.env`. O app suporta tanto **Google Gemini** quanto **OpenRouter**.

---

## ☁️ Deploy

O projeto está pronto para deploy em qualquer plataforma estática.

**Netlify / Vercel:**
1. Importe o repositório
2. Configure a variável de ambiente `API_KEY` (opcional)
3. Comando de build: `npm run build`
4. Diretório de saída: `dist`

---

## 🔒 Privacidade

O Trampo-lin funciona **100% no navegador (client-side)**:
- Todos os dados são salvos no `localStorage` do seu navegador
- Nenhum dado é enviado a servidores externos, **exceto** o texto enviado à API de IA quando você aciona explicitamente uma função de IA
- Não há cadastro, login ou banco de dados

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Ctrl + P` | Baixar PDF |
| `Ctrl + S` | Confirmação de auto-save |
| `Ctrl + Z` | Desfazer |
| `Ctrl + Y` | Refazer |

---

## 📄 Licença

Open-source e gratuito para uso pessoal.
