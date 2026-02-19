# 💡 SUGESTÕES v4 — Trampo-lin

> **Status do app:** Features v1-v3 todas aplicadas e funcionando.
> Este documento foca em features **novas de alto impacto** que ainda não existem no app.

---

## 🏆 PRIORIDADE MÁXIMA (ROI alto, implementação viável)

---

### 1. 🖱️ Click-to-Edit no Preview
**O que é:** Clicar diretamente em qualquer texto no preview (nome, cargo, descrição) abre o campo correspondente no editor, com scroll automático até ele.

**Por que:** Elimina o maior ponto de fricção — o usuário precisa "encontrar" o campo no editor. Edição visual direta é o padrão ouro (Canva, Figma).

**Como:** `data-field="personalInfo.fullName"` em cada elemento do Preview. Click listener dispara `setOpenSection` + `scrollIntoView`.

---

### 2. 🔗 Compartilhamento por URL
**O que é:** Botão "Compartilhar" gera uma URL com os dados do CV codificados em Base64 ou salvos num backend mínimo (ex: pastebin-like via API gratuita). Link abre o CV em modo leitura.

**Por que:** Usuário manda o link pro recrutador em vez de baixar PDF. Diferencial competitivo enorme.

**Implementação simples:** `LZString.compressToEncodedURIComponent(JSON.stringify(data))` → URL param `?cv=...`. No load, se `?cv=` existe, descomprime e aplica.

---

### 3. 🎮 Modo Gamificado — Achievement Badges
**O que é:** Badges desbloqueáveis conforme o usuário preenche o currículo. Aparecem com animação `bounce-in` + toast.

| Badge | Condição |
|---|---|
| 🌟 Primeiro Passo | Adicionou o nome |
| 💼 Veterano | 3+ experiências |
| 🎓 Estudioso | 2+ formações |
| 🔥 Ninja das Skills | 8+ skills |
| 📸 Profissional | Foto adicionada |
| ✨ Currículo Perfeito | Score = 100 |

**Por que:** Engajamento e retenção. Usuários voltam mais ao app para "completar" o currículo.

---

### 4. 📊 Skills Radar Chart
**O que é:** Na aba de Ferramentas, um gráfico aranha (radar/spider) mostrando as skills do usuário com seus níveis visualmente.

**Como:** SVG puro — polígono com pontos calculados em ângulos regulares. Sem dependência externa.

**Por que:** Muito mais visual que a lista de barrinhas. O Preview já mostra nível numericamente; o radar dá uma visão holística.

---

### 5. 📋 Seção de Drag & Drop de Seções (reordenar seções inteiras)
**O que é:** Handles `⠿` nos headers das Sections do editor permitem reordenar a ordem das seções no currículo (ex: Experiência antes de Educação ou vice-versa).

**Como:** Adicionar `sectionOrder: string[]` no `ResumeSettings`. O Preview renderiza seções na ordem definida. Editor mostra as Sections em ordem com handles de drag.

**Por que:** Candidatos de diferentes áreas têm necessidades opostas (tech: skills antes; academia: educação antes).

---

## 🎨 VISUAL / UX

---

### 6. 🌈 Gradiente de Fundo do Preview Personalizável
**O que é:** Painel no preview que permite escolher a cor de fundo da área ao redor do documento (atualmente só dot grid cinza). Opções: cores sólidas vibrantes, gradientes.

**Por que:** Screenshots do CV ficam muito mais bonitos para postar no LinkedIn.

---

### 7. 📱 Editor Mobile Repaginado (Touch-First)
**O que é:** Em telas < 768px, o editor vira um flow vertical estilo wizard — só mostra uma seção por vez com botão "Próxima" e barra de progresso.

**Por que:** Muitos usuários tentam usar no celular e a experiência atual é apertada.

---

### 8. 🖨️ Print Quality Checklist
**O que é:** Modal pré-impressão que checa: ✅ foto presente, ✅ email preenchido, ✅ resumo ≥ 50 chars, ✅ pelo menos 1 experiência, ⚠️ URLs muito longas.

**Por que:** Evita o usuário imprimir um currículo incompleto sem perceber.

---

### 9. ⌨️ Command Palette (Cmd+K)
**O que é:** Paleta de comandos estilo VS Code / Linear. `Cmd+K` abre um modal com busca de ações: "Novo cargo", "Gerar resumo", "Mudar tema", "Exportar PDF", etc.

**Por que:** Power users adoram. Diferencia o produto como "pro".

**Como:** Array de comandos + input de busca filtrado + navegação por teclado.

---

### 10. 🌗 Tema por Horário
**O que é:** Opção "Automático" no dark mode que ativa modo escuro entre 18h–7h baseado no horário do sistema.

**Como:** `const hour = new Date().getHours(); setDarkMode(hour >= 18 || hour < 7)` — com re-check a cada minuto.

---

## 🤖 IA AVANÇADA

---

### 11. 💬 Chat com o Currículo (AI Coach)
**O que é:** Widget de chat flutuante onde o usuário conversa com uma IA que conhece seu currículo. Perguntas como "Como posso melhorar meu resumo?" ou "Que certificações devo buscar para virar Tech Lead?".

**Por que:** Feature aspiracional que diferencia muito. O contexto já está todo disponível via `data` do currículo.

---

### 12. 🔄 Comparar Versões (Snapshot Visual)
**O que é:** Salvar snapshots nomeados do currículo (ex: "Versão LinkedIn", "Versão Startup"). Tela de comparação side-by-side mostra as diferenças entre versões.

**Por que:** O usuário já tem `savedProfiles` mas sem comparação visual. Muito pedido em ferramentas de CV.

---

### 13. 🌍 Localização por País
**O que é:** Seletor de "País alvo" (BR, PT, US, UK...) que adapta automaticamente: formato de data, ordem dos campos (ex: nos EUA não colocam foto), moeda do salário estimado.

**Por que:** Muitos usuários brasileiros estão aplicando para vagas internacionais.

---

### 14. 📈 Score Timeline
**O que é:** Gráfico de linha mostrando a evolução do score do currículo ao longo do tempo (salvo no localStorage a cada sessão).

**Como:** `{ date: Date.now(), score: completeness }[]` no localStorage. Sparkline SVG simples.

**Por que:** Visualizar progresso motiva o usuário a continuar melhorando.

---

## 🔧 TÉCNICO / QUALIDADE

---

### 15. ♿ Modo Acessibilidade (Alto Contraste + Fonte Dislexia)
**O que é:** Toggle no painel de configurações que ativa: fonte Comic Neue (dyslexic), contraste 4.5:1 mínimo, foco visível em todos os elementos.

**Por que:** Inclusividade e diferencial do produto. A fonte Comic Neue já está carregada no app.

---

### 16. 💾 Auto-Save com Indicador Visual
**O que é:** Indicador discreto no canto do editor: "Salvo às 14:32" que pisca quando há dados não salvos. Auto-save a cada 30s no localStorage além do debounce atual.

**Por que:** Confiança do usuário. Medo de perder dados é o maior bloqueio para engajamento.

---

### 17. 📤 Import via Clipboard
**O que é:** Pasta um JSON diretamente (`Ctrl+V` na página) ou um link do LinkedIn e o app tenta extrair os dados.

**Como:** `document.addEventListener('paste', ...)` — detecta clipboard com JSON válido e oferece importar.

---

### 18. 🔔 Notificações de Atualização
**O que é:** Banner discreto no topo "Seu currículo não é atualizado há 30 dias. Que tal revisar?" — baseado em `lastUpdated` salvo no localStorage.

**Por que:** Retenção e reengajamento de usuários que já criaram o CV mas esqueceram do app.

---

## 📌 RESUMO DE PRIORIZAÇÃO

| # | Feature | Impacto | Dificuldade |
|---|---|---|---|
| 1 | Click-to-Edit no Preview | ⭐⭐⭐⭐⭐ | Média |
| 2 | Compartilhamento por URL | ⭐⭐⭐⭐⭐ | Fácil |
| 3 | Achievement Badges | ⭐⭐⭐⭐ | Fácil |
| 4 | Skills Radar (SVG) | ⭐⭐⭐⭐ | Média |
| 5 | Seções Drag & Drop | ⭐⭐⭐⭐ | Difícil |
| 9 | Command Palette (Cmd+K) | ⭐⭐⭐⭐ | Média |
| 11 | Chat AI Coach | ⭐⭐⭐⭐⭐ | Média |
| 16 | Auto-save Indicator | ⭐⭐⭐⭐ | Fácil |
