
import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, ResumeSettings } from '../../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Wand2, Eye, EyeOff, ArrowUp, ArrowDown, Settings, Briefcase, GraduationCap, Medal, Code, User, Languages, FileText, Search, QrCode, Heart, Award, Users, FilePlus, Copy, Eraser, Languages as LangIcon, Upload, X, Type, Undo2, Redo2, Download, RefreshCw, Star, Globe, PenTool, CheckCircle2, AlertCircle, FileUp } from 'lucide-react';
import { improveText, generateSummary, suggestSkills, generateCoverLetter, analyzeJobMatch, translateText, generateBulletPoints } from '../../services/geminiService';
import { AVAILABLE_FONTS, INITIAL_RESUME, FONT_PAIRINGS } from '../../constants';

interface EditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onShowToast: (msg: string) => void;
}

const COLOR_PRESETS = [
  '#000000', '#334155', '#1e3a8a', '#2563eb', '#0ea5e9', 
  '#0f766e', '#16a34a', '#ca8a04', '#ea580c', '#dc2626', 
  '#be123c', '#7c3aed', '#4b5563'
];

const CUSTOM_ICONS = [
  { id: 'star', icon: Star, label: 'Estrela' },
  { id: 'globe', icon: Globe, label: 'Globo' },
  { id: 'code', icon: Code, label: 'Código' },
  { id: 'heart', icon: Heart, label: 'Coração' },
  { id: 'pen', icon: PenTool, label: 'Caneta' },
  { id: 'award', icon: Award, label: 'Prêmio' }
];

// UI Component: Modern Section Wrapper
const Section = ({ title, icon: Icon, children, isOpen, onToggle, isVisible, onVisibilityToggle, onClear }: any) => (
  <div className={`group border border-transparent rounded-xl transition-all duration-300 mb-4 ${isOpen ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
    <div className={`flex items-center justify-between p-4 cursor-pointer select-none rounded-xl ${!isVisible && isVisible !== undefined ? 'opacity-50 grayscale' : ''}`} onClick={onToggle}>
      <div className="flex-1 flex items-center gap-3 text-left">
        <div className={`p-2 rounded-lg ${isOpen ? 'bg-trampo-100 dark:bg-trampo-900/30 text-trampo-600 dark:text-trampo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
           {Icon && <Icon size={18} />}
        </div>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {onClear && (
          <button onClick={(e) => { e.stopPropagation(); if(confirm('Limpar esta seção?')) onClear(); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Limpar Seção">
            <Eraser size={16} />
          </button>
        )}
        {onVisibilityToggle && (
          <button onClick={(e) => { e.stopPropagation(); onVisibilityToggle(); }} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title={isVisible ? "Ocultar" : "Mostrar"}>
            {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
        <div className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <ChevronDown size={20} />
        </div>
      </div>
    </div>
    {isOpen && <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">{children}</div>}
  </div>
);

// UI Component: Modern Input
const Input = ({ label, value, onChange, type = "text", placeholder = "", step }: any) => (
  <div className="mb-1">
    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
    <input 
      type={type} 
      step={step} 
      placeholder={placeholder} 
      className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-trampo-500/20 focus:border-trampo-500 outline-none transition-all disabled:opacity-50 dark:text-slate-100 placeholder:text-slate-400" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);

export const Editor: React.FC<EditorProps> = ({ data, onChange, onShowToast }) => {
  const [openSection, setOpenSection] = useState<string>('settings');
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'ats'>('resume');
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState<any>(null);
  const [atsFile, setAtsFile] = useState<{name: string, data: string, mimeType: string} | null>(null);
  
  // Undo/Redo Stacks
  const [history, setHistory] = useState<ResumeData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const atsPdfInputRef = useRef<HTMLInputElement>(null);

  // Initialize History
  useEffect(() => {
    if (history.length === 0) {
      setHistory([data]);
      setHistoryIndex(0);
    }
  }, []);

  // Handle Changes with History
  const handleChangeWithHistory = (newData: ResumeData) => {
    if (isUndoRedoAction.current) {
      onChange(newData);
      isUndoRedoAction.current = false;
      return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    
    // Limit history size to 50
    if (newHistory.length > 50) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange(newData);
  };

  const undo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      setHistoryIndex(historyIndex - 1);
      onChange(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      setHistoryIndex(historyIndex + 1);
      onChange(history[historyIndex + 1]);
    }
  };

  const toggleSection = (section: string) => setOpenSection(openSection === section ? '' : section);

  // --- Helpers ---
  const updateSettings = (field: keyof ResumeSettings, value: any) => {
    handleChangeWithHistory({ ...data, settings: { ...data.settings, [field]: value } });
  };
  
  const calculateCompleteness = () => {
    let score = 0;
    if (data.personalInfo.fullName) score += 10;
    if (data.personalInfo.summary) score += 10;
    if (data.experience.length > 0) score += 20;
    if (data.education.length > 0) score += 15;
    if (data.skills.length > 0) score += 15;
    if (data.projects.length > 0) score += 10;
    if (data.languages.length > 0) score += 5;
    if (data.certifications.length > 0 || data.volunteer.length > 0) score += 15;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  const toggleVisibility = (section: string) => {
    const visibleSections = { ...data.settings.visibleSections };
    visibleSections[section] = !visibleSections[section];
    updateSettings('visibleSections', visibleSections);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onShowToast("Imagem muito grande. Máx 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, photoUrl: reader.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAtsPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.type !== 'application/pdf') {
              onShowToast("Por favor, envie apenas PDF.");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
             // Extract base64 part only
             const result = reader.result as string;
             const base64 = result.split(',')[1];
             setAtsFile({ name: file.name, data: base64, mimeType: file.type });
             onShowToast("PDF carregado para análise!");
          };
          reader.readAsDataURL(file);
      }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onload = (ev) => {
         try {
           const imported = JSON.parse(ev.target?.result as string);
           handleChangeWithHistory({ ...INITIAL_RESUME, ...imported });
           onShowToast("Dados carregados com sucesso!");
         } catch (e) {
           onShowToast("Erro ao ler arquivo JSON.");
         }
       };
       reader.readAsText(file);
    }
  };

  const handleJsonExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-curriculo-${Date.now()}.json`;
    a.click();
  };

  const handleReset = () => {
    if(confirm('Tem certeza? Isso apagará tudo e voltará ao modelo inicial.')) {
      handleChangeWithHistory(INITIAL_RESUME);
      onShowToast("Reiniciado!");
    }
  };

  // --- Actions ---
  const handleImproveText = async (text: string, path: (val: string) => void) => {
    if (!text || text.length < 5) {
        onShowToast("Texto muito curto para melhorar.");
        return;
    }
    setLoadingAI('improving');
    const improved = await improveText(text);
    path(improved);
    setLoadingAI(null);
    onShowToast("Texto melhorado!");
  };

  const handleGenerateBullets = async (role: string, company: string, currentDesc: string, path: (val: string) => void) => {
    if (!role) { onShowToast("Preencha o cargo primeiro."); return; }
    setLoadingAI('bullets');
    const bullets = await generateBulletPoints(role, company);
    path(currentDesc ? currentDesc + '\n' + bullets : bullets);
    setLoadingAI(null);
    onShowToast("Bullets gerados!");
  };

  const handleAICoverLetter = async () => {
    if (!data.coverLetter.companyName || !data.coverLetter.jobTitle) {
      onShowToast("Por favor, preencha o nome da empresa e o cargo.");
      return;
    }
    setLoadingAI('cover-letter');
    const content = await generateCoverLetter(data, data.coverLetter.companyName, data.coverLetter.jobTitle);
    handleChangeWithHistory({ ...data, coverLetter: { ...data.coverLetter, content } });
    setLoadingAI(null);
    onShowToast("Carta gerada com sucesso!");
  };

  const handleAIGenerateSummary = async () => {
    setLoadingAI('gen-summary');
    const summary = await generateSummary(data.personalInfo.jobTitle, data.experience);
    handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, summary } });
    setLoadingAI(null);
    onShowToast("Resumo gerado!");
  };

  const handleTranslate = async (lang: string) => {
     if (!confirm(`Traduzir currículo para ${lang}? Isso substituirá o texto atual.`)) return;
     setLoadingAI('translating');
     const newData = { ...data };
     if (newData.personalInfo.summary) newData.personalInfo.summary = await translateText(newData.personalInfo.summary, lang);
     for (const exp of newData.experience) {
       if (exp.role) exp.role = await translateText(exp.role, lang);
       if (exp.description) exp.description = await translateText(exp.description, lang);
     }
     handleChangeWithHistory(newData);
     setLoadingAI(null);
     onShowToast("Tradução concluída!");
  };

  const handleRunAtsAnalysis = async () => {
      if (!jobDescription) { onShowToast("Cole a descrição da vaga."); return; }
      setLoadingAI('ats');
      
      let input: any = JSON.stringify(data);
      // Se tiver arquivo carregado, usa ele
      if (atsFile) {
          input = { mimeType: atsFile.mimeType, data: atsFile.data };
      }

      const result = await analyzeJobMatch(input, jobDescription);
      setAtsResult(result);
      setLoadingAI(null);
  };

  const handleListChange = (listName: string, index: number, field: string, value: any) => {
    const list = [...(data as any)[listName]];
    list[index] = { ...list[index], [field]: value };
    handleChangeWithHistory({ ...data, [listName]: list });
  };

  const addItem = (listName: string, item: any) => {
    handleChangeWithHistory({ ...data, [listName]: [item, ...(data as any)[listName]] });
    onShowToast("Item adicionado.");
  };

  const removeItem = (listName: string, index: number) => {
     const list = [...(data as any)[listName]];
     handleChangeWithHistory({ ...data, [listName]: list.filter((_, i) => i !== index) });
  };
  
  const clearList = (listName: string) => {
    handleChangeWithHistory({ ...data, [listName]: [] });
    onShowToast("Seção limpa.");
  };

  const duplicateItem = (listName: string, index: number) => {
    const list = [...(data as any)[listName]];
    const item = { ...list[index], id: Date.now().toString() };
    list.splice(index + 1, 0, item);
    handleChangeWithHistory({ ...data, [listName]: list });
    onShowToast("Item duplicado.");
  };

  const moveItem = (listName: string, index: number, direction: 'up' | 'down') => {
    const list = [...(data as any)[listName]];
    if (direction === 'up' && index > 0) {
      [list[index], list[index - 1]] = [list[index - 1], list[index]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
    }
    handleChangeWithHistory({ ...data, [listName]: list });
  };

  const applyFontPairing = (index: number) => {
      const pair = FONT_PAIRINGS[index];
      handleChangeWithHistory({
          ...data,
          settings: { ...data.settings, headerFont: pair.header, bodyFont: pair.body }
      });
      onShowToast(`Par ${pair.name} aplicado!`);
  };

  // --- Renderers ---
  const renderGenericList = (key: string, titleField: string, subtitleField: string, newItem: any, fields: any[]) => (
    <div className="space-y-4">
       {(data as any)[key].map((item: any, index: number) => (
         <div key={item.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 relative group transition-all hover:shadow-md">
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
               <button onClick={() => duplicateItem(key, index)} className="p-1.5 hover:text-blue-500 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><Copy size={14}/></button>
               <button onClick={() => moveItem(key, index, 'up')} className="p-1.5 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><ArrowUp size={14}/></button>
               <button onClick={() => moveItem(key, index, 'down')} className="p-1.5 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><ArrowDown size={14}/></button>
               <button onClick={() => removeItem(key, index)} className="p-1.5 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 pr-8">
              {fields.map(f => (
                <div key={f.key} className={f.full ? "col-span-2" : ""}>
                   <Input label={f.label} value={item[f.key]} onChange={(v) => handleListChange(key, index, f.key, v)} type={f.type || 'text'} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            {item.description !== undefined && (
               <div className="relative mt-2">
                 <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Descrição</label>
                 <textarea className="w-full p-3 pr-10 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-trampo-500/20 focus:border-trampo-500 outline-none transition-all" value={item.description} onChange={(e) => handleListChange(key, index, 'description', e.target.value)} placeholder="• Descreva suas conquistas..." />
                 <div className="absolute bottom-3 right-3 flex gap-2">
                    {/* Bullet Generator Button */}
                    {key === 'experience' && (
                        <button onClick={() => handleGenerateBullets(item.role, item.company, item.description, (v) => handleListChange(key, index, 'description', v))} className="text-trampo-600 hover:text-trampo-700 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-200 dark:border-slate-600 transition-transform hover:scale-110" title="Gerar Bullets">
                           <Type size={16} />
                        </button>
                    )}
                    <button onClick={() => handleImproveText(item.description, (v) => handleListChange(key, index, 'description', v))} className="text-purple-600 hover:text-purple-700 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-200 dark:border-slate-600 transition-transform hover:scale-110" title="Melhorar com IA">
                       <Wand2 size={16} />
                    </button>
                 </div>
               </div>
            )}
         </div>
       ))}
       <button onClick={() => addItem(key, { ...newItem, id: Date.now().toString() })} className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-trampo-600 hover:border-trampo-300 hover:bg-trampo-50 dark:hover:bg-slate-800 flex justify-center items-center gap-2 transition-all font-medium"><Plus size={18}/> Adicionar Item</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
      {/* Utility Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
         <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 transition-all text-slate-600 dark:text-slate-300" title="Desfazer"><Undo2 size={16}/></button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 transition-all text-slate-600 dark:text-slate-300" title="Refazer"><Redo2 size={16}/></button>
         </div>
         <div className="flex gap-2">
            <input type="file" ref={jsonInputRef} onChange={handleJsonImport} accept=".json" className="hidden" />
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => jsonInputRef.current?.click()} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all text-slate-600 dark:text-slate-300" title="Importar Backup"><Upload size={16}/></button>
                <button onClick={handleJsonExport} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all text-slate-600 dark:text-slate-300" title="Exportar Backup"><Download size={16}/></button>
            </div>
            <button onClick={handleReset} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Resetar Tudo"><RefreshCw size={16}/></button>
         </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex px-4 pt-4 pb-2 gap-4 bg-white dark:bg-slate-900">
        <button onClick={() => setActiveTab('resume')} className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'resume' ? 'text-trampo-600 border-trampo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}><FileText size={16}/> Editor</button>
        <button onClick={() => setActiveTab('cover')} className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'cover' ? 'text-purple-600 border-purple-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}><Wand2 size={16}/> Carta</button>
        <button onClick={() => setActiveTab('ats')} className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'ats' ? 'text-emerald-600 border-emerald-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}><Search size={16}/> ATS</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth">
        {activeTab === 'resume' && (
          <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Progress Bar */}
             <div className="mb-6 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden relative group cursor-help" title="Nível de preenchimento do currículo">
               <div className="bg-gradient-to-r from-trampo-400 to-trampo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(14,165,233,0.4)]" style={{ width: `${completeness}%` }}></div>
               <span className="absolute -top-6 right-0 text-[10px] font-bold text-slate-400">{completeness}% Completo</span>
             </div>

             {/* Settings */}
             <Section title="Aparência & Layout" icon={Settings} isOpen={openSection === 'settings'} onToggle={() => toggleSection('settings')}>
               <div className="space-y-5">
                 
                 {/* Escalas */}
                 <div className="grid grid-cols-3 gap-3">
                    <Input label="Fonte" value={data.settings.fontScale} onChange={(v) => updateSettings('fontScale', v)} type="number" step="0.05" />
                    <Input label="Espaço" value={data.settings.spacingScale} onChange={(v) => updateSettings('spacingScale', v)} type="number" step="0.1" />
                    <Input label="Margem" value={data.settings.marginScale} onChange={(v) => updateSettings('marginScale', v)} type="number" step="0.1" />
                 </div>
                 
                 {/* Font Pairings */}
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Pares de Fontes</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
                        {FONT_PAIRINGS.map((pair, idx) => (
                            <button key={idx} onClick={() => applyFontPairing(idx)} className="snap-start px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 whitespace-nowrap text-xs font-medium hover:border-trampo-500 hover:text-trampo-600 transition-colors shadow-sm">{pair.name}</button>
                        ))}
                    </div>
                 </div>

                 {/* Fontes Manuais */}
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Título</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.headerFont} onChange={(e) => updateSettings('headerFont', e.target.value)}>
                        {AVAILABLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Corpo</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.bodyFont} onChange={(e) => updateSettings('bodyFont', e.target.value)}>
                        {AVAILABLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                   </div>
                 </div>

                 {/* Estilos Visuais */}
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Data</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.dateFormat} onChange={(e) => updateSettings('dateFormat', e.target.value)}>
                        <option value="MMM yyyy">jan 2023</option>
                        <option value="MM/yyyy">01/2023</option>
                        <option value="yyyy">2023</option>
                        <option value="full">Janeiro 2023</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Decoração</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.headerStyle} onChange={(e) => updateSettings('headerStyle', e.target.value)}>
                        <option value="simple">Simples</option>
                        <option value="underline">Sublinhado</option>
                        <option value="box">Caixa</option>
                        <option value="left-bar">Barra Lat.</option>
                        <option value="gradient">Gradiente</option>
                      </select>
                    </div>
                 </div>

                 {/* Cor e Skills */}
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Estilo Skills</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.skillStyle} onChange={(e) => updateSettings('skillStyle', e.target.value)}>
                        <option value="tags">Tags</option>
                        <option value="bar">Barra</option>
                        <option value="dots">Pontos</option>
                        <option value="hidden">Texto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Cor Tema</label>
                      <div className="flex gap-2 items-center">
                         <input type="color" value={data.settings.primaryColor || '#000000'} onChange={(e) => updateSettings('primaryColor', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer border-2 border-slate-200 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-800"/>
                      </div>
                    </div>
                 </div>
                 
                 {/* Quick Palette */}
                 <div>
                    <div className="flex flex-wrap gap-2.5">
                       {COLOR_PRESETS.map(c => (
                         <button 
                           key={c} 
                           onClick={() => updateSettings('primaryColor', c)} 
                           className={`w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-110 ${data.settings.primaryColor === c ? 'ring-2 ring-offset-2 ring-trampo-500 scale-110' : ''}`}
                           style={{ backgroundColor: c }}
                           title={c}
                         />
                       ))}
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                   <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer"><input type="checkbox" className="rounded text-trampo-600 focus:ring-trampo-500" checked={data.settings.showQrCode} onChange={(e) => updateSettings('showQrCode', e.target.checked)} /> QR Code LinkedIn</label>
                   <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer"><input type="checkbox" className="rounded text-trampo-600 focus:ring-trampo-500" checked={data.settings.compactMode} onChange={(e) => updateSettings('compactMode', e.target.checked)} /> Modo Compacto</label>
                   <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer"><input type="checkbox" className="rounded text-trampo-600 focus:ring-trampo-500" checked={data.settings.showDuration} onChange={(e) => updateSettings('showDuration', e.target.checked)} /> Mostrar Duração</label>
                 </div>
                 
                 <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Traduzir Currículo (IA)</label>
                    <div className="flex gap-2">
                       <button onClick={() => handleTranslate('English')} disabled={!!loadingAI} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"><LangIcon size={14}/> English</button>
                       <button onClick={() => handleTranslate('Español')} disabled={!!loadingAI} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"><LangIcon size={14}/> Español</button>
                    </div>
                 </div>

                 {/* Reorder */}
                 <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                     <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Ordem das Seções</label>
                     <div className="space-y-1.5">
                        {data.settings.sectionOrder.map((sec, i) => (
                           <div key={sec} className="flex justify-between items-center text-xs font-medium bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="capitalize text-slate-700 dark:text-slate-300">{sec}</span>
                              <div className="flex gap-1">
                                 <button onClick={() => {
                                     const newOrder = [...data.settings.sectionOrder];
                                     if (i > 0) { [newOrder[i], newOrder[i-1]] = [newOrder[i-1], newOrder[i]]; updateSettings('sectionOrder', newOrder); }
                                 }} disabled={i===0} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ArrowUp size={12}/></button>
                                 <button onClick={() => {
                                     const newOrder = [...data.settings.sectionOrder];
                                     if (i < newOrder.length-1) { [newOrder[i], newOrder[i+1]] = [newOrder[i+1], newOrder[i]]; updateSettings('sectionOrder', newOrder); }
                                 }} disabled={i===data.settings.sectionOrder.length-1} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"><ArrowDown size={12}/></button>
                              </div>
                           </div>
                        ))}
                     </div>
                 </div>
               </div>
             </Section>

             {/* Personal Info */}
             <Section title="Dados Pessoais" icon={User} isOpen={openSection === 'personal'} onToggle={() => toggleSection('personal')}>
                <div className="flex items-center gap-5 mb-6">
                   <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative group transition-all">
                      {data.personalInfo.photoUrl ? (
                        <img src={data.personalInfo.photoUrl} className="w-full h-full object-cover" />
                      ) : <User size={32} className="text-slate-300"/>}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity backdrop-blur-sm">
                        <button onClick={() => fileInputRef.current?.click()} className="text-white hover:text-blue-200 p-1"><Upload size={16}/></button>
                        {data.personalInfo.photoUrl && <button onClick={() => handleChangeWithHistory({...data, personalInfo: {...data.personalInfo, photoUrl: ''}})} className="text-white hover:text-red-200 p-1"><X size={16}/></button>}
                      </div>
                   </div>
                   <div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors shadow-sm">Carregar Foto</button>
                      <p className="text-[10px] text-slate-400 mt-2">Recomendado: 1:1, máx 2MB</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Input label="Nome Completo" value={data.personalInfo.fullName} onChange={(v) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, fullName: v } })} />
                   <Input label="Cargo" value={data.personalInfo.jobTitle} onChange={(v) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, jobTitle: v } })} />
                   <Input label="Email" value={data.personalInfo.email} onChange={(v) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, email: v } })} />
                   <Input label="Telefone" value={data.personalInfo.phone} onChange={(v) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, phone: v } })} />
                   <Input label="Endereço" value={data.personalInfo.address} onChange={(v) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, address: v } })} />
                   <Input label="LinkedIn (URL)" value={data.personalInfo.linkedin} onChange={(v) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, linkedin: v } })} />
                   <Input label="Site / Portfólio" value={data.personalInfo.website} onChange={(v) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, website: v } })} />
                   <Input label="GitHub" value={data.personalInfo.github} onChange={(v) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, github: v } })} />
                </div>
                <div className="mt-5">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Resumo Profissional</label>
                    <button onClick={handleAIGenerateSummary} disabled={!!loadingAI} className="text-xs text-trampo-600 dark:text-trampo-400 font-medium flex items-center gap-1 hover:underline"><Sparkles size={12}/> Gerar com IA</button>
                  </div>
                  <div className="relative group">
                    <textarea className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-trampo-500/20 focus:border-trampo-500 outline-none transition-all" value={data.personalInfo.summary} onChange={(e) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, summary: e.target.value } })} />
                    <button onClick={() => handleImproveText(data.personalInfo.summary, (v) => handleChangeWithHistory({...data, personalInfo: {...data.personalInfo, summary: v}}))} className="absolute bottom-3 right-3 text-purple-600 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-all hover:scale-105"><Wand2 size={16}/></button>
                  </div>
                </div>
             </Section>

             {/* Dynamic Sections */}
             <Section title="Experiência" icon={Briefcase} isOpen={openSection === 'experience'} onToggle={() => toggleSection('experience')} isVisible={data.settings.visibleSections.experience} onVisibilityToggle={() => toggleVisibility('experience')} onClear={() => clearList('experience')}>
               {renderGenericList('experience', 'role', 'company', { role: 'Cargo', company: 'Empresa', current: false, description: '' }, [
                 { key: 'role', label: 'Cargo' }, { key: 'company', label: 'Empresa' }, 
                 { key: 'startDate', label: 'Início (Data)', type: 'text', placeholder: 'Ex: 01/2022' }, { key: 'endDate', label: 'Fim', type: 'text', placeholder: 'Ex: Atual' },
                 { key: 'location', label: 'Local' }
               ])}
             </Section>

             <Section title="Educação" icon={GraduationCap} isOpen={openSection === 'education'} onToggle={() => toggleSection('education')} isVisible={data.settings.visibleSections.education} onVisibilityToggle={() => toggleVisibility('education')} onClear={() => clearList('education')}>
               {renderGenericList('education', 'school', 'degree', { school: 'Instituição', degree: 'Curso' }, [
                 { key: 'school', label: 'Instituição' }, { key: 'degree', label: 'Grau/Curso' },
                 { key: 'startDate', label: 'Início' }, { key: 'endDate', label: 'Fim' },
                 { key: 'location', label: 'Local' }
               ])}
             </Section>

             <Section title="Habilidades" icon={Sparkles} isOpen={openSection === 'skills'} onToggle={() => toggleSection('skills')} isVisible={data.settings.visibleSections.skills} onVisibilityToggle={() => toggleVisibility('skills')} onClear={() => clearList('skills')}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.skills.map((skill, index) => (
                    <div key={skill.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                       <input value={skill.name} onChange={(e) => handleListChange('skills', index, 'name', e.target.value)} className="bg-transparent text-sm w-28 outline-none dark:text-slate-200" />
                       {data.settings.skillStyle !== 'hidden' && data.settings.skillStyle !== 'tags' && (
                         <input type="number" min="1" max="5" value={skill.level} onChange={(e) => handleListChange('skills', index, 'level', parseInt(e.target.value))} className="w-8 text-center text-xs border rounded bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" />
                       )}
                       <button onClick={() => removeItem('skills', index)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                   <button onClick={() => addItem('skills', { id: Date.now().toString(), name: 'Nova', level: 3 })} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 flex items-center gap-2 transition-all shadow-sm"><Plus size={16}/> Add Skill</button>
                   <button onClick={async () => { setLoadingAI('skills'); const s = await suggestSkills(data.personalInfo.jobTitle); addItem('skills', s.map(n => ({ id: Date.now()+Math.random().toString(), name: n, level: 3 })).pop()); }} disabled={!data.personalInfo.jobTitle} className="px-3 py-2 border border-purple-100 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center gap-2 transition-all shadow-sm"><Sparkles size={16}/> Sugerir IA</button>
                </div>
             </Section>
            
             <Section title="Voluntariado" icon={Heart} isOpen={openSection === 'volunteer'} onToggle={() => toggleSection('volunteer')} isVisible={data.settings.visibleSections.volunteer} onVisibilityToggle={() => toggleVisibility('volunteer')} onClear={() => clearList('volunteer')}>
               {renderGenericList('volunteer', 'role', 'organization', { role: 'Voluntário', organization: 'ONG' }, [
                 { key: 'role', label: 'Função' }, { key: 'organization', label: 'Organização' }, { key: 'startDate', label: 'Data', type: 'text' }
               ])}
             </Section>

             <Section title="Prêmios" icon={Award} isOpen={openSection === 'awards'} onToggle={() => toggleSection('awards')} isVisible={data.settings.visibleSections.awards} onVisibilityToggle={() => toggleVisibility('awards')} onClear={() => clearList('awards')}>
               {renderGenericList('awards', 'title', 'issuer', { title: 'Prêmio', issuer: 'Emissor' }, [
                 { key: 'title', label: 'Título' }, { key: 'issuer', label: 'Emissor' }, { key: 'date', label: 'Data' }
               ])}
             </Section>
             
             <Section title="Referências" icon={Users} isOpen={openSection === 'references'} onToggle={() => toggleSection('references')} isVisible={data.settings.visibleSections.references} onVisibilityToggle={() => toggleVisibility('references')} onClear={() => clearList('references')}>
                {renderGenericList('references', 'name', 'company', { name: 'Nome', company: 'Empresa', contact: 'Email/Tel', role: 'Cargo' }, [
                  { key: 'name', label: 'Nome' }, { key: 'company', label: 'Empresa' }, { key: 'role', label: 'Cargo' }, { key: 'contact', label: 'Contato' }
                ])}
             </Section>

             <Section title="Seções Personalizadas" icon={FilePlus} isOpen={openSection === 'custom'} onToggle={() => toggleSection('custom')} isVisible={data.settings.visibleSections.custom} onVisibilityToggle={() => toggleVisibility('custom')}>
                {data.customSections.map((section, sIndex) => (
                   <div key={section.id} className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900">
                      <div className="flex justify-between items-center mb-4">
                         <div className="flex gap-2 items-center flex-1">
                             {/* Icon Selector */}
                             <div className="relative group">
                                <button className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-sm text-slate-500">
                                   {CUSTOM_ICONS.find(c => c.id === section.icon)?.icon ? React.createElement(CUSTOM_ICONS.find(c => c.id === section.icon)!.icon, {size: 18}) : <FileText size={18}/>}
                                </button>
                                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 shadow-xl border dark:border-slate-700 rounded-lg p-2 hidden group-hover:grid grid-cols-3 gap-1 z-20">
                                    {CUSTOM_ICONS.map(ic => (
                                        <button key={ic.id} onClick={() => { const secs = [...data.customSections]; secs[sIndex].icon = ic.id; handleChangeWithHistory({...data, customSections: secs}); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-trampo-600" title={ic.label}>
                                            <ic.icon size={16} />
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <input value={section.name} onChange={(e) => { const secs = [...data.customSections]; secs[sIndex].name = e.target.value; handleChangeWithHistory({...data, customSections: secs}); }} className="font-bold text-base bg-transparent border-b-2 border-transparent focus:border-trampo-500 hover:border-slate-200 outline-none dark:text-slate-200 w-full transition-colors" />
                         </div>
                         <button onClick={() => { const secs = [...data.customSections]; secs.splice(sIndex, 1); handleChangeWithHistory({...data, customSections: secs}); }} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                      </div>
                      {section.items.map((item, iIndex) => (
                        <div key={item.id} className="mb-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                           <div className="grid grid-cols-2 gap-3 mb-2">
                             <Input label="Título" value={item.title} onChange={(v) => { const secs = [...data.customSections]; secs[sIndex].items[iIndex].title = v; handleChangeWithHistory({...data, customSections: secs}); }} />
                             <Input label="Subtítulo" value={item.subtitle} onChange={(v) => { const secs = [...data.customSections]; secs[sIndex].items[iIndex].subtitle = v; handleChangeWithHistory({...data, customSections: secs}); }} />
                           </div>
                           <textarea value={item.description} onChange={(e) => { const secs = [...data.customSections]; secs[sIndex].items[iIndex].description = e.target.value; handleChangeWithHistory({...data, customSections: secs}); }} className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-200 outline-none focus:border-trampo-500" placeholder="Detalhes..."/>
                        </div>
                      ))}
                      <button onClick={() => { const secs = [...data.customSections]; secs[sIndex].items.push({ id: Date.now().toString(), title: 'Novo Item', subtitle: '', date: '', description: '' }); handleChangeWithHistory({...data, customSections: secs}); }} className="text-sm text-trampo-600 font-medium hover:underline mt-2 flex items-center gap-1"><Plus size={14}/> Adicionar Item</button>
                   </div>
                ))}
                <button onClick={() => handleChangeWithHistory({...data, customSections: [...data.customSections, { id: Date.now().toString(), name: 'Nova Seção', items: [] }]})} className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"><Plus size={18}/> Criar Seção Personalizada</button>
             </Section>

             {/* Projects & Languages */}
             <Section title="Projetos" icon={Code} isOpen={openSection === 'projects'} onToggle={() => toggleSection('projects')} isVisible={data.settings.visibleSections.projects} onVisibilityToggle={() => toggleVisibility('projects')} onClear={() => clearList('projects')}>
               {renderGenericList('projects', 'name', 'url', { name: 'Projeto', url: '' }, [{key:'name', label:'Nome'}, {key:'url', label:'Link'}])}
             </Section>
             <Section title="Idiomas" icon={Languages} isOpen={openSection === 'languages'} onToggle={() => toggleSection('languages')} isVisible={data.settings.visibleSections.languages} onVisibilityToggle={() => toggleVisibility('languages')} onClear={() => clearList('languages')}>
                <div className="flex flex-wrap gap-2">
                   {data.languages.map((l, i) => (
                     <div key={i} className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
                       <input value={l} onChange={(e) => { const ls = [...data.languages]; ls[i] = e.target.value; handleChangeWithHistory({...data, languages: ls}); }} className="bg-transparent text-sm w-32 outline-none dark:text-slate-200" />
                       <button onClick={() => { const ls = [...data.languages]; ls.splice(i, 1); handleChangeWithHistory({...data, languages: ls}); }} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                     </div>
                   ))}
                   <button onClick={() => handleChangeWithHistory({...data, languages: [...data.languages, 'Novo Idioma']})} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 transition-all">+ Add</button>
                </div>
             </Section>
          </div>
        )}
        
        {activeTab === 'cover' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                <h3 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2 mb-2"><Wand2 size={20}/> Gerador de Carta</h3>
                <p className="text-xs text-purple-700 dark:text-purple-400">A IA usará o resumo e skills do seu currículo atual.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Input label="Nome da Empresa" value={data.coverLetter.companyName} onChange={(v) => handleChangeWithHistory({...data, coverLetter: {...data.coverLetter, companyName: v}})} placeholder="Ex: Google" />
               <Input label="Vaga / Cargo" value={data.coverLetter.jobTitle} onChange={(v) => handleChangeWithHistory({...data, coverLetter: {...data.coverLetter, jobTitle: v}})} placeholder="Ex: Software Engineer" />
            </div>
            <button onClick={handleAICoverLetter} disabled={!!loadingAI} className="w-full py-3 bg-purple-600 text-white rounded-xl flex justify-center items-center gap-2 hover:bg-purple-700 disabled:opacity-50 font-semibold shadow-lg shadow-purple-200 dark:shadow-none transition-transform active:scale-95">
               <Sparkles size={18} /> {loadingAI === 'cover-letter' ? 'Escrevendo Carta...' : 'Gerar Carta com IA'}
            </button>
            <textarea className="w-full h-[400px] p-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 rounded-xl text-sm leading-relaxed shadow-sm focus:ring-2 focus:ring-purple-500/20 outline-none" value={data.coverLetter.content} onChange={(e) => handleChangeWithHistory({...data, coverLetter: {...data.coverLetter, content: e.target.value}})} placeholder="Sua carta aparecerá aqui..." />
          </div>
        )}
        
        {activeTab === 'ats' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                 <h3 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 mb-2"><Search size={20}/> ATS Scanner</h3>
                 <p className="text-xs text-emerald-700 dark:text-emerald-400">Descubra se seu currículo passa nos robôs de recrutamento.</p>
             </div>

             {/* Upload Option */}
             <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-center">
                 <input type="file" ref={atsPdfInputRef} accept="application/pdf" className="hidden" onChange={handleAtsPdfUpload} />
                 {atsFile ? (
                     <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-red-100 text-red-600 rounded"><FileText size={20}/></div>
                             <div className="text-left">
                                 <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{atsFile.name}</p>
                                 <p className="text-xs text-slate-400">PDF Carregado</p>
                             </div>
                         </div>
                         <button onClick={() => setAtsFile(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><X size={16}/></button>
                     </div>
                 ) : (
                    <div onClick={() => atsPdfInputRef.current?.click()} className="cursor-pointer py-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileUp size={24}/>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clique para analisar um PDF externo</p>
                        <p className="text-xs text-slate-400 mt-1">Ou deixe vazio para analisar o currículo do editor atual.</p>
                    </div>
                 )}
             </div>

             <textarea className="w-full h-40 p-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="Cole a descrição da vaga aqui..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
             
             <button onClick={handleRunAtsAnalysis} disabled={!!loadingAI || !jobDescription} className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-semibold shadow-lg shadow-emerald-200 dark:shadow-none transition-transform active:scale-95 flex items-center justify-center gap-2">
                 {loadingAI === 'ats' ? 'Analisando...' : 'Analisar Compatibilidade'}
             </button>
             
             {atsResult && (
                 <div className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg animate-in fade-in zoom-in duration-300">
                     <div className="flex items-center justify-between mb-6">
                         <div>
                             <h4 className="font-bold text-lg dark:text-white">Resultado da Análise</h4>
                             <p className="text-xs text-slate-500 dark:text-slate-400">Baseado na vaga fornecida</p>
                         </div>
                         <div className={`relative w-20 h-20 flex items-center justify-center rounded-full border-4 ${atsResult.score >= 70 ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600' : atsResult.score >= 40 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                             <span className="text-2xl font-bold">{atsResult.score}%</span>
                         </div>
                     </div>
                     <div className="space-y-4">
                        {atsResult.missingKeywords && atsResult.missingKeywords.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                <div className="flex items-center gap-2 mb-2 text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wide">
                                    <AlertCircle size={14} /> Palavras-chave Ausentes
                                </div>
                                <div className="flex flex-wrap gap-1.5">{atsResult.missingKeywords.map((k:string, i:number) => <span key={i} className="px-2 py-1 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium rounded-md shadow-sm">{k}</span>)}</div>
                            </div>
                        )}
                        <div>
                             <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wide">
                                 <CheckCircle2 size={14} /> Feedback
                             </div>
                             <ul className="space-y-2">
                                 {atsResult.feedback?.map((f:string,i:number) => (
                                     <li key={i} className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex gap-2">
                                         <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
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
    </div>
  );
};
