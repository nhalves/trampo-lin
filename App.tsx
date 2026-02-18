
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Navbar } from './components/Layout/Navbar';
import { Toast } from './components/ui/Toast';
import { FloatingControls } from './components/Preview/FloatingControls';
import { ResumeData, ThemeId, AIConfig } from './types';
import { INITIAL_RESUME, THEMES, CURRENT_DATA_VERSION } from './constants';
import { getAIConfig, saveAIConfig, validateConnection } from './services/geminiService';
import { checkStorageQuota, sanitizeHtml } from './utils/resumeUtils';
import { Bot, Check, X, Key, RefreshCw, Loader2, EyeOff } from 'lucide-react';
import { JobTracker } from './components/JobTracker/JobTracker';
import { LinkedinProfileGenerator } from './components/Linkedin/LinkedinProfileGenerator';
import { Onboarding } from './components/Onboarding/Onboarding';

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
  const [focusMode, setFocusMode] = useState(false);
  const [showJobTracker, setShowJobTracker] = useState(false);
  const [showLinkedinGenerator, setShowLinkedinGenerator] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Save Profile Modal State
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // Printing State
  const [isPrinting, setIsPrinting] = useState(false);
  
  // AI Settings State
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(getAIConfig());
  const [originalAiConfig, setOriginalAiConfig] = useState<AIConfig>(getAIConfig());
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

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Load Logic
  useEffect(() => {
    const saved = localStorage.getItem('trampolin_data');
    if (saved) {
        try { 
            const parsed = JSON.parse(saved);
            if (parsed.version !== undefined && parsed.data) {
                setResumeData(parsed.data);
            } else {
                setResumeData(parsed);
            }
        } catch(e) { console.error("Error loading saved data", e); }
    }
    const profiles = localStorage.getItem('trampolin_profiles');
    if (profiles) {
        try { setSavedProfiles(JSON.parse(profiles)); } catch(e) {}
    }
    const dark = localStorage.getItem('trampolin_dark');
    if (dark === 'true') { setDarkMode(true); document.documentElement.classList.add('dark'); }
    
    const savedFocus = localStorage.getItem('trampolin_focus');
    if (savedFocus === 'true') setFocusMode(true);

    const hasSeenOnboarding = localStorage.getItem('trampolin_onboarding');
    if (!hasSeenOnboarding) { setTimeout(() => setShowOnboarding(true), 1000); }
    
    handleAutoFit();
    setAiConfig(getAIConfig());
    setOriginalAiConfig(getAIConfig());
  }, []);

  useEffect(() => {
     localStorage.setItem('trampolin_focus', focusMode.toString());
  }, [focusMode]);

  useEffect(() => {
     const handleResize = () => { handleAutoFit(); };
     window.addEventListener('resize', handleResize);
     return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const payload = { version: CURRENT_DATA_VERSION, data: resumeData };
    if (!checkStorageQuota('trampolin_data', payload)) {
        setToastMessage("⚠️ Limite de armazenamento quase cheio. Remova fotos antigas.");
    }
    localStorage.setItem('trampolin_data', JSON.stringify(payload));
    document.title = resumeData.personalInfo.fullName ? `Editando: ${resumeData.personalInfo.fullName}` : 'Trampo-lin | Editor';
  }, [resumeData]);

  useEffect(() => {
      if (isPrinting) {
          const timer = setTimeout(() => {
            const oldTitle = document.title;
            const sanitizedName = resumeData.personalInfo.fullName.replace(/[^a-z0-9]/gi, '_');
            const sanitizedJob = resumeData.personalInfo.jobTitle.replace(/[^a-z0-9]/gi, '_');
            document.title = `Curriculo-${sanitizedName}-${sanitizedJob}`;
            window.print();
            document.title = oldTitle;
            setIsPrinting(false);
          }, 200);
          return () => clearTimeout(timer);
      }
  }, [isPrinting, resumeData]);

  useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
              e.preventDefault();
              setIsPrinting(true);
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
      const next = !resumeData.settings.privacyMode;
      setResumeData(prev => ({ ...prev, settings: { ...prev.settings, privacyMode: next } }));
      setToastMessage(next ? "Modo Privacidade Ativado" : "Modo Privacidade Desativado");
  };

  const handleOpenSaveProfile = () => {
      setNewProfileName(resumeData.profileName || '');
      setShowSaveProfileModal(true);
  };

  const confirmSaveProfile = () => {
    if (!newProfileName.trim()) { setToastMessage("Digite um nome válido."); return; }
    const newProfile = { ...resumeData, id: Date.now().toString(), profileName: newProfileName };
    const newProfiles = [...savedProfiles, newProfile];
    
    if (!checkStorageQuota('trampolin_profiles', newProfiles)) {
        setToastMessage("❌ Armazenamento cheio! Exclua perfis antigos.");
        return;
    }

    setSavedProfiles(newProfiles);
    localStorage.setItem('trampolin_profiles', JSON.stringify(newProfiles));
    setResumeData(newProfile);
    setToastMessage(`Perfil "${newProfileName}" salvo!`);
    setShowSaveProfileModal(false);
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

  const handleDocxExport = () => {
      const contentElement = document.getElementById('resume-paper');
      if (!contentElement) return;
      const content = sanitizeHtml(contentElement.innerHTML);
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
      let text = `Nome: ${resumeData.personalInfo.fullName}\nCargo: ${resumeData.personalInfo.jobTitle}\nEmail: ${resumeData.personalInfo.email}\nResumo: ${resumeData.personalInfo.summary}\n\n`;
      if(resumeData.experience.length > 0) {
          text += "--- EXPERIÊNCIA ---\n";
          resumeData.experience.forEach(exp => { text += `${exp.role} em ${exp.company} (${exp.startDate} - ${exp.endDate || 'Atual'})\n${exp.description}\n\n`; });
      }
      if(resumeData.education.length > 0) {
          text += "--- EDUCAÇÃO ---\n";
          resumeData.education.forEach(edu => { text += `${edu.school} - ${edu.degree} (${edu.startDate} - ${edu.endDate})\n\n`; });
      }
      if(resumeData.skills.length > 0) {
          text += "--- HABILIDADES ---\n";
          text += resumeData.skills.map(s => s.name).join(', ') + "\n\n";
      }
      if(resumeData.languages.length > 0) {
          text += "--- IDIOMAS ---\n";
          text += resumeData.languages.join(', ') + "\n\n";
      }
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculo-texto.txt`;
      a.click();
  };
  
  const handleSaveAIConfig = () => {
      saveAIConfig(aiConfig);
      setOriginalAiConfig(aiConfig);
      setShowAISettings(false);
      setToastMessage("Configurações de IA salvas!");
  };

  const handleCloseAISettings = () => {
      if (JSON.stringify(aiConfig) !== JSON.stringify(originalAiConfig)) {
          requestConfirm("Alterações não salvas", "Deseja descartar as alterações nas configurações?", () => {
              setAiConfig(originalAiConfig);
              setShowAISettings(false);
              closeConfirm();
          }, 'info');
      } else {
          setShowAISettings(false);
      }
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
      
      {resumeData.settings.privacyMode && (
          <div className="fixed top-0 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg z-[60] shadow-md flex items-center gap-1">
              <EyeOff size={10}/> MODO PRIVACIDADE ATIVO
          </div>
      )}

      <Navbar 
        resumeData={resumeData}
        focusMode={focusMode}
        showMobilePreview={showMobilePreview}
        setShowMobilePreview={setShowMobilePreview}
        setShowJobTracker={setShowJobTracker}
        setShowLinkedinGenerator={setShowLinkedinGenerator}
        setShowAISettings={setShowAISettings}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        handleOpenSaveProfile={handleOpenSaveProfile}
        savedProfiles={savedProfiles}
        loadProfile={loadProfile}
        deleteProfile={deleteProfile}
        togglePrivacyMode={togglePrivacyMode}
        toggleDarkMode={toggleDarkMode}
        darkMode={darkMode}
        setShowOnboarding={setShowOnboarding}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        showThemeSelector={showThemeSelector}
        setShowThemeSelector={setShowThemeSelector}
        setIsPrinting={setIsPrinting}
      />

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
                
                {showAISettings && (
                   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 ai-settings-modal print:hidden" onClick={handleCloseAISettings}>
                      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><Bot size={20}/> Configuração de IA</h3>
                            <button onClick={handleCloseAISettings} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={18}/></button>
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

                {showSaveProfileModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowSaveProfileModal(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg dark:text-white mb-2">Salvar Perfil</h3>
                            <p className="text-sm text-slate-500 mb-4">Dê um nome para identificar esta versão do seu currículo.</p>
                            <input 
                                type="text" 
                                autoFocus
                                value={newProfileName} 
                                onChange={(e) => setNewProfileName(e.target.value)} 
                                placeholder="Ex: Versão Fullstack 2024"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500 outline-none dark:text-white mb-4"
                                onKeyDown={(e) => e.key === 'Enter' && confirmSaveProfile()}
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowSaveProfileModal(false)} className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                                <button onClick={confirmSaveProfile} className="bg-trampo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-trampo-700 transition-all">Salvar</button>
                            </div>
                        </div>
                    </div>
                )}

                <div 
                  id="resume-paper"
                  data-size={resumeData.settings.paperSize}
                  className={`relative flex-shrink-0 bg-white shadow-2xl transition-transform duration-200 origin-top`}
                  style={{ width: resumeData.settings.paperSize === 'letter' ? '215.9mm' : '210mm', minHeight: resumeData.settings.paperSize === 'letter' ? '279.4mm' : '297mm', transform: `scale(${zoom})` }}
                >
                  <Preview data={resumeData} theme={THEMES.find(t => t.id === activeThemeId) || THEMES[0]} mode={previewMode} />
                </div>
            </div>

            <FloatingControls 
                onTxtExport={handleTxtExport}
                onDocxExport={handleDocxExport}
                zoom={zoom}
                setZoom={setZoom}
                onAutoFit={handleAutoFit}
                onPrint={() => setIsPrinting(true)}
            />
          </div>
        )}
      </main>
      
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      <ConfirmDialog isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} onConfirm={() => { confirmConfig.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} type={confirmConfig.type} />

      {isPrinting && document.getElementById('print-mount') && createPortal(
          <div className="bg-white">
              <div 
                 style={{ 
                     width: resumeData.settings.paperSize === 'letter' ? '215.9mm' : '210mm', 
                     minHeight: resumeData.settings.paperSize === 'letter' ? '279.4mm' : '297mm',
                     margin: '0 auto',
                     overflow: 'hidden'
                 }}
              >
                  <Preview 
                    data={resumeData} 
                    theme={THEMES.find(t => t.id === activeThemeId) || THEMES[0]} 
                    mode={previewMode} 
                  />
              </div>
          </div>,
          document.getElementById('print-mount')!
      )}
    </div>
  );
};

export default App;
