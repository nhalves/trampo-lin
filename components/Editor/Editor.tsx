
import React, { useState, useRef } from 'react';
import { ResumeData, ResumeSettings } from '../../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Wand2, Eye, EyeOff, ArrowUp, ArrowDown, Settings, Briefcase, GraduationCap, Medal, Code, User, Languages, FileText, Search, QrCode, Heart, Award, Users, FilePlus, Copy, Eraser, Languages as LangIcon, Upload, X, Type } from 'lucide-react';
import { improveText, generateSummary, suggestSkills, generateCoverLetter, analyzeJobMatch, translateText } from '../../services/geminiService';
import { AVAILABLE_FONTS } from '../../constants';

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

const Section = ({ title, icon: Icon, children, isOpen, onToggle, isVisible, onVisibilityToggle, onClear }: any) => (
  <div className={`border rounded-lg bg-white dark:bg-slate-800 shadow-sm overflow-hidden mb-4 transition-all ${!isVisible && isVisible !== undefined ? 'opacity-60 border-slate-200 dark:border-slate-700 border-dashed' : 'border-slate-200 dark:border-slate-700'}`}>
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={onToggle}>
      <div className="flex-1 flex items-center gap-2 text-left">
        {Icon && <Icon size={18} className="text-slate-500 dark:text-slate-400" />}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        {onClear && (
          <button onClick={(e) => { e.stopPropagation(); if(confirm('Limpar esta seção?')) onClear(); }} className="text-slate-400 hover:text-red-500" title="Limpar Seção">
            <Eraser size={16} />
          </button>
        )}
        {onVisibilityToggle && (
          <button onClick={(e) => { e.stopPropagation(); onVisibilityToggle(); }} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title={isVisible ? "Ocultar" : "Mostrar"}>
            {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
        <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
    </div>
    {isOpen && <div className="p-4 border-t border-slate-100 dark:border-slate-700">{children}</div>}
  </div>
);

export const Editor: React.FC<EditorProps> = ({ data, onChange, onShowToast }) => {
  const [openSection, setOpenSection] = useState<string>('settings');
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'ats'>('resume');
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => setOpenSection(openSection === section ? '' : section);

  // --- Helpers ---
  const updateSettings = (field: keyof ResumeSettings, value: any) => {
    onChange({ ...data, settings: { ...data.settings, [field]: value } });
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
        onChange({ ...data, personalInfo: { ...data.personalInfo, photoUrl: reader.result as string } });
      };
      reader.readAsDataURL(file);
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

  const handleAICoverLetter = async () => {
    if (!data.coverLetter.companyName || !data.coverLetter.jobTitle) {
      onShowToast("Por favor, preencha o nome da empresa e o cargo.");
      return;
    }
    setLoadingAI('cover-letter');
    const content = await generateCoverLetter(data, data.coverLetter.companyName, data.coverLetter.jobTitle);
    onChange({ ...data, coverLetter: { ...data.coverLetter, content } });
    setLoadingAI(null);
    onShowToast("Carta gerada com sucesso!");
  };

  const handleAIGenerateSummary = async () => {
    setLoadingAI('gen-summary');
    const summary = await generateSummary(data.personalInfo.jobTitle, data.experience);
    onChange({ ...data, personalInfo: { ...data.personalInfo, summary } });
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
     onChange(newData);
     setLoadingAI(null);
     onShowToast("Tradução concluída!");
  };

  const handleListChange = (listName: string, index: number, field: string, value: any) => {
    const list = [...(data as any)[listName]];
    list[index] = { ...list[index], [field]: value };
    onChange({ ...data, [listName]: list });
  };

  const addItem = (listName: string, item: any) => {
    onChange({ ...data, [listName]: [item, ...(data as any)[listName]] });
    onShowToast("Item adicionado.");
  };

  const removeItem = (listName: string, index: number) => {
     const list = [...(data as any)[listName]];
     onChange({ ...data, [listName]: list.filter((_, i) => i !== index) });
  };
  
  const clearList = (listName: string) => {
    onChange({ ...data, [listName]: [] });
    onShowToast("Seção limpa.");
  };

  const duplicateItem = (listName: string, index: number) => {
    const list = [...(data as any)[listName]];
    const item = { ...list[index], id: Date.now().toString() };
    list.splice(index + 1, 0, item);
    onChange({ ...data, [listName]: list });
    onShowToast("Item duplicado.");
  };

  const moveItem = (listName: string, index: number, direction: 'up' | 'down') => {
    const list = [...(data as any)[listName]];
    if (direction === 'up' && index > 0) {
      [list[index], list[index - 1]] = [list[index - 1], list[index]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
    }
    onChange({ ...data, [listName]: list });
  };

  // --- Renderers ---
  const renderGenericList = (key: string, titleField: string, subtitleField: string, newItem: any, fields: any[]) => (
    <div className="space-y-4">
       {(data as any)[key].map((item: any, index: number) => (
         <div key={item.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 relative group">
            <div className="absolute top-2 right-2 flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity z-10">
               <button onClick={() => duplicateItem(key, index)} className="p-1 hover:text-blue-500"><Copy size={14}/></button>
               <button onClick={() => moveItem(key, index, 'up')} className="p-1 hover:text-slate-600 dark:hover:text-slate-300"><ArrowUp size={14}/></button>
               <button onClick={() => moveItem(key, index, 'down')} className="p-1 hover:text-slate-600 dark:hover:text-slate-300"><ArrowDown size={14}/></button>
               <button onClick={() => removeItem(key, index)} className="p-1 hover:text-red-500"><Trash2 size={14}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 pr-16">
              {fields.map(f => (
                <div key={f.key} className={f.full ? "col-span-2" : ""}>
                   <Input label={f.label} value={item[f.key]} onChange={(v) => handleListChange(key, index, f.key, v)} type={f.type || 'text'} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            {item.description !== undefined && (
               <div className="relative">
                 <textarea className="w-full p-2 pr-8 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded text-sm min-h-[80px]" value={item.description} onChange={(e) => handleListChange(key, index, 'description', e.target.value)} placeholder="Descreva suas conquistas..." />
                 <button onClick={() => handleImproveText(item.description, (v) => handleListChange(key, index, 'description', v))} className="absolute bottom-2 right-2 text-purple-500 hover:text-purple-700 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-200 dark:border-slate-600" title="Melhorar com IA">
                   <Wand2 size={14} />
                 </button>
               </div>
            )}
         </div>
       ))}
       <button onClick={() => addItem(key, { ...newItem, id: Date.now().toString() })} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-center items-center gap-2"><Plus size={16}/> Adicionar Item</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <button onClick={() => setActiveTab('resume')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'resume' ? 'bg-white dark:bg-slate-800 text-trampo-600 border-t-2 border-trampo-600' : 'text-slate-500 dark:text-slate-400'}`}><FileText size={16}/> Currículo</button>
        <button onClick={() => setActiveTab('cover')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'cover' ? 'bg-white dark:bg-slate-800 text-trampo-600 border-t-2 border-trampo-600' : 'text-slate-500 dark:text-slate-400'}`}><Wand2 size={16}/> Carta</button>
        <button onClick={() => setActiveTab('ats')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'ats' ? 'bg-white dark:bg-slate-800 text-trampo-600 border-t-2 border-trampo-600' : 'text-slate-500 dark:text-slate-400'}`}><Search size={16}/> ATS</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {activeTab === 'resume' && (
          <div className="space-y-6 pb-20">
             {/* Progress Bar */}
             <div className="mb-6 bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden relative group" title="Nível de preenchimento">
               <div className="bg-trampo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${completeness}%` }}></div>
               <span className="absolute top-3 right-0 text-[10px] text-slate-400">{completeness}% Completo</span>
             </div>

             {/* Settings */}
             <Section title="Aparência & Layout" icon={Settings} isOpen={openSection === 'settings'} onToggle={() => toggleSection('settings')}>
               <div className="space-y-4">
                 
                 {/* Escalas */}
                 <div className="grid grid-cols-3 gap-2">
                    <Input label="Fonte" value={data.settings.fontScale} onChange={(v) => updateSettings('fontScale', v)} type="number" step="0.05" />
                    <Input label="Espaço" value={data.settings.spacingScale} onChange={(v) => updateSettings('spacingScale', v)} type="number" step="0.1" />
                    <Input label="Margem" value={data.settings.marginScale} onChange={(v) => updateSettings('marginScale', v)} type="number" step="0.1" />
                 </div>

                 {/* Fontes */}
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Título</label>
                      <select className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" value={data.settings.headerFont} onChange={(e) => updateSettings('headerFont', e.target.value)}>
                        {AVAILABLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Corpo</label>
                      <select className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" value={data.settings.bodyFont} onChange={(e) => updateSettings('bodyFont', e.target.value)}>
                        {AVAILABLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                   </div>
                 </div>

                 {/* Estilos Visuais */}
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Data</label>
                      <select className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" value={data.settings.dateFormat} onChange={(e) => updateSettings('dateFormat', e.target.value)}>
                        <option value="MMM yyyy">jan 2023</option>
                        <option value="MM/yyyy">01/2023</option>
                        <option value="yyyy">2023</option>
                        <option value="full">Janeiro 2023</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Decoração</label>
                      <select className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" value={data.settings.headerStyle} onChange={(e) => updateSettings('headerStyle', e.target.value)}>
                        <option value="simple">Simples</option>
                        <option value="underline">Sublinhado</option>
                        <option value="box">Caixa</option>
                        <option value="left-bar">Barra Lat.</option>
                      </select>
                    </div>
                 </div>

                 {/* Cor e Skills */}
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Estilo Skills</label>
                      <select className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" value={data.settings.skillStyle} onChange={(e) => updateSettings('skillStyle', e.target.value)}>
                        <option value="tags">Tags</option>
                        <option value="bar">Barra</option>
                        <option value="dots">Pontos</option>
                        <option value="hidden">Texto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Cor Tema</label>
                      <div className="flex gap-2 items-center">
                         <input type="color" value={data.settings.primaryColor || '#000000'} onChange={(e) => updateSettings('primaryColor', e.target.value)} className="w-full h-9 rounded cursor-pointer border dark:border-slate-600 p-0.5 bg-white dark:bg-slate-700"/>
                      </div>
                    </div>
                 </div>
                 
                 {/* Quick Palette */}
                 <div>
                    <div className="flex flex-wrap gap-2">
                       {COLOR_PRESETS.map(c => (
                         <button 
                           key={c} 
                           onClick={() => updateSettings('primaryColor', c)} 
                           className={`w-5 h-5 rounded-full border border-slate-200 dark:border-slate-600 transition-transform hover:scale-110 ${data.settings.primaryColor === c ? 'ring-2 ring-offset-2 ring-trampo-500' : ''}`}
                           style={{ backgroundColor: c }}
                           title={c}
                         />
                       ))}
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-4 pt-2">
                   <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={data.settings.showQrCode} onChange={(e) => updateSettings('showQrCode', e.target.checked)} /> QR Code LinkedIn</label>
                   <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={data.settings.compactMode} onChange={(e) => updateSettings('compactMode', e.target.checked)} /> Modo Compacto</label>
                   <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={data.settings.showDuration} onChange={(e) => updateSettings('showDuration', e.target.checked)} /> Mostrar Duração</label>
                 </div>
                 
                 <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Traduzir Currículo (IA)</label>
                    <div className="flex gap-2">
                       <button onClick={() => handleTranslate('English')} disabled={!!loadingAI} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1"><LangIcon size={12}/> English</button>
                       <button onClick={() => handleTranslate('Español')} disabled={!!loadingAI} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1"><LangIcon size={12}/> Español</button>
                    </div>
                 </div>

                 {/* Reorder (Simple List for now) */}
                 <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                     <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Ordem das Seções</label>
                     <div className="space-y-1">
                        {data.settings.sectionOrder.map((sec, i) => (
                           <div key={sec} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-200 dark:border-slate-600">
                              <span className="capitalize">{sec}</span>
                              <div className="flex gap-1">
                                 <button onClick={() => {
                                     const newOrder = [...data.settings.sectionOrder];
                                     if (i > 0) { [newOrder[i], newOrder[i-1]] = [newOrder[i-1], newOrder[i]]; updateSettings('sectionOrder', newOrder); }
                                 }} disabled={i===0} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"><ArrowUp size={12}/></button>
                                 <button onClick={() => {
                                     const newOrder = [...data.settings.sectionOrder];
                                     if (i < newOrder.length-1) { [newOrder[i], newOrder[i+1]] = [newOrder[i+1], newOrder[i]]; updateSettings('sectionOrder', newOrder); }
                                 }} disabled={i===data.settings.sectionOrder.length-1} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"><ArrowDown size={12}/></button>
                              </div>
                           </div>
                        ))}
                     </div>
                 </div>
               </div>
             </Section>

             {/* Personal Info */}
             <Section title="Dados Pessoais" icon={User} isOpen={openSection === 'personal'} onToggle={() => toggleSection('personal')}>
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 relative group">
                      {data.personalInfo.photoUrl ? (
                        <img src={data.personalInfo.photoUrl} className="w-full h-full object-cover" />
                      ) : <User className="text-slate-400"/>}
                      <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="text-white hover:text-blue-300"><Upload size={14}/></button>
                        {data.personalInfo.photoUrl && <button onClick={() => onChange({...data, personalInfo: {...data.personalInfo, photoUrl: ''}})} className="text-white hover:text-red-300"><X size={14}/></button>}
                      </div>
                   </div>
                   <div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded hover:bg-slate-200">Carregar Foto</button>
                      <p className="text-[10px] text-slate-400 mt-1">Sugerido: Quadrada, máx 2MB</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <Input label="Nome Completo" value={data.personalInfo.fullName} onChange={(v) => onChange({ ...data, personalInfo: { ...data.personalInfo, fullName: v } })} />
                   <Input label="Cargo" value={data.personalInfo.jobTitle} onChange={(v) => onChange({ ...data, personalInfo: { ...data.personalInfo, jobTitle: v } })} />
                   <Input label="Email" value={data.personalInfo.email} onChange={(v) => onChange({ ...data, personalInfo: { ...data.personalInfo, email: v } })} />
                   <Input label="Telefone" value={data.personalInfo.phone} onChange={(v) => onChange({ ...data, personalInfo: { ...data.personalInfo, phone: v } })} />
                   <Input label="Endereço" value={data.personalInfo.address} onChange={(v) => onChange({ ...data, personalInfo: { ...data.personalInfo, address: v } })} />
                   <Input label="LinkedIn (URL)" value={data.personalInfo.linkedin} onChange={(v) => onChange({ ...data, personalInfo: { ...data.personalInfo, linkedin: v } })} />
                   <Input label="Site / Portfólio" value={data.personalInfo.website} onChange={(v) => onChange({ ...data, personalInfo: { ...data.personalInfo, website: v } })} />
                   <Input label="GitHub" value={data.personalInfo.github} onChange={(v) => onChange({ ...data, personalInfo: { ...data.personalInfo, github: v } })} />
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Resumo Profissional</label>
                    <button onClick={handleAIGenerateSummary} disabled={!!loadingAI} className="text-xs text-purple-600 flex items-center gap-1"><Sparkles size={12}/> Gerar com IA</button>
                  </div>
                  <div className="relative">
                    <textarea className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded text-sm min-h-[100px]" value={data.personalInfo.summary} onChange={(e) => onChange({ ...data, personalInfo: { ...data.personalInfo, summary: e.target.value } })} />
                    <button onClick={() => handleImproveText(data.personalInfo.summary, (v) => onChange({...data, personalInfo: {...data.personalInfo, summary: v}}))} className="absolute bottom-2 right-2 text-purple-500 bg-white dark:bg-slate-800 rounded-full p-1 shadow border border-slate-200 dark:border-slate-600"><Wand2 size={14}/></button>
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
                    <div key={skill.id} className="bg-slate-100 dark:bg-slate-700 p-2 rounded flex items-center gap-2">
                       <input value={skill.name} onChange={(e) => handleListChange('skills', index, 'name', e.target.value)} className="bg-transparent text-sm w-24 outline-none dark:text-slate-200" />
                       {data.settings.skillStyle !== 'hidden' && data.settings.skillStyle !== 'tags' && (
                         <input type="number" min="1" max="5" value={skill.level} onChange={(e) => handleListChange('skills', index, 'level', parseInt(e.target.value))} className="w-8 h-6 text-center text-xs border rounded dark:bg-slate-600 dark:text-slate-200" />
                       )}
                       <button onClick={() => removeItem('skills', index)} className="text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                   <button onClick={() => addItem('skills', { id: Date.now().toString(), name: 'Nova', level: 3 })} className="px-3 py-2 border rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 flex items-center gap-1"><Plus size={14}/> Add Skill</button>
                   <button onClick={async () => { setLoadingAI('skills'); const s = await suggestSkills(data.personalInfo.jobTitle); addItem('skills', s.map(n => ({ id: Date.now()+Math.random().toString(), name: n, level: 3 })).pop()); }} disabled={!data.personalInfo.jobTitle} className="px-3 py-2 border rounded text-sm hover:bg-slate-50 text-purple-600 dark:text-purple-400 flex items-center gap-1"><Sparkles size={14}/> Sugerir IA</button>
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
                   <div key={section.id} className="mb-6 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded">
                      <div className="flex justify-between mb-2">
                         <input value={section.name} onChange={(e) => { const secs = [...data.customSections]; secs[sIndex].name = e.target.value; onChange({...data, customSections: secs}); }} className="font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:text-slate-200" />
                         <button onClick={() => { const secs = [...data.customSections]; secs.splice(sIndex, 1); onChange({...data, customSections: secs}); }} className="text-red-400"><Trash2 size={14}/></button>
                      </div>
                      {section.items.map((item, iIndex) => (
                        <div key={item.id} className="mb-2 pl-2 border-l-2 border-slate-200">
                           <div className="grid grid-cols-2 gap-2 mb-1">
                             <Input label="Título" value={item.title} onChange={(v) => { const secs = [...data.customSections]; secs[sIndex].items[iIndex].title = v; onChange({...data, customSections: secs}); }} />
                             <Input label="Subtítulo" value={item.subtitle} onChange={(v) => { const secs = [...data.customSections]; secs[sIndex].items[iIndex].subtitle = v; onChange({...data, customSections: secs}); }} />
                           </div>
                           <textarea value={item.description} onChange={(e) => { const secs = [...data.customSections]; secs[sIndex].items[iIndex].description = e.target.value; onChange({...data, customSections: secs}); }} className="w-full text-xs p-1 border rounded" placeholder="Detalhes..."/>
                        </div>
                      ))}
                      <button onClick={() => { const secs = [...data.customSections]; secs[sIndex].items.push({ id: Date.now().toString(), title: 'Novo Item', subtitle: '', date: '', description: '' }); onChange({...data, customSections: secs}); }} className="text-xs text-blue-500 mt-2">+ Item</button>
                   </div>
                ))}
                <button onClick={() => onChange({...data, customSections: [...data.customSections, { id: Date.now().toString(), name: 'Nova Seção', items: [] }]})} className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded flex items-center justify-center gap-1"><Plus size={14}/> Criar Seção</button>
             </Section>

             {/* Projects & Languages */}
             <Section title="Projetos" icon={Code} isOpen={openSection === 'projects'} onToggle={() => toggleSection('projects')} isVisible={data.settings.visibleSections.projects} onVisibilityToggle={() => toggleVisibility('projects')} onClear={() => clearList('projects')}>
               {renderGenericList('projects', 'name', 'url', { name: 'Projeto', url: '' }, [{key:'name', label:'Nome'}, {key:'url', label:'Link'}])}
             </Section>
             <Section title="Idiomas" icon={Languages} isOpen={openSection === 'languages'} onToggle={() => toggleSection('languages')} isVisible={data.settings.visibleSections.languages} onVisibilityToggle={() => toggleVisibility('languages')} onClear={() => clearList('languages')}>
                <div className="flex flex-wrap gap-2">
                   {data.languages.map((l, i) => (
                     <div key={i} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                       <input value={l} onChange={(e) => { const ls = [...data.languages]; ls[i] = e.target.value; onChange({...data, languages: ls}); }} className="bg-transparent text-sm w-32 outline-none dark:text-slate-200" />
                       <button onClick={() => { const ls = [...data.languages]; ls.splice(i, 1); onChange({...data, languages: ls}); }} className="text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                     </div>
                   ))}
                   <button onClick={() => onChange({...data, languages: [...data.languages, 'Novo Idioma']})} className="px-3 py-1 border rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300">+ Add</button>
                </div>
             </Section>
          </div>
        )}
        {activeTab === 'cover' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Gerador de Carta</h3>
            <div className="grid grid-cols-2 gap-4">
               <Input label="Empresa" value={data.coverLetter.companyName} onChange={(v) => onChange({...data, coverLetter: {...data.coverLetter, companyName: v}})} />
               <Input label="Cargo" value={data.coverLetter.jobTitle} onChange={(v) => onChange({...data, coverLetter: {...data.coverLetter, jobTitle: v}})} />
            </div>
            <button onClick={handleAICoverLetter} disabled={!!loadingAI} className="w-full py-2 bg-trampo-600 text-white rounded-lg flex justify-center items-center gap-2 hover:bg-trampo-700 disabled:opacity-50">
               <Sparkles size={16} /> {loadingAI === 'cover-letter' ? 'Escrevendo...' : 'Gerar Carta'}
            </button>
            <textarea className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded text-sm leading-relaxed" value={data.coverLetter.content} onChange={(e) => onChange({...data, coverLetter: {...data.coverLetter, content: e.target.value}})} />
          </div>
        )}
        {activeTab === 'ats' && (
           <div className="space-y-6">
             <h3 className="font-bold text-slate-800 dark:text-slate-200">ATS Scanner</h3>
             <textarea className="w-full h-40 p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded text-sm" placeholder="Cole a descrição da vaga..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
             <button onClick={async () => { setLoadingAI('ats'); setAtsResult(await analyzeJobMatch(JSON.stringify(data), jobDescription)); setLoadingAI(null); }} disabled={!!loadingAI || !jobDescription} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">Analisar</button>
             {atsResult && <div className="p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{atsResult}</div>}
           </div>
        )}
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder = "", step }: any) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</label>
    <input type={type} step={step} placeholder={placeholder} className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:bg-slate-700 dark:text-slate-200" value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);
