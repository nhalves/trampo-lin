# 🔍 Revisão do Trampo-lin — Sugestões v2

> Revisão realizada em: **Fevereiro 2026**
> Arquivos analisados: `App.tsx`, `geminiService.ts`, `integrationService.ts`
> Esta é uma segunda rodada — itens já corrigidos da v1 foram excluídos.

---

## 🔴 Bugs / Problemas Reais

### 1. `getAIConfig` não tem validação — `geminiService.ts:80`
```ts
const saved = localStorage.getItem('trampolin_ai_config');
if (saved) return JSON.parse(saved);
```
Se o JSON salvo estiver corrompido (ex: tab abortada, escrita parcial), `JSON.parse` lança uma exceção não capturada que quebra o carregamento da aplicação inteira. Envolva em `try/catch`:
```ts
try { return JSON.parse(saved); } catch { /* cai no fallback */ }
```

---

### 2. `validateConnection` (OpenRouter) não verifica o status HTTP — `geminiService.ts:534`
```ts
await fetch("https://openrouter.ai/api/v1/chat/completions", { ... });
return true; // sempre true, mesmo com 401!
```
O resultado do `fetch` é ignorado. Uma API Key inválida retorna HTTP 401, mas `validateConnection` retorna `true`. Verifique `response.ok` antes de retornar.

---

### 3. `saveProfile` usa `Date.now()` como ID — `App.tsx:182`
```ts
const newProfile = { ...resumeData, id: Date.now().toString(), profileName: name };
```
Se dois perfis forem salvos no mesmo milissegundo (ex: duplo clique rápido), os IDs colidem e `deleteProfile` apagará ambos ao filtrar por `id`. Use `crypto.randomUUID()`.

---

### 4. `handleGlobalKeyDown` re-registra a cada mudança de `resumeData` — `App.tsx:144`
```ts
useEffect(() => {
  window.addEventListener('keydown', handleGlobalKeyDown);
  ...
}, [resumeData]); // ← desnecessário
```
O handler usa `resumeData` apenas para o shortcut `Ctrl+P`, que só chama `setIsPrinting(true)` e `setToastMessage`. Nenhum dos dois precisa de `resumeData` no closure. A dependência faz com que o listener seja removido e re-adicionado a cada keystroke, o que é um vazamento de performance. Remova `resumeData` das dependências ou use `useRef` para o dado necessário.

---

### 5. `handleCloseAISettings` usa `window.confirm()` — `App.tsx:278`
```ts
if (!window.confirm('Você tem alterações não salvas. Deseja descartar?')) return;
```
O mesmo problema do `prompt()` nativo (#1 da v1): bloqueado em iframes, aparência inconsistente. Reutilize o `ConfirmDialog` já existente no projeto (`requestConfirm`).

---

### 6. `estimateSalary` usa cálculo incorreto de experiência — `geminiService.ts:364`
```ts
`${data.experience.length * 2} years exp approximate`
```
Isso multiplica o **número de empregos** por 2, não a duração real. Uma pessoa com 3 empregos de 6 meses cada seria estimada como tendo 6 anos de experiência. Calcule a diferença real entre datas, ou remova a heurística e deixe a IA inferir a partir dos dados brutos.

---

### 7. `handleTxtExport` não exporta `volunteer`, `awards`, `publications` — `App.tsx:232`
A v1 apontou que o export era incompleto (faltavam education/skills/etc). Esses foram adicionados, mas `volunteer`, `awards`, `publications` e `customSections` ainda ficam de fora do TXT gerado.

---

## 🟡 Performance / Qualidade de Código

### 8. `callLLM` lê `getAIConfig()` a cada chamada — `geminiService.ts:120`
```ts
const callLLM = async (prompt, schema?) => {
  const config = getAIConfig(); // lê localStorage a cada chamada de IA
```
`localStorage.getItem` é síncrono e bloqueia o thread principal (I/O síncrono no browser). Para features como tradução em batch que fazem múltiplas chamadas, isso vira um padrão repetido. Passe `config` como parâmetro ou use um módulo com cache em memória.

---

### 9. `tailorResume` envia `JSON.stringify(data.personalInfo)` mas ignora `skills` — `geminiService.ts:279`
```ts
const prompt = `...RESUME: ${JSON.stringify(data.personalInfo)} & Experience IDs: ${data.experience.map(e => e.id).join(', ')}...`
```
As **habilidades** do candidato não são enviadas à IA durante o tailoring, mas são justamente elas que deveriam ser confrontadas com as keywords da vaga para o ATS. Inclua `data.skills.map(s => s.name)` no prompt.

---

### 10. `showProfileMenu` não fecha ao clicar fora — `App.tsx:344`
O dropdown de perfis não tem um listener de `mousedown` no `document` para fechar ao clicar fora. O usuário precisa clicar no botão novamente para fechar. Outros menus da navbar têm comportamento similar. Implemente um hook `useClickOutside` reutilizável.

---

### 11. `fetchGithubRepos` não diferencia erros HTTP — `integrationService.ts:22`
```ts
if (!response.ok) {
  console.error("GitHub API Error:", response.statusText);
  return null;
}
```
Um erro `404` (usuário não encontrado) e um erro `403` (rate limit da GitHub API) retornam o mesmo `null` sem nenhuma distinção. O usuário vê o mesmo comportamento para "digitei errado" e "limite excedido". Retorne objetos de erro distintos ou lance exceções tipadas.

---

### 12. `Toast` recria o timer a cada re-render se `onClose` mudar — `App.tsx:16`
```ts
useEffect(() => { const t = setTimeout(onClose, 3000); ... }, [onClose]);
```
`onClose` é `() => setToastMessage(null)` definido inline no JSX, então é uma nova referência a cada render. Com React StrictMode (duplo mount), dois timers são criados. Estabilize `onClose` com `useCallback` no componente pai, ou use `useRef` para o timer dentro do `Toast`.

---

## 🟢 UX / Experiência do Usuário

### 13. Nenhuma paginação / indicador de múltiplas páginas no Preview
O currículo é renderizado em uma única div com `minHeight`. Se o conteúdo ultrapassar uma página A4, o overflow fica invisível até a impressão. Adicione um indicador visual de "quebra de página" no preview (ex: uma linha tracejada a cada 297mm de conteúdo).

---

### 14. Perfis salvos não têm data de criação visível
O menu de perfis exibe apenas o nome. Com múltiplos perfis, fica difícil saber qual é o mais recente. Exiba a data de criação (o `id` já tem o timestamp do `Date.now()` — use-o enquanto não migrar para UUID).

---

### 15. Zoom não persiste entre sessões — `App.tsx:29`
```ts
const [zoom, setZoom] = useState(0.8);
```
O nível de zoom é resetado para 0.8 a cada reload. Para usuários com monitores menores que ajustam o zoom manualmente, isso é um atrito constante. Persista no `localStorage` com uma chave `trampolin_zoom`.

---

### 16. Botão "Baixar" aciona `window.print()` sem aviso — `App.tsx:377`
O botão rotulado "Baixar" (ícone de impressora) abre o diálogo de impressão do navegador, não faz um download direto de PDF. Isso é confuso para usuários leigos. Considere renomear para "Imprimir / PDF" ou adicionar um tooltip mais explícito como "Imprimir como PDF (Ctrl+P)".

---

### 17. `analyzeJobMatch` aceita apenas Gemini para PDF — `geminiService.ts:313`
```ts
if (typeof resumeInput !== 'string') {
  // usa inlineData — só funciona com Gemini
}
```
Se o usuário configurou OpenRouter como provedor e tenta usar "Upload de PDF", o `inlineData` é serializado como JSON e enviado à API como texto, o que certamente falha. Detecte o provider e exiba um aviso antes da chamada, ou desabilite o upload de PDF para OpenRouter.

---

## 🔒 Segurança / Dados

### 18. API Key salva sem criptografia no `localStorage` — `geminiService.ts:85`
```ts
localStorage.setItem('trampolin_ai_config', JSON.stringify(config));
```
A chave de API fica legível por qualquer script da mesma origem, extensões de browser, e por qualquer pessoa com acesso físico ao navegador. Considere:
- Obfuscar com `btoa` (mínimo, mas melhor que nada)
- Usar `sessionStorage` para que a chave não persista após fechar o browser
- Ou documentar claramente o risco para o usuário

---

### 19. `fetchGithubRepos` expõe dados do usuário sem confirmação — `integrationService.ts:20`
A função faz uma requisição externa ao GitHub usando o username digitado pelo usuário sem qualquer confirmação de privacidade. Se o usuário estiver num ambiente corporativo com proxy que loga requisições, isso pode vazar o username sem consentimento. Adicione um aviso na UI antes da primeira requisição.

---

## 📦 Dependências / Infraestrutura

### 20. `RESUME_SCHEMA` em `geminiService.ts` está desatualizado — `geminiService.ts:19`
O schema enviado para o LLM durante a extração de PDFs (`extractResumeFromPdf`) não inclui campos como `projects`, `certifications`, `volunteer`, `awards`, `publications`. Se o PDF tiver projetos ou certificações, a IA nunca os extrai para o JSON. Sincronize o schema com o tipo `ResumeData` em `types.ts`.

---

### 21. Nenhum mecanismo de retry nas chamadas de IA
Erros transitórios de rede (ex: timeout, `ETIMEDOUT`) fazem o usuário ver a mensagem de erro e ter que clicar novamente. Implemente um retry automático com backoff exponencial (1 tentativa extra após 1s) para erros de rede, mas **não** para erros de autenticação (401/403).

---

## ✅ Resumo por Prioridade

| Prioridade | Item | Arquivo |
|---|---|---|
| 🔴 Alta | #2 — `validateConnection` sempre retorna `true` | `geminiService.ts` |
| 🔴 Alta | #1 — `getAIConfig` sem try/catch | `geminiService.ts` |
| 🔴 Alta | #5 — `window.confirm` no fechar modal IA | `App.tsx` |
| 🟡 Média | #4 — `useEffect` global keydown depende de `resumeData` desnecessariamente | `App.tsx` |
| 🟡 Média | #6 — cálculo incorreto de anos de experiência | `geminiService.ts` |
| 🟡 Média | #9 — skills não enviadas ao tailoring | `geminiService.ts` |
| 🟡 Média | #17 — PDF upload incompatível com OpenRouter | `geminiService.ts` |
| 🟡 Média | #20 — `RESUME_SCHEMA` desatualizado | `geminiService.ts` |
| 🟢 Baixa | #3 — ID de perfil com Date.now() | `App.tsx` |
| 🟢 Baixa | #10 — dropdown não fecha ao clicar fora | `App.tsx` |
| 🟢 Baixa | #13 — indicador de quebra de página | `Preview` |
| 🟢 Baixa | #15 — zoom não persiste | `App.tsx` |
| 🟢 Baixa | #18 — API Key em plaintext no localStorage | `geminiService.ts` |
| 🟢 Baixa | #21 — sem retry automático nas chamadas de IA | `geminiService.ts` |
