# SUGESTOES_v3.md — Trampo-lin

> Análise pós-v2. Foco em: `Editor.tsx`, `JobTracker.tsx`, `Preview.tsx`.
> Todos os problemas abaixo são **novos** — não cobertos nas versões anteriores.

---

## 🔴 BUGS

### #1 — `handleRunAtsAnalysis` sem try/catch → spinner infinito
**Arquivo:** `Editor.tsx` — linha 442–450  
**Problema:** O handler não está envolto em try/catch. Se `analyzeJobMatch` lançar erro, `setLoadingAI(null)` nunca é chamado, travando o spinner.  
**Correção:**
```ts
const handleRunAtsAnalysis = async () => {
  if (!jobDescription) { onShowToast("Cole a descrição da vaga."); return; }
  setLoadingAI('ats');
  try {
    let input: any = JSON.stringify(data);
    if (atsFile) { input = { mimeType: atsFile.mimeType, data: atsFile.data }; }
    const result = await analyzeJobMatch(input, jobDescription);
    setAtsResult(result);
  } catch (e: any) {
    onShowToast(`Erro ATS: ${e?.message || 'Falha na análise'}`);
  } finally {
    setLoadingAI(null);
  }
};
```

---

### #2 — `handleConvertToEditor` sem try/catch → spinner infinito
**Arquivo:** `Editor.tsx` — linha 426–440  
**Problema:** `extractResumeFromPdf` pode lançar erro (ex: OpenRouter + PDF). O `setLoadingAI(null)` fica fora do try e não é chamado em erros lançados.  
**Correção:** Envolver o corpo da callback de `onRequestConfirm` em try/catch/finally:
```ts
onRequestConfirm("Converter PDF?", "Isso irá sobrescrever os dados atuais.", async () => {
  setLoadingAI('convert-pdf');
  try {
    const extractedData = await extractResumeFromPdf(atsFile!);
    if (extractedData) {
      const mergedData = safeMergeResume(INITIAL_RESUME, extractedData);
      handleChangeWithHistory(mergedData);
      onShowToast("Currículo convertido!");
      setActiveTab('resume');
    } else {
      onShowToast("Erro ao converter.");
    }
  } catch (e: any) {
    onShowToast(`Erro: ${e?.message || 'Falha na conversão'}`);
  } finally {
    setLoadingAI(null);
  }
}, 'danger');
```

---

### #3 — `addItem` e `duplicateItem` usam `Date.now()` para IDs
**Arquivo:** `Editor.tsx` — linhas 453 e 456  
**Problema:** Dois cliques rápidos podem gerar IDs idênticos. Já corrigido em `saveProfile` (v2 #3) e em `handleGithubImport` (v2 #8), mas faltou nestes dois lugares.  
**Correção:**
```ts
// addItem (linha 453)
const addItem = (listName: string, item: any) => {
  handleChangeWithHistory({ ...data, [listName]: [{ ...item, id: crypto.randomUUID() }, ...(data as any)[listName]] });
  onShowToast("Item adicionado.");
};

// duplicateItem (linha 456)
const duplicateItem = (listName: string, index: number) => {
  const list = [...(data as any)[listName]];
  const item = { ...list[index], id: crypto.randomUUID() };
  list.splice(index + 1, 0, item);
  handleChangeWithHistory({ ...data, [listName]: list });
  onShowToast("Duplicado.");
};
```

---

### #4 — `SpeechRecognition` não é limpo ao desmontar componente
**Arquivo:** `Editor.tsx` — linha 143–154 (`DebouncedTextarea`)  
**Problema:** Se o componente for desmontado enquanto `isListening === true`, o `recognition` continua rodando em background, consumindo microfone e causando `onerror`.  
**Correção:** Adicionar cleanup no `useEffect`:
```ts
useEffect(() => {
  return () => {
    // Para o reconhecimento ao desmontar
    recognitionRef.current?.stop();
  };
}, []);
```

---

### #5 — `deleteJob` usa `window.confirm` nativo no `JobTracker`
**Arquivo:** `JobTracker.tsx` — linha 42  
**Problema:** `confirm()` bloqueia a thread e não funciona em iframes (mesmo problema corrigido em `App.tsx` com `ConfirmDialog`). O jobTracker não tem acesso ao `onRequestConfirm` do App, mas pode ter seu próprio estado de confirmação interno.  
**Correção sugerida:** Adicionar um estado de confirmação inline simples no `JobTracker`:
```ts
const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

// Em vez de:
const deleteJob = (id: string) => { if(confirm('Remover?')) saveJobs(...) };

// Usar:
const deleteJob = (id: string) => setConfirmDelete(id);
// + botão de confirmação inline na UI do card
```

---

### #6 — `addSkill` inlined usa `Date.now() + Math.random()` — formatação incorreta
**Arquivo:** `Editor.tsx` — linha 662  
**Problema:** O código usa `Date.now() + Math.random().toString()` (concatenação numérica + string), gerando IDs como `"17406824571230.12345"` em vez da forma intencional. Usar `crypto.randomUUID()`.  
```ts
// Atual (bugado):
const newSkills = suggestions.map(n => ({ id: Date.now() + Math.random().toString(), name: n, level: 3 }));

// Correto:
const newSkills = suggestions.map(n => ({ id: crypto.randomUUID(), name: n, level: 3 }));
```

---

## 🟡 PERFORMANCE

### #7 — `resumeTextContent` e `wordCount` recalculados a cada render
**Arquivo:** `Editor.tsx` — linhas 295–304  
**Problema:** As variáveis `resumeTextContent`, `wordCount` e `readingTime` são calculadas inline no corpo do componente, recalculando em cada render mesmo quando os dados não mudaram.  
**Correção:**
```ts
const { wordCount, readingTime } = useMemo(() => {
  const text = [
    data.personalInfo.fullName,
    data.personalInfo.summary,
    ...data.experience.map(e => `${e.role} ${e.company} ${e.description}`),
    ...data.education.map(e => `${e.school} ${e.degree} ${e.description}`),
    ...data.projects.map(p => `${p.name} ${p.description}`),
    data.coverLetter.content,
  ].filter(Boolean).join(' ');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { wordCount: words, readingTime: Math.ceil(words / 200) };
}, [data]);
```

---

### #8 — `MarkdownText` usa index como key em linhas e parts
**Arquivo:** `Preview.tsx` — linhas 46–56  
**Problema:** As keys `i` e `j` são índices, o que pode causar re-renders desnecessários quando o texto muda. Para partes inline sem ID natural, uma key composta funciona melhor.  
**Correção:** Usar key composta em vez de índice puro para as partes inline (não é crítico, mas melhora o diffing do React):
```tsx
// parts.map((part, j) => ...) com key={`${i}-${j}`}
```

---

### #9 — `handleChangeWithHistory` recria `history` array a cada mudança sem limite eficiente
**Arquivo:** `Editor.tsx` — linhas 259–267  
**Problema:** O array `history` pode ter até 50 entradas, e `history.slice(0, historyIndex + 1)` é chamado em todo keypress via `DebouncedInput` (após 400ms). Com documentos grandes (`resumeData` pode ter mais de 50KB), cada entrada no history ocupa memória significativa.  
**Sugestão:** Considerar limitar o histórico a 20 entradas (balancing UX vs memória):
```ts
if (newHistory.length > 20) newHistory.shift();
```

---

## 🟢 UX / ACESSIBILIDADE

### #10 — Campo de busca no `JobTracker` importado mas sem implementação
**Arquivo:** `JobTracker.tsx` — linha 4 (importa `Search`)  
**Problema:** O ícone `Search` é importado mas nunca renderizado. A UI do Kanban não tem campo de busca, tornando difícil encontrar vagas quando há muitas.  
**Sugestão:** Adicionar um `<input>` de busca no header que filtre as vagas exibidas:
```tsx
const [search, setSearch] = useState('');
const colJobs = jobs.filter(j => j.status === col.id && 
  (j.role.toLowerCase().includes(search) || j.company.toLowerCase().includes(search)));
```

---

### #11 — Botão de fechar modal Tailor/Gap não tem tecla Escape
**Arquivo:** `Editor.tsx` — linhas 825–870  
**Problema:** Os modais `showTailorModal` e `showGapModal` não fecham ao pressionar `Escape`. Isso é comportamento esperado para modais acessíveis.  
**Correção:** Adicionar um `useEffect` de keydown para cada modal (ou um único handler compartilhado):
```ts
useEffect(() => {
  if (!showTailorModal && !showGapModal) return;
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowTailorModal(false);
      setShowGapModal(false);
    }
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [showTailorModal, showGapModal]);
```

---

### #12 — `suggestSkills` handler inlined sem try/catch
**Arquivo:** `Editor.tsx` — linha 662  
**Problema:** O handler da sugestão de skills está inlined no JSX e não tem try/catch. Se `suggestSkills` lançar erro, o spinner fica travado.  
**Correção:** Extrair para função nomeada com try/catch/finally:
```ts
const handleSuggestSkills = async () => {
  setLoadingAI('skills');
  try {
    const suggestions = await suggestSkills(data.personalInfo.jobTitle);
    if (suggestions.length) {
      const newSkills = suggestions.map(n => ({ id: crypto.randomUUID(), name: n, level: 3 }));
      handleChangeWithHistory({ ...data, skills: [...data.skills, ...newSkills] });
      onShowToast(`✨ ${newSkills.length} skills sugeridas!`);
    } else {
      onShowToast("Preencha o cargo primeiro.");
    }
  } catch (e: any) {
    onShowToast(`Erro: ${e?.message || 'Falha na IA'}`);
  } finally {
    setLoadingAI(null);
  }
};
```

---

### #13 — `handleTranslate` usa callback async dentro de `onRequestConfirm` sem tratamento de erro externo
**Arquivo:** `Editor.tsx` — linha 424  
**Problema:** A callback async passada para `onRequestConfirm` não propagará erros para o handler. O try/catch existe dentro, mas `setLoadingAI(null)` no `finally` pode não ser chamado se `onRequestConfirm` não awaita a callback corretamente.  
**Sugestão:** Verificar se `onRequestConfirm` em `App.tsx` faz `await onConfirm()` ou apenas `onConfirm()`. Se for o segundo caso, o `finally` pode não ser suficiente.

---

### #14 — `addJob` no `JobTracker` sem `Enter` para submeter o formulário
**Arquivo:** `JobTracker.tsx` — linhas 96–101  
**Problema:** O formulário de adição de vaga não responde ao `Enter`. O usuário precisa clicar no botão "Salvar". UX ruim para fluxo rápido de entrada.  
**Correção:**
```tsx
<input
  onKeyDown={(e) => { if (e.key === 'Enter') addJob(col.id); }}
  // ...
/>
```

---

### #15 — `JobTracker` sem persistência de notas/URL por vaga
**Arquivo:** `JobTracker.tsx`  
**Problema:** O tipo `JobApplication` tem campos como `url`, `salary`, `notes` e `nextSteps` (verificar em `types.ts`), mas o Kanban só exibe `role`, `company` e data. Os campos extras são invisíveis para o usuário.  
**Sugestão:** Adicionar no card de vaga expandido (ao clicar) a exibição/edição de `notes` e `url`.

---

## 🔵 SEGURANÇA / QUALIDADE

### #16 — `sanitizeLink` em `Preview.tsx` não valida contra `javascript:` URIs
**Arquivo:** `Preview.tsx` — linhas 33–38  
**Problema:** A função aceita links como `javascript:alert(1)` que não começam com `http` e não contêm `@`, resultando em `https://javascript:alert(1)` — que por si só é inofensivo, mas indica fragilidade.  
**Correção:**
```ts
const sanitizeLink = (link: string) => {
  if (!link) return '';
  try {
    const url = new URL(link.startsWith('http') ? link : `https://${link}`);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    if (link.includes('@')) return `mailto:${link}`;
    return '';
  }
};
```

---

### #17 — `getContrastColor` e `isColorTooLight` duplicam lógica
**Arquivo:** `Preview.tsx` — linhas 13–31  
**Problema:** As duas funções calculam `yiq` de forma idêntica. Uma pode delegar à outra para evitar duplicação.  
**Correção:**
```ts
const getLuminance = (hexcolor: string): number => {
  if (!hexcolor) return 0;
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000;
};
const getContrastColor = (hexcolor: string) => getLuminance(hexcolor) >= 128 ? '#0f172a' : '#ffffff';
const isColorTooLight = (hexcolor: string) => getLuminance(hexcolor) >= 200;
```

---

### #18 — `handleJsonImport` não reseta o `jsonInputRef.current.value`
**Arquivo:** `Editor.tsx` — linhas 322–338  
**Problema:** Após importar um JSON, o input de arquivo mantém o valor anterior. Se o usuário tentar importar o mesmo arquivo novamente, o evento `onChange` não dispara.  
**Correção:** Após processar, resetar o valor:
```ts
reader.onload = (ev) => {
  try { /* ... */ } catch (e) { /* ... */ } finally {
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  }
};
```

---

### #19 — `handleAtsPdfUpload` não reseta o input após anexar
**Arquivo:** `Editor.tsx` — linhas 344–357  
**Mesmo problema que #18**, mas para o input de PDF do ATS. Sem reset, o usuário não consegue re-enviar o mesmo arquivo após removê-lo com o `X`.  
**Correção:**
```ts
reader.onloadend = () => {
  // ...
  if (atsPdfInputRef.current) atsPdfInputRef.current.value = '';
};
```

---

## 📊 RESUMO

| # | Prioridade | Arquivo | Tipo |
|---|-----------|---------|------|
| #1 | 🔴 Crítico | Editor.tsx | Bug (spinner infinito no ATS) |
| #2 | 🔴 Crítico | Editor.tsx | Bug (spinner infinito ao converter PDF) |
| #3 | 🔴 Crítico | Editor.tsx | Bug (colisão de IDs) |
| #4 | 🟡 Médio | Editor.tsx | Bug (microfone não liberado) |
| #5 | 🟡 Médio | JobTracker.tsx | Bug (confirm nativo) |
| #6 | 🟡 Médio | Editor.tsx | Bug (ID malformado em skills) |
| #7 | 🟡 Médio | Editor.tsx | Performance |
| #8 | 🟢 Baixo | Preview.tsx | Performance |
| #9 | 🟢 Baixo | Editor.tsx | Performance |
| #10 | 🟢 Baixo | JobTracker.tsx | UX (busca não implementada) |
| #11 | 🟢 Baixo | Editor.tsx | UX / Acessibilidade |
| #12 | 🔴 Crítico | Editor.tsx | Bug (spinner travado em suggestSkills) |
| #13 | 🟡 Médio | Editor.tsx | Qualidade |
| #14 | 🟢 Baixo | JobTracker.tsx | UX |
| #15 | 🟢 Baixo | JobTracker.tsx | UX |
| #16 | 🟡 Médio | Preview.tsx | Segurança |
| #17 | 🟢 Baixo | Preview.tsx | Qualidade (DRY) |
| #18 | 🟡 Médio | Editor.tsx | Bug (re-import JSON) |
| #19 | 🟡 Médio | Editor.tsx | Bug (re-upload PDF) |
