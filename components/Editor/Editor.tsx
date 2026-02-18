import React, { useState, useRef, useMemo } from 'react';
import { ResumeData, ResumeSettings } from '../../types';
import { Plus, Trash2, Sparkles, Wand2, Eye, EyeOff, Settings, Briefcase, GraduationCap, Code, User, Languages, FileText, Search, QrCode, Zap, Book, Timer, MessageSquare, Target, Maximize2, Minimize2, DollarSign, Upload, Download, RefreshCw, Undo2, Redo2, Loader2, Github, CheckCircle2, AlertCircle, AlertTriangle, X, Users } from 'lucide-react';
import { extractResumeFromPdf, generateInterviewQuestions, generateCoverLetter, analyzeJobMatch, tailorResume, analyzeGap, estimateSalary, translateResumeData } from '../../services/geminiService';
import { fetchGithubRepos } from '../../services/integrationService';
import { AVAILABLE_FONTS, INITIAL_RESUME, FONT_PAIRINGS, EXAMPLE_PERSONAS } from '../../constants';
import { generateId, safeMergeResume, calculateWordCount } from '../../utils/resumeUtils';
import { useResumeHistory } from '../../hooks/useResumeHistory';
import { DebouncedInput, DebouncedTextarea } from './components/Debounced';
import { SectionWrapper } from './components/SectionWrapper';
import { PersonalInfoSection } from './sections/PersonalInfo';
import { GenericList } from './sections/GenericList';
import { SkillsSection } from './sections/SkillsSection';

interface EditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onShowToast: (msg: string) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void, type?: 'danger' | 'info') => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
}

const COLOR_PRESETS = ['#000000', '#334155', '#1e3a8a', '#2563eb', '#0ea5e9', '#0f766e', '#16a34a', '#ca8a04', '#ea580c', '#dc2626', '#be123c', '#7c3aed', '#4b5563', '#a855f7', '#ec4899', '#f43f5e'];

export const Editor: React.FC<EditorProps> = ({ data, onChange, onShowToast, onRequestConfirm, focusMode, setFocusMode }) => {
  const { historyIndex, handleChangeWithHistory, undo, redo, history } = useResumeHistory(data, onChange);
  const [openSection, setOpenSection] = useState<string>('personal');
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'ats' | 'tools'>('resume');
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState<any>(null);
  const [atsFile, setAtsFile] = useState<{name: string, data: string, mimeType: string} | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [showGapModal, setShowGapModal] = useState(false);
  const [tailorJobDesc, setTailorJobDesc] = useState('');
  const [gapJobDesc, setGapJobDesc] = useState('');
  const [gapAnalysis, setGapAnalysis] = useState<any>(null);
  const [estimatedSalary, setEstimatedSalary] = useState<string>('');
  const [githubUsername, setGithubUsername] = useState('');
  const [interviewQs, setInterviewQs] = useState<{technical: string[], behavioral: string[]} | null>(null);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const atsPdfInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => setOpenSection(openSection === section ? '' : section);
  
  const updateSettings = (field: keyof ResumeSettings, value: any) => { 
      handleChangeWithHistory({ ...data, settings: { ...data.settings, [field]: value } }); 
  };

  const toggleVisibility = (section: string) => { 
      const visibleSections = { ...data.settings.visibleSections }; 
      visibleSections[section] = !visibleSections[section]; 
      updateSettings('visibleSections', visibleSections); 
  };

  const clearList = (listName: string) => { 
      onRequestConfirm("Limpar Seção?", `Esvaziar ${listName}?`, () => { handleChangeWithHistory({ ...data, [listName]: [] }); onShowToast("Seção limpa."); }, 'danger'); 
  };

  const applyFontPairing = (index: number) => { 
      const pair = FONT_PAIRINGS[index]; 
      handleChangeWithHistory({ ...data, settings: { ...data.settings, headerFont: pair.header, bodyFont: pair.body } }); 
      onShowToast(`Fonte ${pair.name} aplicada!`); 
  };

  // --- Handlers ---

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (file) { 
        const reader = new FileReader(); 
        reader.onload = (ev) => { 
            try { 
                const raw = JSON.parse(ev.target?.result as string); 
                const imported = raw.version ? raw.data : raw;
                const mergedData = safeMergeResume(INITIAL_RESUME, imported);
                handleChangeWithHistory(mergedData); 
                onShowToast("Currículo carregado!"); 
            } catch (e) { 
                onShowToast("Erro: Arquivo inválido."); 
            } 
        }; 
        reader.readAsText(file); 
    }
  };
  
  const handleJsonExport = () => { 
      const exportData = { version: 1, data: data };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" }); 
      const url = URL.createObjectURL(blob); 
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `backup-trampolin-${data.personalInfo.fullName.replace(/\s+/g, '-').toLowerCase()}.json`; 
      a.click(); 
  };

  const handleReset = () => { 
      onRequestConfirm("Resetar Currículo?", "Isso apagará TODOS os dados atuais.", () => { handleChangeWithHistory(INITIAL_RESUME); onShowToast("Reiniciado."); }, 'danger'); 
  };

  const handleTranslate = async (lang: string) => { 
      onRequestConfirm(`Traduzir para ${lang}?`, "A IA irá traduzir todo o currículo de uma vez.", async () => { 
          setLoadingAI('translating'); 
          try {
              const translatedData = await translateResumeData(data, lang);
              if (translatedData) {
                  const merged = { ...data, ...translatedData, settings: data.settings };
                  handleChangeWithHistory(merged);
                  onShowToast("Tradução concluída!"); 
              }
          } catch (e) { onShowToast("Erro ao conectar com IA."); }
          setLoadingAI(null); 
      }, 'info'); 
  };

  // AI Tool Handlers
  const handleAICoverLetter = async () => {
    if (!data.coverLetter.companyName || !data.coverLetter.jobTitle) { onShowToast("Preencha Empresa e Cargo."); return; }
    setLoadingAI('cover-letter'); 
    try {
        const content = await generateCoverLetter(data, data.coverLetter.companyName, data.coverLetter.jobTitle); 
        handleChangeWithHistory({ ...data, coverLetter: { ...data.coverLetter, content } }); 
        onShowToast("✨ Carta criada!");
    } catch (e) { onShowToast("Erro ao criar carta."); } finally { setLoadingAI(null); }
  };

  const handleAIInterview = async () => { 
      setLoadingAI('interview'); 
      try {
          const res = await generateInterviewQuestions(data); 
          setInterviewQs(res); 
      } catch(e) { onShowToast("Erro ao gerar perguntas."); } finally { setLoadingAI(null); }
  };

  const handleEstimateSalary = async () => { 
      setLoadingAI('salary'); 
      try {
          const result = await estimateSalary(data); 
          setEstimatedSalary(result); 
      } catch(e) { onShowToast("Erro ao estimar."); } finally { setLoadingAI(null); }
  };

  const handleGapAnalysis = async () => { 
      if (!gapJobDesc) return; 
      setLoadingAI('gap'); 
      try {
          const result = await analyzeGap(data, gapJobDesc); 
          setGapAnalysis(result); 
      } catch (e) { onShowToast("Erro na análise."); } finally { setLoadingAI(null); }
  };

  const handleTailorResume = async () => {
      if (!tailorJobDesc) return; 
      setLoadingAI('tailor'); 
      try {
          const result = await tailorResume(data, tailorJobDesc);
          if (result) { 
              const newData = { ...data }; 
              if (result.summary) newData.personalInfo.summary = result.summary; 
              result.experience.forEach(rewritten => { const idx = newData.experience.findIndex(e => e.id === rewritten.id); if (idx !== -1) { newData.experience[idx].description = rewritten.rewrittenDescription; } }); 
              handleChangeWithHistory(newData); 
              onShowToast("Adaptado com sucesso!"); 
              setShowTailorModal(false); 
          }
      } catch (e) { onShowToast("Erro de conexão com IA."); } finally { setLoadingAI(null); }
  };

  const handleAtsPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === 'application/pdf') {
          const reader = new FileReader();
          reader.onloadend = () => {
             const result = reader.result as string;
             setAtsFile({ name: file.name, data: result.split(',')[1], mimeType: file.type });
             onShowToast("PDF anexado!");
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRunAtsAnalysis = async () => {
      if (!jobDescription) { onShowToast("Cole a descrição da vaga."); return; }
      setLoadingAI('ats');
      try {
          let input: any = JSON.stringify(data);
          if (atsFile) { input = { mimeType: atsFile.mimeType, data: atsFile.data }; }
          const result = await analyzeJobMatch(input, jobDescription);
          setAtsResult(result);
      } catch(e) { onShowToast("Erro na análise ATS."); } finally { setLoadingAI(null); }
  };

  const handleConvertToEditor = async () => {
      if (!atsFile) return;
      onRequestConfirm("Converter PDF?", "Isso irá sobrescrever os dados atuais.", async () => {
            setLoadingAI('convert-pdf');
            try {
                const extractedData = await extractResumeFromPdf(atsFile);
                if (extractedData) {
                    const mergedData = safeMergeResume(INITIAL_RESUME, extractedData);
                    handleChangeWithHistory(mergedData);
                    onShowToast("Currículo convertido!");
                    setActiveTab('resume');
                }
            } catch(e) { onShowToast("Erro na conversão."); } finally { setLoadingAI(null); }
        }, 'danger');
  };

  const completeness = useMemo(() => {
    let score = 0;
    if (data.personalInfo.fullName) score += 10;
    if (data.personalInfo.summary?.length > 50) score += 15;
    if (data.experience.length > 0) score += 20;
    if (data.education.length > 0) score += 15;
    if (data.skills.length >= 3) score += 15;
    if (data.projects.length > 0) score += 10;
    if (data.languages.length > 0) score += 5;
    return Math.min(100, score);
  }, [data]);

  const wordCount = calculateWordCount(data);
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl z-20">
      
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-sm">
         <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button aria-label="Undo" onClick={undo} disabled={historyIndex <= 0} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 transition-all text-slate-600 dark:text-slate-300 active:scale-95"><Undo2 size={16}/></button>
            <button aria-label="Redo" onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 transition-all text-slate-600 dark:text-slate-300 active:scale-95"><Redo2 size={16}/></button>
         </div>
         <div className="flex gap-2">
            <input type="file" ref={jsonInputRef} onChange={handleJsonImport} accept=".json" className="hidden" />
            <button aria-label="Focus Mode" onClick={() => setFocusMode(!focusMode)} className={`p-2 rounded-lg transition-colors border active:scale-95 ${focusMode ? 'bg-trampo-100 border-trampo-300 text-trampo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`} title="Modo Foco">{focusMode ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button aria-label="Import JSON" onClick={() => jsonInputRef.current?.click()} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all text-slate-600 dark:text-slate-300 active:scale-95"><Upload size={16}/></button>
                <button aria-label="Export JSON" onClick={handleJsonExport} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all text-slate-600 dark:text-slate-300 active:scale-95"><Download size={16}/></button>
                <div className="relative">
                    <button aria-label="Load Example" onClick={() => setShowExamples(!showExamples)} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all text-slate-600 dark:text-slate-300 active:scale-95"><User size={16}/></button>
                    {showExamples && (
                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-lg p-1 min-w-[200px] z-50 animate-fade-in">
                            <div className="text-[10px] font-bold text-slate-400 p-2">PERSONAS</div>
                            {EXAMPLE_PERSONAS.map(ex => ( <button key={ex.id} onClick={() => {handleChangeWithHistory(ex); setShowExamples(false); onShowToast("Exemplo carregado!");}} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md truncate transition-colors">{ex.profileName}</button> ))}
                        </div>
                    )}
                </div>
            </div>
            <button aria-label="Reset All" onClick={handleReset} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors active:scale-95"><RefreshCw size={16}/></button>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 pb-2 gap-4 bg-white dark:bg-slate-900 select-none overflow-x-auto">
        {['resume','tools','cover','ats'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 min-w-fit pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === t ? 'text-trampo-600 border-trampo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                {t === 'resume' && <><FileText size={16}/> Editor</>}
                {t === 'tools' && <><Zap size={16}/> Ferramentas</>}
                {t === 'cover' && <><Wand2 size={16}/> Carta</>}
                {t === 'ats' && <><Search size={16}/> ATS</>}
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth">
        {/* === RESUME EDITOR === */}
        {activeTab === 'resume' && (
          <div className="space-y-6 pb-20 animate-slide-in">
             {/* Magic Actions */}
             <div className="p-3 bg-gradient-to-r from-trampo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-trampo-100 dark:border-slate-700 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-trampo-600 dark:text-trampo-400"><Sparkles size={18}/></div>
                    <div><h4 className="text-xs font-bold text-slate-700 dark:text-white">Adaptação Inteligente</h4><p className="text-[10px] text-slate-500">Personalize para a vaga</p></div>
                </div>
                <button onClick={() => setShowTailorModal(true)} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-trampo-200 dark:border-slate-600 rounded-lg text-xs font-bold text-trampo-700 dark:text-trampo-300 hover:shadow-md transition-all active:scale-95">🎯 Adaptar</button>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-2">
                 <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                     <span className="text-[10px] uppercase font-bold text-slate-400">Progresso</span>
                     <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="bg-trampo-500 h-full rounded-full transition-all" style={{width: `${completeness}%`}}></div></div><span className="text-xs font-bold">{completeness}%</span></div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                     <span className="text-[10px] uppercase font-bold text-slate-400">Métricas</span>
                     <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-300"><span className="flex items-center gap-1" title="Contagem de Palavras"><Book size={12}/> {wordCount}</span><span className="flex items-center gap-1" title="Tempo de Leitura"><Timer size={12}/> ~{readingTime}min</span></div>
                 </div>
             </div>

             <SectionWrapper title="Dados Pessoais" icon={User} isOpen={openSection === 'personal'} onToggle={() => toggleSection('personal')}>
                <PersonalInfoSection 
                    data={data} 
                    onChange={handleChangeWithHistory} 
                    onShowToast={onShowToast} 
                    onRequestConfirm={onRequestConfirm}
                    loadingAI={loadingAI}
                    setLoadingAI={setLoadingAI}
                />
             </SectionWrapper>

             <SectionWrapper title="Experiência" icon={Briefcase} isOpen={openSection === 'experience'} onToggle={() => toggleSection('experience')} isVisible={data.settings.visibleSections.experience} onVisibilityToggle={() => toggleVisibility('experience')} onClear={() => clearList('experience')} itemCount={data.experience.length}>
               <GenericList 
                    sectionKey="experience" 
                    data={data} 
                    onChange={handleChangeWithHistory} 
                    onShowToast={onShowToast} 
                    onRequestConfirm={onRequestConfirm}
                    loadingAI={loadingAI}
                    setLoadingAI={setLoadingAI}
                    newItemTemplate={{ role: 'Cargo', company: 'Empresa', current: false, description: '' }} 
                    fields={[{ key: 'role', label: 'Cargo' }, { key: 'company', label: 'Empresa' }, { key: 'startDate', label: 'Início' }, { key: 'endDate', label: 'Fim' }, { key: 'location', label: 'Local' }]}
                />
             </SectionWrapper>

             <SectionWrapper title="Educação" icon={GraduationCap} isOpen={openSection === 'education'} onToggle={() => toggleSection('education')} isVisible={data.settings.visibleSections.education} onVisibilityToggle={() => toggleVisibility('education')} onClear={() => clearList('education')} itemCount={data.education.length}>
               <GenericList 
                    sectionKey="education" 
                    data={data} 
                    onChange={handleChangeWithHistory} 
                    onShowToast={onShowToast} 
                    onRequestConfirm={onRequestConfirm}
                    loadingAI={loadingAI}
                    setLoadingAI={setLoadingAI}
                    newItemTemplate={{ school: 'Instituição', degree: 'Curso' }} 
                    fields={[{ key: 'school', label: 'Instituição' }, { key: 'degree', label: 'Grau/Curso' }, { key: 'startDate', label: 'Início' }, { key: 'endDate', label: 'Fim' }, { key: 'location', label: 'Local' }]}
                />
             </SectionWrapper>
            
             <SectionWrapper title="Projetos & Portfolio" icon={Code} isOpen={openSection === 'projects'} onToggle={() => toggleSection('projects')} isVisible={data.settings.visibleSections.projects} onVisibilityToggle={() => toggleVisibility('projects')} onClear={() => clearList('projects')} itemCount={data.projects.length}>
                 <GenericList 
                    sectionKey="projects" 
                    data={data} 
                    onChange={handleChangeWithHistory} 
                    onShowToast={onShowToast} 
                    onRequestConfirm={onRequestConfirm}
                    loadingAI={loadingAI}
                    setLoadingAI={setLoadingAI}
                    githubUsername={githubUsername}
                    setGithubUsername={setGithubUsername}
                    newItemTemplate={{ name: 'Nome do Projeto', description: '', url: '' }} 
                    fields={[{ key: 'name', label: 'Nome' }, { key: 'url', label: 'Link (URL)' }, { key: 'startDate', label: 'Data' }, { key: 'description', label: 'Descrição', full: true, type: 'textarea' }]}
                />
             </SectionWrapper>

             <SectionWrapper title="Habilidades" icon={Sparkles} isOpen={openSection === 'skills'} onToggle={() => toggleSection('skills')} isVisible={data.settings.visibleSections.skills} onVisibilityToggle={() => toggleVisibility('skills')} onClear={() => clearList('skills')} itemCount={data.skills.length}>
                <SkillsSection 
                    data={data} 
                    onChange={handleChangeWithHistory} 
                    onShowToast={onShowToast} 
                    onRequestConfirm={onRequestConfirm}
                    loadingAI={loadingAI}
                    setLoadingAI={setLoadingAI}
                />
             </SectionWrapper>
            
             <SectionWrapper title="Idiomas" icon={Languages} isOpen={openSection === 'languages'} onToggle={() => toggleSection('languages')} isVisible={data.settings.visibleSections.languages} onVisibilityToggle={() => toggleVisibility('languages')} onClear={() => clearList('languages')} itemCount={data.languages.length}>
                 {data.languages.map((lang, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <input value={lang} onChange={(e) => { const list = [...data.languages]; list[index] = e.target.value; handleChangeWithHistory({...data, languages: list}); }} className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" />
                        <button onClick={() => { const list = [...data.languages]; list.splice(index, 1); handleChangeWithHistory({...data, languages: list}); }} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                 ))}
                 <button onClick={() => handleChangeWithHistory({...data, languages: [...data.languages, 'Novo Idioma']})} className="text-xs font-bold text-trampo-600 hover:underline mt-2 flex items-center gap-1"><Plus size={12}/> Adicionar Idioma</button>
                 <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                     <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Traduzir Currículo</label>
                     <div className="flex gap-2">
                         <button onClick={() => handleTranslate('English')} disabled={!!loadingAI} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">🇺🇸 Inglês</button>
                         <button onClick={() => handleTranslate('Spanish')} disabled={!!loadingAI} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">🇪🇸 Espanhol</button>
                         <button onClick={() => handleTranslate('French')} disabled={!!loadingAI} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">🇫🇷 Francês</button>
                     </div>
                 </div>
             </SectionWrapper>

             <SectionWrapper title="Configurações & Visual" icon={Settings} isOpen={openSection === 'settings'} onToggle={() => toggleSection('settings')}>
               <div className="space-y-5">
                 <div className="grid grid-cols-2 gap-3">
                    <DebouncedInput label="Tam. Fonte" value={data.settings.fontScale} onChange={(v: string) => updateSettings('fontScale', v)} type="number" step="0.05" />
                    <DebouncedInput label="Espaçamento" value={data.settings.spacingScale} onChange={(v: string) => updateSettings('spacingScale', v)} type="number" step="0.1" />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                         <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Padrão</label>
                         <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.backgroundPattern} onChange={(e) => updateSettings('backgroundPattern', e.target.value)}><option value="none">Nenhum</option><option value="dots">Pontilhado</option><option value="grid">Grade</option></select>
                     </div>
                     <div>
                         <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Efeito Glass</label>
                         <button onClick={() => updateSettings('glassmorphism', !data.settings.glassmorphism)} className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors flex items-center justify-between ${data.settings.glassmorphism ? 'bg-trampo-100 border-trampo-300 text-trampo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{data.settings.glassmorphism ? 'Ativado' : 'Desativado'}{data.settings.glassmorphism ? <Eye size={16}/> : <EyeOff size={16}/>}</button>
                     </div>
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Fontes</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">{FONT_PAIRINGS.map((pair, idx) => ( <button key={idx} onClick={() => applyFontPairing(idx)} className="snap-start px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 whitespace-nowrap text-xs font-medium hover:border-trampo-500 hover:text-trampo-600 transition-colors shadow-sm active:scale-95">{pair.name}</button> ))}</div>
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Cor Principal</label>
                    <div className="flex gap-2 items-center mb-2"><input type="color" value={data.settings.primaryColor || '#000000'} onChange={(e) => updateSettings('primaryColor', e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-2 border-slate-200 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-800"/></div>
                    <div className="flex flex-wrap gap-2.5">{COLOR_PRESETS.map(c => ( <button key={c} onClick={() => updateSettings('primaryColor', c)} className={`w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-110 ${data.settings.primaryColor === c ? 'ring-2 ring-offset-2 ring-trampo-500 scale-110' : ''}`} style={{ backgroundColor: c }} /> ))}</div>
                 </div>
               </div>
             </SectionWrapper>
          </div>
        )}

        {/* === TOOLS TAB === */}
        {activeTab === 'tools' && (
            <div className="space-y-6 pb-20 animate-slide-in">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <h3 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-2"><Zap size={20}/> Ferramentas Extras</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400">Recursos poderosos para impulsionar sua candidatura.</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                     <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-700 dark:text-slate-200"><DollarSign size={16}/> Estimativa de Salário</h4>
                     <p className="text-xs text-slate-500 mb-4">Com base no seu perfil, veja uma estimativa de mercado.</p>
                     <button onClick={handleEstimateSalary} disabled={!!loadingAI} className="w-full py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors active:scale-95">
                         {loadingAI === 'salary' ? 'Calculando...' : 'Calcular Estimativa'}
                     </button>
                     {estimatedSalary && <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200 font-bold border border-green-200 dark:border-green-800 text-center animate-fade-in">{estimatedSalary}</div>}
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                     <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-700 dark:text-slate-200"><Target size={16}/> Análise de Gaps</h4>
                     <p className="text-xs text-slate-500 mb-4">Descubra o que falta para a vaga dos sonhos.</p>
                     <button onClick={() => setShowGapModal(true)} className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95">Identificar Gaps</button>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                     <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-700 dark:text-slate-200"><MessageSquare size={16}/> Simulador de Entrevista</h4>
                     <button onClick={handleAIInterview} disabled={!!loadingAI} className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95">
                         {loadingAI === 'interview' ? 'Gerando...' : 'Gerar Perguntas'}
                     </button>
                     {interviewQs && (
                         <div className="mt-4 space-y-4 animate-fade-in">
                             {interviewQs.technical?.length > 0 && <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"><h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Técnicas</h5><ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1.5">{interviewQs.technical.map((q, i) => <li key={i}>{q}</li>)}</ul></div>}
                             {interviewQs.behavioral?.length > 0 && <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"><h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Comportamentais</h5><ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1.5">{interviewQs.behavioral.map((q, i) => <li key={i}>{q}</li>)}</ul></div>}
                         </div>
                     )}
                </div>
            </div>
        )}

        {/* === COVER LETTER TAB === */}
        {activeTab === 'cover' && (
            <div className="space-y-6 pb-20 animate-slide-in">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <h3 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2 mb-2"><Wand2 size={20}/> Carta de Apresentação</h3>
                    <p className="text-xs text-purple-700 dark:text-purple-400">Gere uma carta personalizada para cada vaga.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                    <DebouncedInput label="Nome do Recrutador (Opcional)" value={data.coverLetter.recipientName} onChange={(v: string) => handleChangeWithHistory({...data, coverLetter: {...data.coverLetter, recipientName: v}})} placeholder="Ex: João Silva" />
                    <DebouncedInput label="Nome da Empresa" value={data.coverLetter.companyName} onChange={(v: string) => handleChangeWithHistory({...data, coverLetter: {...data.coverLetter, companyName: v}})} placeholder="Ex: Google" />
                    <DebouncedInput label="Vaga Alvo" value={data.coverLetter.jobTitle} onChange={(v: string) => handleChangeWithHistory({...data, coverLetter: {...data.coverLetter, jobTitle: v}})} placeholder="Ex: Senior Frontend Developer" />
                    <button onClick={handleAICoverLetter} disabled={!!loadingAI} className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2">
                        {loadingAI === 'cover-letter' ? 'Escrevendo...' : <><Sparkles size={16}/> Gerar com IA</>}
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Conteúdo da Carta</label>
                    <DebouncedTextarea value={data.coverLetter.content} onChange={(e: any) => handleChangeWithHistory({...data, coverLetter: {...data.coverLetter, content: e.target.value}})} className="w-full h-96 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20 outline-none" placeholder="O conteúdo gerado aparecerá aqui..." />
                </div>
            </div>
        )}

        {/* === ATS TAB === */}
        {activeTab === 'ats' && (
            <div className="space-y-6 pb-20 animate-slide-in">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 mb-2"><Search size={20}/> Verificador ATS</h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">Verifique se seu currículo passa nos robôs de recrutamento.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">1. Escolha a Fonte</label>
                    <div className="flex gap-2 mb-4">
                        <button onClick={() => setAtsFile(null)} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${!atsFile ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Usar Editor Atual</button>
                        <button onClick={() => atsPdfInputRef.current?.click()} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${atsFile ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Upload PDF</button>
                        <input type="file" ref={atsPdfInputRef} onChange={handleAtsPdfUpload} accept="application/pdf" className="hidden" />
                    </div>
                    {atsFile && (
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-medium mb-4">
                            <span className="truncate max-w-[200px]">{atsFile.name}</span>
                            <div className="flex gap-2">
                                <button onClick={handleConvertToEditor} className="text-blue-600 hover:text-blue-700 font-bold" title="Importar dados para o editor">Importar</button>
                                <button onClick={() => setAtsFile(null)} className="text-red-500 hover:text-red-600"><X size={14}/></button>
                            </div>
                        </div>
                    )}

                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">2. Descrição da Vaga</label>
                    <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="w-full h-32 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-emerald-500/20 outline-none dark:bg-slate-800 dark:text-white" placeholder="Cole a descrição da vaga aqui..." />
                    
                    <button onClick={handleRunAtsAnalysis} disabled={!jobDescription || !!loadingAI} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        {loadingAI === 'ats' ? 'Analisando...' : <><Search size={18}/> Analisar Match</>}
                    </button>
                </div>

                {atsResult && (
                    <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-lg dark:text-white">Resultado da Análise</h4>
                            <div className={`text-2xl font-black ${atsResult.score >= 70 ? 'text-emerald-500' : atsResult.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{atsResult.score}%</div>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Palavras-chave Faltantes</h5>
                                <div className="flex flex-wrap gap-2">
                                    {atsResult.missingKeywords.map((k: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded border border-red-100 dark:border-red-900/50 font-medium">{k}</span>
                                    ))}
                                    {atsResult.missingKeywords.length === 0 && <span className="text-xs text-green-500 font-medium">Nenhuma palavra importante faltando!</span>}
                                </div>
                            </div>
                            
                            <div>
                                <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><CheckCircle2 size={12}/> Feedback</h5>
                                <ul className="space-y-2">
                                    {atsResult.feedback.map((f: string, i: number) => (
                                        <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2 items-start">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
      
      {showTailorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-trampo-50 to-white dark:from-slate-800 dark:to-slate-900">
                      <div><h3 className="font-bold text-lg text-trampo-700 dark:text-white flex items-center gap-2"><Sparkles size={20}/> Tailor Resume</h3><p className="text-xs text-slate-500">Adapte seu CV para a vaga.</p></div>
                      <button onClick={() => setShowTailorModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  <div className="p-4 flex-1 overflow-auto"><textarea value={tailorJobDesc} onChange={(e) => setTailorJobDesc(e.target.value)} className="w-full h-48 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500/20 dark:bg-slate-800 dark:text-white resize-none" placeholder="Cole aqui a descrição da vaga..."/></div>
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3"><button onClick={() => setShowTailorModal(false)} className="px-4 py-2 text-sm text-slate-500">Cancelar</button><button onClick={handleTailorResume} disabled={!tailorJobDesc || !!loadingAI} className="px-5 py-2 bg-trampo-600 hover:bg-trampo-700 text-white rounded-lg font-bold text-sm shadow-lg active:scale-95 flex items-center gap-2">{loadingAI ? '...' : 'Adaptar'} <Wand2 size={16}/></button></div>
              </div>
          </div>
      )}

      {showGapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Target size={20}/> Análise de Gaps</h3>
                      <button onClick={() => {setShowGapModal(false); setGapAnalysis(null);}} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  
                  {!gapAnalysis ? (
                    <div className="p-4">
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Descrição da Vaga</label>
                        <textarea value={gapJobDesc} onChange={(e) => setGapJobDesc(e.target.value)} className="w-full h-40 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500/20 dark:bg-slate-800 dark:text-white resize-none" placeholder="Cole a vaga para descobrir o que falta..." />
                        <button onClick={handleGapAnalysis} disabled={!gapJobDesc || !!loadingAI} className="mt-4 w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm active:scale-95 transition-transform">{loadingAI === 'gap' ? 'Analisando...' : 'Identificar Gaps'}</button>
                    </div>
                  ) : (
                    <div className="p-4 flex-1 overflow-auto custom-scrollbar space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                            <h4 className="font-bold text-red-800 dark:text-red-300 text-sm mb-2 flex items-center gap-2"><AlertCircle size={16}/> Hard Skills Faltantes</h4>
                            <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-400 space-y-1">{gapAnalysis.missingHardSkills.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                            <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm mb-2 flex items-center gap-2"><Users size={16}/> Soft Skills Faltantes</h4>
                            <ul className="list-disc list-inside text-xs text-orange-700 dark:text-orange-400 space-y-1">{gapAnalysis.missingSoftSkills.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                            <h4 className="font-bold text-green-800 dark:text-green-300 text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> Sugestões</h4>
                            <ul className="list-disc list-inside text-xs text-green-700 dark:text-green-400 space-y-1">{gapAnalysis.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                        </div>
                    </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};