
import React, { useState, useRef, useEffect } from 'react';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { ResumeData, ThemeId, AIConfig } from './types';
import { INITIAL_RESUME, THEMES } from './constants';
import { getAIConfig, saveAIConfig } from './services/geminiService';
import { Printer, Download, Upload, RotateCcw, Palette, Layout, Moon, Sun, Save, FileText, ZoomIn, ZoomOut, UserPlus, Menu, Eye, EyeOff, FileType, Bot, Settings2, Check, X } from 'lucide-react';

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium z-50 animate-slide-in flex items-center gap-2 border border-slate-700">{message}</div>;
};

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME);
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>('modern-slate');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'resume' | 'cover'>('resume');
  const [zoom, setZoom] = useState(0.8);
  const [darkMode, setDarkMode] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<ResumeData[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  // AI Settings State
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(getAIConfig());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Load Logic
  useEffect(() => {
    const saved = localStorage.getItem('trampolin_data');
    if (saved) {
        try {
            setResumeData(JSON.parse(saved));
        } catch(e) { console.error("Error loading saved data", e); }
    }
    const profiles = localStorage.getItem('trampolin_profiles');
    if (profiles) {
        try {
            setSavedProfiles(JSON.parse(profiles));
        } catch(e) {}
    }
    const dark = localStorage.getItem('trampolin_dark');
    if (dark === 'true') { setDarkMode(true); document.documentElement.classList.add('dark'); }
    
    // Initial Zoom based on screen width
    if (window.innerWidth < 768) setZoom(0.5);
    
    // Load AI Config
    setAiConfig(getAIConfig());
  }, []);

  // Save Logic & Title Update
  useEffect(() => {
    localStorage.setItem('trampolin_data', JSON.stringify(resumeData));
    document.title = resumeData.personalInfo.fullName ? `Editando: ${resumeData.personalInfo.fullName}` : 'Trampo-lin | Editor';
  }, [resumeData]);

  // Global Shortcuts
  useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
              e.preventDefault();
              handlePrint();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
              e.preventDefault();
              setToastMessage("Salvo automaticamente!");
          }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [resumeData]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('trampolin_dark', (!darkMode).toString());
  };

  const togglePrivacyMode = () => {
      setResumeData(prev => ({ ...prev, settings: { ...prev.settings, privacyMode: !prev.settings.privacyMode } }));
      setToastMessage(resumeData.settings.privacyMode ? "Modo Privacidade Desativado" : "Modo Privacidade Ativado");
  };

  const saveProfile = () => {
    const name = prompt("Nome para este perfil (ex: Versão Backend):", resumeData.profileName);
    if (!name) return;
    const newProfile = { ...resumeData, id: Date.now().toString(), profileName: name };
    const newProfiles = [...savedProfiles, newProfile];
    setSavedProfiles(newProfiles);
    localStorage.setItem('trampolin_profiles', JSON.stringify(newProfiles));
    setResumeData(newProfile);
    setToastMessage(`Perfil "${name}" salvo!`);
  };

  const loadProfile = (profile: ResumeData) => {
    if (confirm(`Carregar perfil "${profile.profileName}"? Dados não salvos na tela atual serão perdidos.`)) {
      setResumeData(profile);
      setShowProfileMenu(false);
      setToastMessage("Perfil carregado.");
    }
  };

  const deleteProfile = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm("Excluir este perfil salvo?")) {
          const newProfiles = savedProfiles.filter(p => p.id !== id);
          setSavedProfiles(newProfiles);
          localStorage.setItem('trampolin_profiles', JSON.stringify(newProfiles));
      }
  };

  const handlePrint = () => {
      const oldTitle = document.title;
      const sanitizedName = resumeData.personalInfo.fullName.replace(/[^a-z0-9]/gi, '_');
      const sanitizedJob = resumeData.personalInfo.jobTitle.replace(/[^a-z0-9]/gi, '_');
      document.title = `Curriculo-${sanitizedName}-${sanitizedJob}`;
      window.print();
      document.title = oldTitle;
  };

  const handleTxtExport = () => {
      let text = `Nome: ${resumeData.personalInfo.fullName}\n`;
      text += `Cargo: ${resumeData.personalInfo.jobTitle}\n`;
      text += `Email: ${resumeData.personalInfo.email}\n`;
      text += `Resumo: ${resumeData.personalInfo.summary}\n\n`;
      
      text += `EXPERIÊNCIA\n`;
      resumeData.experience.forEach(exp => {
          text += `${exp.role} em ${exp.company} (${exp.startDate} - ${exp.endDate || 'Atual'})\n${exp.description}\n\n`;
      });
      
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculo-texto.txt`;
      a.click();
  };
  
  const handleSaveAIConfig = () => {
      saveAIConfig(aiConfig);
      setShowAISettings(false);
      setToastMessage("Configurações de IA salvas!");
  };

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-200 overflow-hidden selection:bg-trampo-500/30">
      {/* Navbar */}
      <nav className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 shadow-sm z-50 print:hidden flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-trampo-500 to-trampo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-trampo-500/20 transform hover:rotate-3 transition-transform">T</div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white hidden md:inline">Trampo-lin</span>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
           {/* Mobile Preview Toggle */}
           <button onClick={() => setShowMobilePreview(!showMobilePreview)} className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs">
               {showMobilePreview ? 'Editar' : 'Ver PDF'}
           </button>

           {/* AI Settings Button */}
           <button onClick={() => setShowAISettings(true)} className={`p-2.5 rounded-xl transition-colors ${showAISettings ? 'bg-trampo-100 text-trampo-600 dark:bg-trampo-900/30 dark:text-trampo-400' : 'text-slate-500 hover:text-trampo-600 hover:bg-trampo-50 dark:hover:bg-trampo-900/10'}`} title="Configurar IA"><Bot size={20}/></button>

           {/* Profile Manager */}
           <div className="relative">
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Gerenciar Perfis">
               <UserPlus size={18} /> <span className="hidden lg:inline truncate max-w-[120px]">{resumeData.profileName || 'Meu Currículo'}</span>
             </button>
             {showProfileMenu && (
               <div className="absolute top-14 right-0 w-64 bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl p-2 z-50 animate-in slide-in-from-top-2 duration-200">
                 <div className="p-2">
                    <button onClick={saveProfile} className="w-full text-left p-2.5 text-xs font-bold hover:bg-trampo-50 dark:hover:bg-trampo-900/20 rounded-lg flex gap-2 items-center text-trampo-600 dark:text-trampo-400 mb-2 border border-dashed border-trampo-200 dark:border-trampo-800"><Save size={14}/> SALVAR VERSÃO ATUAL</button>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-2">Salvos</div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                        {savedProfiles.map(p => (
                        <div key={p.id} className="flex group">
                            <button onClick={() => loadProfile(p)} className="flex-1 text-left p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-l-lg truncate text-slate-600 dark:text-slate-300 font-medium">{p.profileName}</button>
                            <button onClick={(e) => deleteProfile(p.id!, e)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 hover:text-red-500 rounded-r-lg"><RotateCcw size={12} className="rotate-45"/></button>
                        </div>
                        ))}
                        {savedProfiles.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Nenhum perfil salvo.</p>}
                    </div>
                 </div>
               </div>
             )}
           </div>

           <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

           <button onClick={togglePrivacyMode} className={`p-2.5 rounded-xl transition-colors ${resumeData.settings.privacyMode ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Modo Privacidade (Blur)"><EyeOff size={18}/></button>
           <button onClick={toggleDarkMode} className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
           
           <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
               <button onClick={() => setPreviewMode('resume')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${previewMode === 'resume' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>CV</button>
               <button onClick={() => setPreviewMode('cover')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${previewMode === 'cover' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>CARTA</button>
           </div>
           
           <button onClick={() => setShowThemeSelector(!showThemeSelector)} className={`p-2.5 rounded-xl transition-colors ${showThemeSelector ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'text-slate-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'}`} title="Temas"><Palette size={20}/></button>
           <button onClick={handlePrint} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/5 transition-all active:scale-95"><Printer size={18}/> <span>Baixar PDF</span></button>
        </div>
      </nav>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Editor Sidebar */}
        <div className={`w-full md:w-[480px] lg:w-[520px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full overflow-hidden print:hidden z-10 flex-shrink-0 shadow-xl transition-transform duration-300 absolute md:relative ${showMobilePreview ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
            <Editor data={resumeData} onChange={setResumeData} onShowToast={setToastMessage} />
        </div>

        {/* Preview Area */}
        <div className={`flex-1 bg-slate-100/50 dark:bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center print:p-0 print:bg-white print:overflow-visible w-full absolute md:relative h-full transition-transform duration-300 ${showMobilePreview ? 'translate-x-0 z-20 bg-white' : 'translate-x-full md:translate-x-0'}`}>
          
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className="w-full h-full overflow-auto flex items-start justify-center p-4 md:p-12 custom-scrollbar relative z-10 pb-24">
              {/* Theme Selector Modal (Existing) */}
              {showThemeSelector && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-50 animate-in slide-in-from-top-4 duration-300 w-[95%] max-w-4xl">
                   <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-lg dark:text-white">Galeria de Temas</h3>
                        <p className="text-xs text-slate-500">Escolha o visual que mais combina com você.</p>
                      </div>
                      <button onClick={() => setShowThemeSelector(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><span className="text-xl">×</span></button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {THEMES.map(theme => (
                       <button key={theme.id} onClick={() => setActiveThemeId(theme.id)} className={`group text-left border rounded-xl p-3 transition-all hover:shadow-lg ${activeThemeId === theme.id ? 'border-trampo-500 ring-2 ring-trampo-500/20 bg-trampo-50/50 dark:bg-trampo-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-trampo-300'}`}>
                         <div className="w-full aspect-[3/4] rounded-lg mb-3 overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                            <div className="absolute inset-0" style={{backgroundColor: theme.colors.bg}}></div>
                            <div className="absolute top-0 left-0 w-full h-1/3 opacity-80" style={{backgroundColor: theme.colors.primary}}></div>
                            {theme.layout.includes('sidebar') && <div className="absolute top-0 left-0 w-1/3 h-full opacity-90 mix-blend-multiply" style={{backgroundColor: theme.colors.primary}}></div>}
                         </div>
                         <div className="font-semibold text-xs text-slate-700 dark:text-slate-300 truncate">{theme.name}</div>
                       </button>
                     ))}
                   </div>
                </div>
              )}

              {/* AI Settings Modal (New) */}
              {showAISettings && (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><Bot size={20}/> Configuração de IA</h3>
                          <button onClick={() => setShowAISettings(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={18}/></button>
                       </div>
                       
                       <div className="space-y-4">
                          <div>
                             <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Provedor</label>
                             <div className="flex gap-2">
                                <button onClick={() => setAiConfig({...aiConfig, provider: 'gemini'})} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${aiConfig.provider === 'gemini' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>Google Gemini</button>
                                <button onClick={() => setAiConfig({...aiConfig, provider: 'openrouter'})} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${aiConfig.provider === 'openrouter' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>OpenRouter</button>
                             </div>
                          </div>

                          <div>
                             <label className="block text-xs font-bold uppercase text-slate-500 mb-2">API Key {aiConfig.provider === 'gemini' ? '(Opcional se configurado no servidor)' : '(Obrigatória)'}</label>
                             <input 
                                type="password" 
                                value={aiConfig.apiKey} 
                                onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
                                placeholder={aiConfig.provider === 'gemini' ? "Padrão do sistema..." : "sk-or-..."}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500 outline-none dark:text-white"
                             />
                             <p className="text-[10px] text-slate-400 mt-1">Sua chave é salva apenas no navegador.</p>
                          </div>

                          <div>
                             <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Modelo</label>
                             <input 
                                type="text" 
                                value={aiConfig.model} 
                                onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                                placeholder={aiConfig.provider === 'gemini' ? "gemini-3-flash-preview" : "google/gemini-2.0-flash-001"}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500 outline-none dark:text-white"
                             />
                             {aiConfig.provider === 'openrouter' && (
                                 <div className="flex gap-1 flex-wrap mt-2">
                                     {['google/gemini-2.0-flash-001', 'deepseek/deepseek-chat', 'meta-llama/llama-3.3-70b-instruct', 'anthropic/claude-3.5-sonnet'].map(m => (
                                         <button key={m} onClick={() => setAiConfig({...aiConfig, model: m})} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 truncate max-w-[150px]">{m.split('/')[1]}</button>
                                     ))}
                                 </div>
                             )}
                          </div>
                       </div>

                       <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                          <button onClick={handleSaveAIConfig} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2">
                             <Check size={16}/> Salvar Configuração
                          </button>
                       </div>
                    </div>
                 </div>
              )}

              {/* Resume Paper Container */}
              <div ref={printRef} className={`relative flex-shrink-0 transition-transform duration-300 print:scale-100 print:w-full print:h-full ${resumeData.settings.paperSize === 'letter' ? 'w-[216mm] min-h-[279mm]' : 'w-[210mm] min-h-[297mm]'}`}>
                <Preview data={resumeData} theme={THEMES.find(t => t.id === activeThemeId) || THEMES[0]} mode={previewMode} zoom={zoom} />
              </div>
          </div>

          {/* Floating Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 print:hidden z-40">
             <button onClick={handleTxtExport} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Exportar TXT"><FileType size={18}/></button>
             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
             <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Diminuir Zoom"><ZoomOut size={18}/></button>
             <span className="text-xs font-bold w-12 text-center tabular-nums text-slate-600 dark:text-slate-300">{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Aumentar Zoom"><ZoomIn size={18}/></button>
             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
             <button onClick={() => setZoom(window.innerWidth < 768 ? 0.45 : 0.8)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Resetar"><RotateCcw size={16}/></button>
             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 md:hidden"></div>
             <button onClick={handlePrint} className="md:hidden p-2 bg-slate-900 text-white rounded-xl shadow-lg"><Printer size={18}/></button>
          </div>

        </div>
      </main>
      
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;
