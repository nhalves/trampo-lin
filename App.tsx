
import React, { useState, useRef, useEffect } from 'react';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ResumeData, ThemeId, AIConfig } from './types';
import { INITIAL_RESUME, THEMES } from './constants';
import { getAIConfig, saveAIConfig, validateConnection } from './services/geminiService';
import { Printer, Download, Upload, RotateCcw, Palette, Layout, Moon, Sun, Save, FileText, ZoomIn, ZoomOut, UserPlus, Menu, Eye, EyeOff, FileType, Bot, Settings2, Check, X, AlertCircle, Monitor, ChevronRight, Maximize, Briefcase, Key, Linkedin, Minimize2, Edit2, Loader2, RefreshCw } from 'lucide-react';
import { JobTracker } from './components/JobTracker/JobTracker';
import { LinkedinProfileGenerator } from './components/Linkedin/LinkedinProfileGenerator';
import { Onboarding } from './components/Onboarding/Onboarding';

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-sm font-medium z-[150] animate-slide-in flex items-center gap-2 border border-slate-700/50 transform transition-all hover:scale-105 cursor-default">{message}</div>;
};

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME);
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>('modern-slate');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'resume' | 'cover'>('resume');
  const [zoom, setZoom] = useState(0.8);
  const [darkMode, setDarkMode] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<ResumeData[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showJobTracker, setShowJobTracker] = useState(false);
  const [showLinkedinGenerator, setShowLinkedinGenerator] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // AI Settings State
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(getAIConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const hasEnvKey = !!process.env.API_KEY && process.env.API_KEY.length > 0;

  // Confirm Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Load Logic
  useEffect(() => {
    const saved = localStorage.getItem('trampolin_data');
    if (saved) {
        try { setResumeData(JSON.parse(saved)); } catch(e) { console.error("Error loading saved data", e); }
    }
    const profiles = localStorage.getItem('trampolin_profiles');
    if (profiles) {
        try { setSavedProfiles(JSON.parse(profiles)); } catch(e) {}
    }
    const dark = localStorage.getItem('trampolin_dark');
    if (dark === 'true') { setDarkMode(true); document.documentElement.classList.add('dark'); }
    
    // Persist Focus Mode
    const savedFocus = localStorage.getItem('trampolin_focus');
    if (savedFocus === 'true') setFocusMode(true);

    const hasSeenOnboarding = localStorage.getItem('trampolin_onboarding');
    if (!hasSeenOnboarding) { setTimeout(() => setShowOnboarding(true), 1000); }
    
    handleAutoFit();
    setAiConfig(getAIConfig());
  }, []);

  useEffect(() => {
     localStorage.setItem('trampolin_focus', focusMode.toString());
  }, [focusMode]);

  // Handle Window Resize for AutoFit
  useEffect(() => {
     const handleResize = () => { /* Auto-fit logic if needed */ };
     window.addEventListener('resize', handleResize);
     return () => window.removeEventListener('resize', handleResize);
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
              setShowPrintModal(true);
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
              e.preventDefault();
              setToastMessage("Salvo automaticamente!");
          }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [resumeData]);

  const requestConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' = 'danger') => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm, type });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

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
    requestConfirm("Carregar Perfil?", `Deseja carregar "${profile.profileName}"?`, () => {
        setResumeData(profile);
        setShowProfileMenu(false);
        setToastMessage("Perfil carregado.");
        closeConfirm();
      }, 'info'
    );
  };

  const deleteProfile = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      requestConfirm("Excluir Perfil?", "Esta ação é permanente.", () => {
          const newProfiles = savedProfiles.filter(p => p.id !== id);
          setSavedProfiles(newProfiles);
          localStorage.setItem('trampolin_profiles', JSON.stringify(newProfiles));
          setToastMessage("Perfil excluído.");
          closeConfirm();
        }, 'danger'
      );
  };

  const handlePrint = () => {
      setShowPrintModal(false);
      setTimeout(() => {
          const oldTitle = document.title;
          const sanitizedName = resumeData.personalInfo.fullName.replace(/[^a-z0-9]/gi, '_');
          const sanitizedJob = resumeData.personalInfo.jobTitle.replace(/[^a-z0-9]/gi, '_');
          document.title = `Curriculo-${sanitizedName}-${sanitizedJob}`;
          window.print();
          document.title = oldTitle;
      }, 300);
  };

  const handleDocxExport = () => {
      const content = document.getElementById('resume-paper')?.innerHTML;
      if (!content) return;
      const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Resume</title><style>body{font-family: sans-serif;}</style></head><body>";
      const postHtml = "</body></html>";
      const html = preHtml + content + postHtml;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
      const downloadLink = document.createElement("a");
      document.body.appendChild(downloadLink);
      const nav = navigator as any;
      if(nav.msSaveOrOpenBlob){ nav.msSaveOrOpenBlob(blob, 'resume.doc'); } else { downloadLink.href = url; downloadLink.download = `curriculo-${resumeData.personalInfo.fullName}.doc`; downloadLink.click(); }
      document.body.removeChild(downloadLink);
      setToastMessage("Exportado para Word (.doc)");
  };

  const handleTxtExport = () => {
      let text = `Nome: ${resumeData.personalInfo.fullName}\nCargo: ${resumeData.personalInfo.jobTitle}\nEmail: ${resumeData.personalInfo.email}\nResumo: ${resumeData.personalInfo.summary}\n\nEXPERIÊNCIA\n`;
      resumeData.experience.forEach(exp => { text += `${exp.role} em ${exp.company} (${exp.startDate} - ${exp.endDate || 'Atual'})\n${exp.description}\n\n`; });
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

  const handleTestConnection = async () => {
      setIsTestingConnection(true);
      const success = await validateConnection(aiConfig);
      setIsTestingConnection(false);
      if (success) {
          setToastMessage("✅ Conexão bem-sucedida!");
      } else {
          setToastMessage("❌ Falha na conexão. Verifique sua chave.");
      }
  };

  const handleAutoFit = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.clientWidth - 48;
      const containerHeight = previewContainerRef.current.clientHeight - 48;
      const A4_WIDTH_PX = 794; 
      const A4_HEIGHT_PX = 1123;
      const scaleX = containerWidth / A4_WIDTH_PX;
      const scaleY = containerHeight / A4_HEIGHT_PX;
      const fitScale = Math.min(scaleX, scaleY, 1.2);
      setZoom(Math.max(fitScale * 0.95, 0.4));
      setToastMessage("Ajustado à tela");
  };

  const completeOnboarding = () => {
      setShowOnboarding(false);
      localStorage.setItem('trampolin_onboarding', 'true');
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-200 overflow-hidden selection:bg-trampo-500/30 selection:text-trampo-900">
      
      {/* Navbar with Glassmorphism */}
      {!focusMode && (
          <nav id="app-navbar" className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 shadow-sm z-50 flex-shrink-0 animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-trampo-500 to-trampo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-trampo-500/20 transform hover:rotate-3 transition-transform cursor-default select-none">T</div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white hidden md:inline select-none">Trampo-lin</span>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Mobile Preview Toggle (Hidden on Desktop) */}
              <button onClick={() => setShowMobilePreview(!showMobilePreview)} className="md:hidden p-2 rounded-lg bg-trampo-50 dark:bg-slate-800 text-trampo-600 dark:text-slate-300 font-bold text-xs active:scale-95 transition-transform">
                  {showMobilePreview ? <Edit2 size={18}/> : <Eye size={18}/>}
              </button>
              
              <button onClick={() => setShowJobTracker(true)} className="hidden sm:flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-sm font-medium" title="Gerenciar Vagas">
                  <Briefcase size={18}/> <span className="hidden lg:inline">Vagas</span>
              </button>

              <button onClick={() => setShowLinkedinGenerator(true)} className="hidden sm:flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95 border border-transparent hover:border-blue-100 dark:hover:border-blue-900 text-sm font-medium" title="Gerador de Perfil LinkedIn">
                  <Linkedin size={18}/> <span className="hidden lg:inline">LinkedIn</span>
              </button>

              <button onClick={() => setShowAISettings(true)} className={`p-2.5 rounded-xl transition-all active:scale-95 ${showAISettings ? 'bg-trampo-100 text-trampo-600 dark:bg-trampo-900/30 dark:text-trampo-400' : 'text-slate-500 hover:text-trampo-600 hover:bg-trampo-50 dark:hover:bg-trampo-900/10'}`} title="Configurar IA"><Bot size={20}/></button>
              
              <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 text-sm font-medium transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Gerenciar Perfis">
                  <UserPlus size={18} /> <span className="hidden lg:inline truncate max-w-[120px]">{resumeData.profileName || 'Meu Currículo'}</span>
                </button>
                {showProfileMenu && (
                  <div className="absolute top-14 right-0 w-64 bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl p-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        <button onClick={saveProfile} className="w-full text-left p-2.5 text-xs font-bold hover:bg-trampo-50 dark:hover:bg-trampo-900/20 rounded-lg flex gap-2 items-center text-trampo-600 dark:text-trampo-400 mb-2 border border-dashed border-trampo-200 dark:border-trampo-800 transition-colors"><Save size={14}/> SALVAR VERSÃO ATUAL</button>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-2">Salvos</div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                            {savedProfiles.map(p => (
                            <div key={p.id} className="flex group">
                                <button onClick={() => loadProfile(p)} className="flex-1 text-left p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-l-lg truncate text-slate-600 dark:text-slate-300 font-medium transition-colors">{p.profileName}</button>
                                <button onClick={(e) => deleteProfile(p.id!, e)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 hover:text-red-500 rounded-r-lg transition-colors"><RotateCcw size={12} className="rotate-45"/></button>
                            </div>
                            ))}
                            {savedProfiles.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Nenhum perfil salvo.</p>}
                        </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
              <button onClick={togglePrivacyMode} className={`p-2.5 rounded-xl transition-all active:scale-95 ${resumeData.settings.privacyMode ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Modo Privacidade (Blur)"><EyeOff size={18}/></button>
              <button onClick={toggleDarkMode} className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
              <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setPreviewMode('resume')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${previewMode === 'resume' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>CV</button>
                  <button onClick={() => setPreviewMode('cover')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${previewMode === 'cover' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>CARTA</button>
              </div>
              <button onClick={() => setShowThemeSelector(!showThemeSelector)} className={`p-2.5 rounded-xl transition-all active:scale-95 ${showThemeSelector ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'text-slate-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'}`} title="Temas"><Palette size={20}/></button>
              <button onClick={() => setShowPrintModal(true)} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/5 transition-all active:scale-95" title="Baixar PDF (Ctrl+P)"><Printer size={18}/> <span>Baixar</span></button>
            </div>
          </nav>
      )}

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        <div id="editor-sidebar" className={`${focusMode ? 'w-full max-w-3xl mx-auto border-x' : 'w-full md:w-[480px] lg:w-[520px]'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full overflow-hidden z-10 flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 absolute md:relative ${showMobilePreview && !focusMode ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
            <Editor 
              data={resumeData} 
              onChange={setResumeData} 
              onShowToast={setToastMessage} 
              onRequestConfirm={requestConfirm}
              focusMode={focusMode}
              setFocusMode={setFocusMode}
            />
        </div>

        {!focusMode && (
          <div id="preview-area" className={`flex-1 bg-slate-100/50 dark:bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center w-full absolute md:relative h-full transition-transform duration-300 ${showMobilePreview ? 'translate-x-0 z-20 bg-white' : 'translate-x-full md:translate-x-0'}`}>
            
            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none print:hidden" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div id="preview-scroll-container" ref={previewContainerRef} className="w-full h-full overflow-auto flex items-start justify-center p-4 md:p-12 custom-scrollbar relative z-10 pb-24">
                
                {/* AI Settings Modal */}
                {showAISettings && (
                   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 ai-settings-modal print:hidden" onClick={() => setShowAISettings(false)}>
                      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><Bot size={20}/> Configuração de IA</h3>
                            <button onClick={() => setShowAISettings(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={18}/></button>
                         </div>
                         <div className="space-y-4">
                            <div>
                               <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Provedor</label>
                               <div className="flex gap-2">
                                  <button onClick={() => setAiConfig({...aiConfig, provider: 'gemini'})} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95 ${aiConfig.provider === 'gemini' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>Google Gemini</button>
                                  <button onClick={() => setAiConfig({...aiConfig, provider: 'openrouter'})} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95 ${aiConfig.provider === 'openrouter' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>OpenRouter</button>
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs font-bold uppercase text-slate-500 mb-2">API Key {aiConfig.provider === 'gemini' ? '(Google AI Studio)' : '(OpenRouter)'}</label>
                               <div className="relative">
                                   <input type="password" value={aiConfig.apiKey} onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})} placeholder={hasEnvKey && aiConfig.provider === 'gemini' ? "Usando chave do sistema (opcional)" : "Cole sua chave aqui..."} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500 outline-none dark:text-white transition-all ring-offset-1 dark:ring-offset-slate-900" />
                                   <Key size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                               </div>
                               {hasEnvKey && aiConfig.provider === 'gemini' && !aiConfig.apiKey && <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"><Check size={10}/> Chave de ambiente detectada.</p>}
                            </div>
                            <div>
                               <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Modelo</label>
                               <input type="text" value={aiConfig.model} onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})} placeholder={aiConfig.provider === 'gemini' ? "gemini-3-flash-preview" : "google/gemini-2.0-flash-001"} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500 outline-none dark:text-white transition-all ring-offset-1 dark:ring-offset-slate-900" />
                            </div>
                         </div>
                         <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                            <button onClick={handleTestConnection} disabled={isTestingConnection} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold transition-all active:scale-95 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700">
                                {isTestingConnection ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Testar Conexão
                            </button>
                            <button onClick={handleSaveAIConfig} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"><Check size={16}/> Salvar</button>
                         </div>
                      </div>
                   </div>
                )}

                {showJobTracker && <JobTracker onClose={() => setShowJobTracker(false)} />}
                
                {showLinkedinGenerator && <LinkedinProfileGenerator data={resumeData} onUpdate={setResumeData} onClose={() => setShowLinkedinGenerator(false)} onShowToast={setToastMessage} />}
                
                {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

                <div 
                  id="resume-paper"
                  ref={printRef} 
                  data-size={resumeData.settings.paperSize}
                  className={`relative flex-shrink-0 bg-white shadow-2xl transition-transform duration-200 origin-top print:shadow-none print:m-0 print:absolute print:top-0 print:left-0 print:w-full print:z-50 print:transform-none`}
                  style={{ width: resumeData.settings.paperSize === 'letter' ? '215.9mm' : '210mm', minHeight: resumeData.settings.paperSize === 'letter' ? '279.4mm' : '297mm', transform: `scale(${zoom})` }}
                >
                  <Preview data={resumeData} theme={THEMES.find(t => t.id === activeThemeId) || THEMES[0]} mode={previewMode} />
                </div>
            </div>

            {/* Floating Controls (Glassmorphism + Tooltips) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 dark:border-slate-700/50 print:hidden z-40 preview-controls transition-all hover:scale-[1.02]">
               <button onClick={handleTxtExport} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Exportar TXT"><FileType size={18}/></button>
               <button onClick={handleDocxExport} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Exportar Word"><FileText size={18}/></button>
               <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
               <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Diminuir Zoom"><ZoomOut size={18}/></button>
               <span className="text-xs font-bold w-12 text-center tabular-nums text-slate-600 dark:text-slate-300 select-none">{Math.round(zoom * 100)}%</span>
               <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Aumentar Zoom"><ZoomIn size={18}/></button>
               <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
               <button onClick={handleAutoFit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Ajustar à Tela (Fit)"><Maximize size={16}/></button>
               <button onClick={() => setZoom(window.innerWidth < 768 ? 0.45 : 0.8)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Resetar"><RotateCcw size={16}/></button>
               <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 md:hidden"></div>
               <button onClick={() => setShowPrintModal(true)} className="md:hidden p-2 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95"><Printer size={18}/></button>
            </div>
          </div>
        )}
      </main>
      
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      <ConfirmDialog isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={() => { confirmConfig.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} type={confirmConfig.type} />
    </div>
  );
};

export default App;
