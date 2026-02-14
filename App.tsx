
import React, { useState, useRef, useEffect } from 'react';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ResumeData, ThemeId, AIConfig } from './types';
import { INITIAL_RESUME, THEMES } from './constants';
import { getAIConfig, saveAIConfig } from './services/geminiService';
import { Printer, Download, Upload, RotateCcw, Palette, Layout, Moon, Sun, Save, FileText, ZoomIn, ZoomOut, UserPlus, Menu, Eye, EyeOff, FileType, Bot, Settings2, Check, X, AlertCircle, Monitor, ChevronRight, Maximize, Briefcase } from 'lucide-react';
import { JobTracker } from './components/JobTracker/JobTracker';
import { Onboarding } from './components/Onboarding/Onboarding';

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium z-[110] animate-slide-in flex items-center gap-2 border border-slate-700">{message}</div>;
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
  const [showOnboarding, setShowOnboarding] = useState(false); // NEW
  
  // AI Settings State
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(getAIConfig());

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
    
    // Check onboarding
    const hasSeenOnboarding = localStorage.getItem('trampolin_onboarding');
    if (!hasSeenOnboarding) {
        setTimeout(() => setShowOnboarding(true), 1000);
    }
    
    // Fit to Screen initially
    handleAutoFit();
    
    // Load AI Config
    setAiConfig(getAIConfig());
  }, []);

  // Handle Window Resize for AutoFit
  useEffect(() => {
     const handleResize = () => {
         // Debounce slightly
         const t = setTimeout(() => {
             // Only auto-fit if user hasn't manually zoomed too far away from a reasonable fit? 
             // For now, let's keep it manual via button, but do it once on load.
         }, 100);
     };
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
    requestConfirm(
      "Carregar Perfil?",
      `Deseja carregar "${profile.profileName}"? Quaisquer alterações não salvas no perfil atual serão perdidas.`,
      () => {
        setResumeData(profile);
        setShowProfileMenu(false);
        setToastMessage("Perfil carregado.");
        closeConfirm();
      },
      'info'
    );
  };

  const deleteProfile = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      requestConfirm(
        "Excluir Perfil?",
        "Esta ação é permanente e não pode ser desfeita. Tem certeza que deseja excluir este perfil salvo?",
        () => {
          const newProfiles = savedProfiles.filter(p => p.id !== id);
          setSavedProfiles(newProfiles);
          localStorage.setItem('trampolin_profiles', JSON.stringify(newProfiles));
          setToastMessage("Perfil excluído.");
          closeConfirm();
        },
        'danger'
      );
  };

  const handlePrint = () => {
      setShowPrintModal(false);
      // Pequeno delay para garantir que o modal feche antes do browser abrir a janela
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
      // Create a basic HTML structure that Word interprets correctly
      // This is a client-side hack that works surprisingly well for simple documents
      const content = document.getElementById('resume-paper')?.innerHTML;
      if (!content) return;

      const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Resume</title><style>body{font-family: sans-serif;}</style></head><body>";
      const postHtml = "</body></html>";
      const html = preHtml + content + postHtml;

      const blob = new Blob(['\ufeff', html], {
          type: 'application/msword'
      });
      
      const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
      const downloadLink = document.createElement("a");
      document.body.appendChild(downloadLink);
      
      const nav = navigator as any;
      if(nav.msSaveOrOpenBlob){
          nav.msSaveOrOpenBlob(blob, 'resume.doc');
      } else {
          downloadLink.href = url;
          downloadLink.download = `curriculo-${resumeData.personalInfo.fullName}.doc`;
          downloadLink.click();
      }
      
      document.body.removeChild(downloadLink);
      setToastMessage("Exportado para Word (.doc)");
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

  const updateSetting = (key: any, value: any) => {
      setResumeData(prev => ({
          ...prev,
          settings: { ...prev.settings, [key]: value }
      }));
  };

  const handleAutoFit = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.clientWidth - 48; // padding
      const containerHeight = previewContainerRef.current.clientHeight - 48;
      
      const A4_WIDTH_PX = 794; // approx at 96dpi
      const A4_HEIGHT_PX = 1123;
      
      const scaleX = containerWidth / A4_WIDTH_PX;
      const scaleY = containerHeight / A4_HEIGHT_PX;
      
      // Use the smaller scale to fit entirely, but cap it at 1.0 or slightly higher
      const fitScale = Math.min(scaleX, scaleY, 1.2);
      
      // Ensure it's not too small on mobile
      setZoom(Math.max(fitScale * 0.95, 0.4));
      setToastMessage("Ajustado à tela");
  };

  const completeOnboarding = () => {
      setShowOnboarding(false);
      localStorage.setItem('trampolin_onboarding', 'true');
  };

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-200 overflow-hidden selection:bg-trampo-500/30">
      
      {/* Navbar */}
      {!focusMode && (
          <nav id="app-navbar" className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 shadow-sm z-50 flex-shrink-0 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-trampo-500 to-trampo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-trampo-500/20 transform hover:rotate-3 transition-transform">T</div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white hidden md:inline">Trampo-lin</span>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              <button onClick={() => setShowMobilePreview(!showMobilePreview)} className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs">
                  {showMobilePreview ? 'Editar' : 'Ver PDF'}
              </button>
              <button onClick={() => setShowJobTracker(true)} className="hidden sm:flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-sm font-medium" title="Gerenciar Vagas">
                  <Briefcase size={18}/> <span className="hidden lg:inline">Vagas</span>
              </button>
              <button onClick={() => setShowAISettings(true)} className={`p-2.5 rounded-xl transition-colors ${showAISettings ? 'bg-trampo-100 text-trampo-600 dark:bg-trampo-900/30 dark:text-trampo-400' : 'text-slate-500 hover:text-trampo-600 hover:bg-trampo-50 dark:hover:bg-trampo-900/10'}`} title="Configurar IA"><Bot size={20}/></button>
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
              <button onClick={() => setShowPrintModal(true)} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/5 transition-all active:scale-95"><Printer size={18}/> <span>Baixar PDF</span></button>
            </div>
          </nav>
      )}

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Editor Sidebar - Dynamic width based on focusMode */}
        <div id="editor-sidebar" className={`${focusMode ? 'w-full max-w-3xl mx-auto border-x' : 'w-full md:w-[480px] lg:w-[520px]'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full overflow-hidden z-10 flex-shrink-0 shadow-xl transition-all duration-300 absolute md:relative ${showMobilePreview && !focusMode ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
            <Editor 
              data={resumeData} 
              onChange={setResumeData} 
              onShowToast={setToastMessage} 
              onRequestConfirm={requestConfirm}
              focusMode={focusMode}
              setFocusMode={setFocusMode}
            />
        </div>

        {/* Preview Area - Hidden in Focus Mode */}
        {!focusMode && (
          <div id="preview-area" className={`flex-1 bg-slate-100/50 dark:bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center w-full absolute md:relative h-full transition-transform duration-300 ${showMobilePreview ? 'translate-x-0 z-20 bg-white' : 'translate-x-full md:translate-x-0'}`}>
            
            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none print:hidden" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div id="preview-scroll-container" ref={previewContainerRef} className="w-full h-full overflow-auto flex items-start justify-center p-4 md:p-12 custom-scrollbar relative z-10 pb-24">
                {/* Theme Selector Modal (Existing) */}
                {showThemeSelector && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-50 animate-in slide-in-from-top-4 duration-300 w-[95%] max-w-4xl theme-selector-modal">
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

                {/* Print Settings Modal (NEW) */}
                {showPrintModal && (
                   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 print:hidden">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                         <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                               <h3 className="font-bold text-xl dark:text-white flex items-center gap-2"><Printer size={22} className="text-trampo-600"/> Ajustes Finais</h3>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Prepare seu documento para exportação.</p>
                            </div>
                            <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={20}/></button>
                         </div>
                         
                         <div className="p-6 space-y-6">
                            {/* Alert Box */}
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex gap-3 items-start">
                               <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"/>
                               <div>
                                  <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300 mb-1">Dica Importante</h4>
                                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                     Na janela de impressão do navegador, certifique-se de marcar a opção <strong className="font-bold">"Gráficos de plano de fundo"</strong> e definir as Margens como <strong className="font-bold">"Nenhuma"</strong> para evitar bordas brancas indesejadas.
                                  </p>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tamanho do Papel</label>
                                  <div className="flex gap-2">
                                     <button 
                                       onClick={() => updateSetting('paperSize', 'a4')} 
                                       className={`flex-1 py-3 px-2 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${resumeData.settings.paperSize === 'a4' ? 'bg-trampo-50 border-trampo-500 text-trampo-700 dark:bg-trampo-900/20 dark:border-trampo-500 dark:text-trampo-300 ring-1 ring-trampo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-trampo-300'}`}
                                     >
                                        <FileText size={18}/> A4
                                     </button>
                                     <button 
                                       onClick={() => updateSetting('paperSize', 'letter')} 
                                       className={`flex-1 py-3 px-2 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${resumeData.settings.paperSize === 'letter' ? 'bg-trampo-50 border-trampo-500 text-trampo-700 dark:bg-trampo-900/20 dark:border-trampo-500 dark:text-trampo-300 ring-1 ring-trampo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-trampo-300'}`}
                                     >
                                        <FileText size={18}/> Carta
                                     </button>
                                  </div>
                               </div>
                               <div>
                                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Modo de Cor</label>
                                  <div className="flex gap-2">
                                     <button 
                                       onClick={() => updateSetting('grayscale', false)} 
                                       className={`flex-1 py-3 px-2 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${!resumeData.settings.grayscale ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-500 dark:text-purple-300 ring-1 ring-purple-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300'}`}
                                     >
                                        <Palette size={18}/> Colorido
                                     </button>
                                     <button 
                                       onClick={() => updateSetting('grayscale', true)} 
                                       className={`flex-1 py-3 px-2 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${resumeData.settings.grayscale ? 'bg-slate-100 border-slate-500 text-slate-800 dark:bg-slate-700 dark:border-slate-500 dark:text-white ring-1 ring-slate-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'}`}
                                     >
                                        <Monitor size={18}/> P&B
                                     </button>
                                  </div>
                               </div>
                            </div>
                            
                            <div>
                               <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ajuste de Margem (Escala)</label>
                               <input 
                                 type="range" 
                                 min="0.5" 
                                 max="1.5" 
                                 step="0.1" 
                                 value={resumeData.settings.marginScale} 
                                 onChange={(e) => updateSetting('marginScale', parseFloat(e.target.value))}
                                 className="w-full accent-trampo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                               />
                               <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                                  <span>Compacto</span>
                                  <span>Padrão</span>
                                  <span>Espaçoso</span>
                               </div>
                            </div>
                         </div>

                         <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button onClick={() => setShowPrintModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all text-sm">Cancelar</button>
                            <button onClick={handleDocxExport} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all text-sm flex items-center gap-2">
                                <FileText size={16}/> Word (.doc)
                            </button>
                            <button onClick={handlePrint} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 text-sm">
                               Imprimir PDF <ChevronRight size={16}/>
                            </button>
                         </div>
                      </div>
                   </div>
                )}

                {/* AI Settings Modal (New) */}
                {showAISettings && (
                   <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 ai-settings-modal print:hidden">
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

                {/* Job Tracker Modal */}
                {showJobTracker && <JobTracker onClose={() => setShowJobTracker(false)} />}
                
                {/* Onboarding Tour */}
                {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

                {/* Resume Paper Container */}
                <div 
                  id="resume-paper"
                  ref={printRef} 
                  data-size={resumeData.settings.paperSize}
                  className={`relative flex-shrink-0 bg-white shadow-2xl transition-transform duration-200 origin-top print:shadow-none print:m-0 print:absolute print:top-0 print:left-0 print:w-full print:z-50 print:transform-none`}
                  style={{
                      width: resumeData.settings.paperSize === 'letter' ? '215.9mm' : '210mm',
                      minHeight: resumeData.settings.paperSize === 'letter' ? '279.4mm' : '297mm',
                      transform: `scale(${zoom})`,
                  }}
                >
                  <Preview data={resumeData} theme={THEMES.find(t => t.id === activeThemeId) || THEMES[0]} mode={previewMode} />
                </div>
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 print:hidden z-40 preview-controls">
               <button onClick={handleTxtExport} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Exportar TXT"><FileType size={18}/></button>
               <button onClick={handleDocxExport} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Exportar Word"><FileText size={18}/></button>
               <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
               <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Diminuir Zoom"><ZoomOut size={18}/></button>
               <span className="text-xs font-bold w-12 text-center tabular-nums text-slate-600 dark:text-slate-300">{Math.round(zoom * 100)}%</span>
               <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Aumentar Zoom"><ZoomIn size={18}/></button>
               <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
               <button onClick={handleAutoFit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Ajustar à Tela (Fit)"><Maximize size={16}/></button>
               <button onClick={() => setZoom(window.innerWidth < 768 ? 0.45 : 0.8)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" title="Resetar"><RotateCcw size={16}/></button>
               <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 md:hidden"></div>
               <button onClick={() => setShowPrintModal(true)} className="md:hidden p-2 bg-slate-900 text-white rounded-xl shadow-lg"><Printer size={18}/></button>
            </div>

          </div>
        )}
      </main>
      
      {/* Toast */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      {/* Global Confirm Dialog */}
      <ConfirmDialog 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => { confirmConfig.onConfirm(); closeConfirm(); }}
        onCancel={closeConfirm}
        type={confirmConfig.type}
      />
    </div>
  );
};

export default App;
