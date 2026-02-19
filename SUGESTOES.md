# 🔍 Revisão do Trampo-lin — Sugestões e Melhorias

> Revisão realizada em: **Fevereiro 2026**
> Arquivos analisados: `App.tsx`, `Editor.tsx`, `geminiService.ts`, `integrationService.ts`, `types.ts`, `constants.ts`

---

## 🔴 Bugs / Problemas Reais

### 1. `prompt()` nativo para salvar perfil — `App.tsx:181`
```ts
const name = prompt("Nome para este perfil...", resumeData.profileName);
```
`window.prompt()` é bloqueado em iframes (ex: Netlify previews, embeds) e tem aparência inconsistente entre navegadores. Substitua por um modal inline com um `<input>` controlado.

---

### 2. `handleTxtExport` exporta dados incompletos — `App.tsx:229`
O export TXT só inclui `personalInfo` e `experience`. Educação, habilidades, projetos, certificações e idiomas são ignorados. O arquivo gerado é um currículo incompleto.

---

### 3. `handleDocxExport` gera `.doc`, não `.docx` — `App.tsx:213`
O arquivo exportado usa MIME `application/msword` e extensão `.doc` (formato Word 97). Isso não é um `.docx` real — é HTML disfarçado. Considere usar a biblioteca [`docx`](https://github.com/dolanmiu/docx) para gerar um `.docx` legítimo, ou ser honesto no label do botão ("Exportar HTML para Word").

---

### 4. `RESUME_DATA_VERSION` definido dentro do componente — `App.tsx:63`
```ts
const RESUME_DATA_VERSION = 2; // dentro do componente App
```
Constantes definidas dentro de componentes são recriadas a cada render. Mova para fora do componente (ou para `constants.ts`).

---

### 5. `useEffect` de resize é um no-op — `App.tsx:112`
```ts
const handleResize = () => { /* Auto-fit logic if needed */ };
```
O handler está vazio. O `addEventListener` e `removeEventListener` estão sendo chamados sem efeito. Remova ou implemente.

---

### 6. `togglePrivacyMode` usa estado desatualizado — `App.tsx:177`
```ts
setToastMessage(resumeData.settings.privacyMode ? "Desativado" : "Ativado");
```
A mensagem usa `resumeData.settings.privacyMode` **antes** do `setResumeData` ser processado, então a mensagem fica invertida. Use a forma funcional:
```ts
const next = !resumeData.settings.privacyMode;
setResumeData(prev => ({ ...prev, settings: { ...prev.settings, privacyMode: next } }));
setToastMessage(next ? "Modo Privacidade Ativado" : "Desativado");
```

---

### 7. `handleChangeWithHistory` nos handlers de IA sem try/catch — `Editor.tsx`
Funções como `handleAICoverLetter`, `handleAIGenerateSummary`, `handleTailorResume` etc. não têm `try/catch`. Se a API falhar, `setLoadingAI(null)` nunca é chamado e o spinner fica preso indefinidamente.

---

### 8. `handleGithubImport` gera IDs com `Date.now() + Math.random()` — `Editor.tsx:398`
```ts
id: Date.now() + Math.random().toString()
```
Isso concatena um número com uma string, gerando IDs como `"17082345670.123456789"`. Use `crypto.randomUUID()` ou `Date.now().toString() + Math.random().toString(36).slice(2)`.

---

### 9. `translateResumeData` não traduz `volunteer`, `awards`, `publications` — `geminiService.ts`
O batch de tradução cobre `experience`, `education` e `projects`, mas ignora `volunteer`, `awards`, `publications` e `customSections`, que também têm texto traduzível.

---

### 10. `safeMergeResume` não preserva arrays opcionais — `Editor.tsx:69`
```ts
experience: imported.experience || [],
education: imported.education || [],
```
Arrays como `volunteer`, `awards`, `publications`, `interests`, `references`, `customSections` não são tratados — se o JSON importado não os tiver, eles ficam como `undefined` no objeto resultante, podendo causar erros em `.map()`.

---

## 🟡 Performance / Qualidade de Código

### 11. Undo/redo recria o event listener a cada mudança de histórico — `Editor.tsx:232`
```ts
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  ...
}, [historyIndex, history]); // recria a cada undo/redo
```
Use `useCallback` para `undo` e `redo`, e inclua-os como dependências estáveis, ou use `useRef` para guardar os valores mais recentes.

---

### 12. `calculateCompleteness` recalcula a cada render — `Editor.tsx:265`
A função é chamada diretamente no corpo do componente sem `useMemo`. Com um currículo grande, isso roda em cada digitação. Envolva com `useMemo`.

---

### 13. `Editor.tsx` tem ~800 linhas — God Component
O componente acumula: estado de UI, lógica de IA, drag & drop, undo/redo, upload de imagem, exportação JSON, speech recognition, e renderização de todas as seções. Sugestão de divisão:
- `useEditorHistory` — hook para undo/redo
- `useAIActions` — hook para todas as chamadas de IA
- `PersonalInfoSection`, `ExperienceSection`, etc. — componentes de seção
- `EditorToolbar` — barra de utilitários

---

### 14. `App.tsx` tem ~460 linhas com múltiplas responsabilidades
Exportações (TXT, DOCX), gerenciamento de perfis, configuração de IA, zoom, impressão e navegação estão todos no mesmo componente. Extraia pelo menos `useProfileManager` e `useExportHandlers` como hooks customizados.

---

### 15. `extractDominantColor` usa apenas 1 pixel — `integrationService.ts:53`
```ts
canvas.width = 1; canvas.height = 1;
ctx.drawImage(img, 0, 0, 1, 1);
```
Reduzir para 1×1 dá a cor média de toda a imagem, que geralmente é um cinza neutro. Para extrair a cor dominante de verdade, use uma amostragem de ~10×10 pixels e calcule a mediana ou o cluster mais frequente.

---

## 🟢 UX / Experiência do Usuário

### 16. Onboarding não pode ser revisitado
Após fechar o onboarding, não há como reabri-lo. Adicione um botão "Ver Tutorial" nas configurações ou no menu de ajuda.

---

### 17. Modo Privacidade não persiste visualmente ao recarregar
O `privacyMode` é salvo no `resumeData` (que persiste), mas não há indicação visual clara no carregamento de que o modo está ativo. Considere um banner ou badge no navbar.

---

### 18. Nenhum feedback de erro nas chamadas de IA
Quando uma chamada de IA falha, o toast mostra apenas "Erro ao adaptar." sem detalhes. Exiba mensagens mais descritivas (ex: "API Key inválida", "Limite de requisições atingido", "Sem conexão").

---

### 19. Modais sem "focus trap" (acessibilidade)
Os modais (AI Settings, Tailor, Gap Analysis) não prendem o foco dentro deles. Usuários de teclado podem navegar para elementos fora do modal. Implemente focus trap com `Tab`/`Shift+Tab` ou use uma biblioteca como `focus-trap-react`.

---

### 20. `img` da foto sem `alt` — `Editor.tsx:524`
```tsx
<img src={data.personalInfo.photoUrl} className="w-full h-full object-cover" />
```
Sem atributo `alt`, leitores de tela não conseguem descrever a imagem. Use `alt={`Foto de ${data.personalInfo.fullName}`}`.

---

### 21. Nenhuma confirmação antes de fechar o modal de AI Settings com alterações não salvas
Se o usuário editar a API key e clicar fora do modal (no backdrop), as alterações são perdidas silenciosamente.

---

## 🔒 Segurança / Dados

### 22. Fotos em base64 no `localStorage` podem esgotar o limite de 5–10MB
Com múltiplos perfis salvos com fotos, o `localStorage` pode atingir o limite do navegador. Considere:
- Armazenar fotos no `IndexedDB` (sem limite prático)
- Ou avisar o usuário quando o tamanho total dos dados for > 3MB

---

### 23. `handleDocxExport` usa `innerHTML` diretamente — `App.tsx:214`
```ts
const content = document.getElementById('resume-paper')?.innerHTML;
```
Isso inclui qualquer HTML do DOM, incluindo elementos de UI ocultos. Além disso, se o conteúdo tiver scripts injetados via dados do usuário, isso poderia ser um vetor XSS no arquivo exportado. Sanitize o HTML antes de exportar.

---

## 📦 Dependências / Infraestrutura

### 24. `tsconfig.json` não inclui tipos de `node` e `react`
Os erros de lint (`Cannot find module 'react'`, `Cannot find name 'process'`) indicam que `@types/react`, `@types/react-dom` e `@types/node` não estão instalados ou o `tsconfig.json` não os referencia. Isso não impede o build do Vite, mas prejudica o DX (autocomplete, type checking).

**Fix:**
```bash
npm i -D @types/react @types/react-dom @types/node
```

---

### 25. Modelo de IA hardcoded como fallback — `geminiService.ts:6`
```ts
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
```
Se o modelo for descontinuado, todas as chamadas falharão silenciosamente. Considere expor isso como uma constante em `constants.ts` e documentar como atualizar.

---

## ✅ Resumo por Prioridade

| Prioridade | Item | Arquivo |
|---|---|---|
| 🔴 Alta | #7 — Spinner preso em erro de IA | `Editor.tsx` |
| 🔴 Alta | #6 — Toast de privacidade invertido | `App.tsx` |
| 🔴 Alta | #2 — TXT export incompleto | `App.tsx` |
| 🟡 Média | #1 — `prompt()` nativo | `App.tsx` |
| 🟡 Média | #10 — `safeMergeResume` incompleto | `Editor.tsx` |
| 🟡 Média | #9 — Tradução batch incompleta | `geminiService.ts` |
| 🟡 Média | #12 — `calculateCompleteness` sem `useMemo` | `Editor.tsx` |
| 🟡 Média | #22 — localStorage com fotos | `App.tsx` |
| 🟢 Baixa | #13/#14 — Refatoração God Components | `Editor.tsx`, `App.tsx` |
| 🟢 Baixa | #16 — Onboarding revisitável | `App.tsx` |
| 🟢 Baixa | #19 — Focus trap em modais | Vários |
| 🟢 Baixa | #24 — Tipos TypeScript faltando | `tsconfig.json` |
