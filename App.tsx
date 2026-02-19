
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Navbar } from './components/Layout/Navbar';
import { ResumeData, ThemeId, AIConfig } from './types';
import { INITIAL_RESUME, THEMES, CURRENT_DATA_VERSION } from './constants';
import { getAIConfig, saveAIConfig, validateConnection } from './services/geminiService';
import { Printer, Download, Upload, RotateCcw, Palette, Layout, Moon, Sun, Save, FileText, ZoomIn, ZoomOut, UserPlus, Menu, Eye, EyeOff, FileType, Bot, Settings2, Check, X, AlertCircle, Monitor, ChevronRight, Maximize, Briefcase, Key, Linkedin, Minimize2, Edit2, Loader2, RefreshCw, ShieldOff } from 'lucide-react';
import { JobTracker } from './components/JobTracker/JobTracker';
import { LinkedinProfileGenerator } from './components/Linkedin/LinkedinProfileGenerator';
import { Onboarding } from './components/Onboarding/Onboarding';

// #12 — Toast duration é estável, sem recriação do timer por onClose instavel
const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-sm font-medium z-[150] animate-slide-in flex items-center gap-2 border border-slate-700/50 transform transition-all hover:scale-105 cursor-default">{message}</div>;
};

// Helper: Floating control button
const FCtrlBtn: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 rounded-xl text-slate-600 dark:text-slate-300
               hover:bg-slate-100/80 dark:hover:bg-slate-700/80
               transition-all active:scale-90"
  >
    {children}
  </button>
);

// localStorage versioning — bump this when ResumeData schema changes
const RESUME_DATA_VERSION = 2;

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

  // #10 — Ref para fechar o menu de perfis ao clicar fora
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Printing State - The "Absolute Zero" Redo
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
    onConfirm: () => { },
  });

  const previewContainerRef = useRef<HTMLDivElement>(null);
  // AI Settings dirty-check: track if user changed config without saving
  const aiConfigDirtyRef = useRef(false);

  // Load Logic
  useEffect(() => {
    const saved = localStorage.getItem('trampolin_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Support versioned format { version, data } and legacy flat format
        if (parsed?.version && parsed?.data) {
          if (parsed.version === RESUME_DATA_VERSION) {
            setResumeData(parsed.data);
          } else {
            // Migrate: merge old data into current schema
            const migrated = { ...INITIAL_RESUME, ...parsed.data, settings: { ...INITIAL_RESUME.settings, ...(parsed.data.settings || {}) } };
            setResumeData(migrated);
            console.info(`Migrated localStorage from v${parsed.version} to v${RESUME_DATA_VERSION}`);
          }
        } else {
          // Legacy flat format — merge with INITIAL_RESUME for safety
          const migrated = { ...INITIAL_RESUME, ...parsed, settings: { ...INITIAL_RESUME.settings, ...(parsed.settings || {}) } };
          setResumeData(migrated);
        }
      } catch (e) { console.error("Error loading saved data", e); }
    }
    const profiles = localStorage.getItem('trampolin_profiles');
    if (profiles) {
      try { setSavedProfiles(JSON.parse(profiles)); } catch (e) { }
    }
    const dark = localStorage.getItem('trampolin_dark');
    if (dark === 'true') { setDarkMode(true); document.documentElement.classList.add('dark'); }

    // Persist Focus Mode
    const savedFocus = localStorage.getItem('trampolin_focus');
    if (savedFocus === 'true') setFocusMode(true);

    const hasSeenOnboarding = localStorage.getItem('trampolin_onboarding');
    if (!hasSeenOnboarding) { setTimeout(() => setShowOnboarding(true), 1000); }

    // #15 — Persiste zoom entre sessões
    const savedZoom = localStorage.getItem('trampolin_zoom');
    if (savedZoom) setZoom(parseFloat(savedZoom));

    handleAutoFit();
    setAiConfig(getAIConfig());
    setOriginalAiConfig(getAIConfig());
  }, []);

  useEffect(() => {
    localStorage.setItem('trampolin_focus', focusMode.toString());
  }, [focusMode]);

  // #15 — Persiste zoom no localStorage
  useEffect(() => {
    localStorage.setItem('trampolin_zoom', zoom.toString());
  }, [zoom]);

  // Handle Window Resize for AutoFit (no-op handler removed)
  // useEffect(() => { ... }, []);

  useEffect(() => {
    localStorage.setItem('trampolin_data', JSON.stringify({ version: RESUME_DATA_VERSION, data: resumeData }));
    document.title = resumeData.personalInfo.fullName ? `Editando: ${resumeData.personalInfo.fullName}` : 'Trampo-lin | Editor';
  }, [resumeData]);

  useEffect(() => {
    if (isPrinting) {
      // Pequeno delay para garantir que o Portal foi renderizado no DOM
      const timer = setTimeout(() => {
        const oldTitle = document.title;
        const sanitizedName = resumeData.personalInfo.fullName.replace(/[^a-z0-9]/gi, '_');
        const sanitizedJob = resumeData.personalInfo.jobTitle.replace(/[^a-z0-9]/gi, '_');
        document.title = `Curriculo-${sanitizedName}-${sanitizedJob}`;

        window.print();

        // Restaura estado após impressão (ou cancelamento)
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
    // #4 — resumeData removido das deps: o handler não usa estado do currículo no closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setToastMessage(next ? "🔒 Modo Privacidade Ativado" : "Modo Privacidade Desativado");
  };

  const saveProfile = () => {
    const name = prompt("Nome para este perfil (ex: Versão Backend):", resumeData.profileName);
    if (!name) return;
    // #3 — UUID para evitar colisão de IDs em cliques rápidos
    const newProfile = { ...resumeData, id: crypto.randomUUID(), profileName: name, createdAt: new Date().toISOString() };
    const newProfiles = [...savedProfiles, newProfile];
    try {
      setSavedProfiles(newProfiles);
      localStorage.setItem('trampolin_profiles', JSON.stringify(newProfiles));
      setResumeData(newProfile);
      setToastMessage(`Perfil "${name}" salvo!`);
    } catch (e) {
      setToastMessage("❌ Armazenamento cheio! Exclua perfis antigos.");
    }
  };

  // Alias para compatibilidade com Navbar que usa handleOpenSaveProfile
  const handleOpenSaveProfile = saveProfile;

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
    const rawContent = document.getElementById('resume-paper')?.innerHTML;
    if (!rawContent) return;
    // Sanitize: remove script tags and event handlers to avoid XSS in exported file
    const sanitized = rawContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s+on\w+="[^"]*"/gi, '');
    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Resume</title><style>body{font-family: sans-serif;}</style></head><body>";
    const postHtml = "</body></html>";
    const html = preHtml + sanitized + postHtml;
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = `curriculo-${resumeData.personalInfo.fullName}.doc`;
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setToastMessage("Exportado como HTML para Word (.doc)");
  };

  const handleTxtExport = () => {
    const d = resumeData;
    let text = `${d.personalInfo.fullName}\n${d.personalInfo.jobTitle}\n`;
    text += `Email: ${d.personalInfo.email} | Tel: ${d.personalInfo.phone} | ${d.personalInfo.address}\n`;
    if (d.personalInfo.linkedin) text += `LinkedIn: ${d.personalInfo.linkedin}\n`;
    if (d.personalInfo.website) text += `Site: ${d.personalInfo.website}\n`;
    text += `\nRESUMO\n${d.personalInfo.summary}\n`;
    if (d.experience.length) {
      text += `\nEXPERIÊNCIA\n`;
      d.experience.forEach(e => { text += `${e.role} — ${e.company} (${e.startDate} - ${e.current ? 'Atual' : e.endDate})\n${e.description}\n\n`; });
    }
    if (d.education.length) {
      text += `\nEDUCAÇÃO\n`;
      d.education.forEach(e => { text += `${e.degree} — ${e.school} (${e.startDate} - ${e.endDate})\n`; });
    }
    if (d.skills.length) {
      text += `\nHABILIDADES\n${d.skills.map(s => s.name).join(', ')}\n`;
    }
    if (d.languages.length) {
      text += `\nIDIOMAS\n${d.languages.join(', ')}\n`;
    }
    if (d.projects.length) {
      text += `\nPROJETOS\n`;
      d.projects.forEach(p => { text += `${p.name}: ${p.description}${p.url ? ` (${p.url})` : ''}\n`; });
    }
    if (d.certifications.length) {
      text += `\nCERTIFICAÇÕES\n`;
      d.certifications.forEach(c => { text += `${c.name} — ${c.issuer} (${c.date})\n`; });
    }
    // #7 — Exportar volunteer, awards e publications que faltavam
    if (d.volunteer?.length) {
      text += `\nTRABALHO VOLUNTÁRIO\n`;
      d.volunteer.forEach(v => { text += `${v.role} — ${v.organization} (${v.startDate} - ${v.current ? 'Atual' : v.endDate})\n${v.description}\n\n`; });
    }
    if (d.awards?.length) {
      text += `\nPRÊMIOS E RECONHECIMENTOS\n`;
      d.awards.forEach(a => { text += `${a.title} — ${a.issuer} (${a.date})\n`; });
    }
    if (d.publications?.length) {
      text += `\nPUBLICAÇÕES\n`;
      d.publications.forEach(p => { text += `${p.title} — ${p.publisher} (${p.date})${p.url ? ` — ${p.url}` : ''}\n`; });
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `curriculo-${d.personalInfo.fullName.replace(/\s+/g, '-').toLowerCase()}.txt`; a.click();
    URL.revokeObjectURL(url);
    setToastMessage("Exportado como TXT!");
  };

  const handleSaveAIConfig = () => {
    saveAIConfig(aiConfig);
    aiConfigDirtyRef.current = false;
    setShowAISettings(false);
    setToastMessage("Configurações de IA salvas!");
  };

  const handleCloseAISettings = () => {
    if (aiConfigDirtyRef.current) {
      // #5 — Usa ConfirmDialog do projeto em vez de window.confirm (compatível com iframes)
      requestConfirm(
        'Alterações não salvas',
        'Você editou as configurações de IA sem salvar. Deseja descartar as alterações?',
        () => {
          aiConfigDirtyRef.current = false;
          setAiConfig(getAIConfig()); // reverte para o que estava salvo
          setShowAISettings(false);
          closeConfirm();
        },
        'info'
      );
      return;
    }
    aiConfigDirtyRef.current = false;
    setShowAISettings(false);
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

  const reopenOnboarding = () => {
    setShowOnboarding(true);
  };

  // #12 — onClose estável com useCallback para evitar recriação de timer no Toast
  const handleToastClose = useCallback(() => setToastMessage(null), []);

  // #10 — Fecha o menu de perfis ao clicar fora do container
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showProfileMenu]);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-200 overflow-hidden selection:bg-trampo-500/30 selection:text-trampo-900">


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

      {/* ── Theme Selector Panel ──────────────────────────────────── */}
      {showThemeSelector && (
        <div
          className="fixed inset-0 z-[80] print:hidden"
          onClick={() => setShowThemeSelector(false)}
        >
          <div
            className="absolute top-[68px] right-4 w-[320px] animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700
                            shadow-[0_16px_48px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.08)]
                            dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-trampo-500 flex items-center justify-center">
                    <Palette size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Tema do Currículo</span>
                </div>
                <button
                  onClick={() => setShowThemeSelector(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Theme grid */}
              <div className="p-3 grid grid-cols-1 gap-1.5 max-h-[420px] overflow-y-auto custom-scrollbar">
                {THEMES.map(theme => {
                  const isActive = activeThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setActiveThemeId(theme.id as ThemeId);
                        setToastMessage(`✨ Tema "${theme.name}" aplicado!`);
                        setShowThemeSelector(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all active:scale-[0.98]
                        ${isActive
                          ? 'bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-300 dark:ring-violet-700'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      {/* Color swatches */}
                      <div className="flex-shrink-0 flex gap-0.5">
                        {[theme.colors.primary, theme.colors.accent, theme.colors.bg === '#ffffff' ? '#f1f5f9' : theme.colors.bg].map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-9 rounded-md border border-black/[0.06]"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-white">{theme.name}</span>
                          {isActive && (
                            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded-full">Ativo</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">{theme.description}</p>
                      </div>

                      {/* Check */}
                      {isActive && (
                        <Check size={14} className="flex-shrink-0 text-violet-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400">{THEMES.length} temas disponíveis</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <div id="preview-area" className={`flex-1 preview-bg-pattern overflow-hidden relative flex flex-col items-center justify-center w-full absolute md:relative h-full transition-transform duration-300 print:hidden ${showMobilePreview ? 'translate-x-0 z-20' : 'translate-x-full md:translate-x-0'}`}>

            <div id="preview-scroll-container" ref={previewContainerRef} className="w-full h-full overflow-auto flex items-start justify-center p-4 md:p-12 custom-scrollbar relative z-10 pb-24">

              {/* AI Settings Modal */}
              {showAISettings && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in ai-settings-modal print:hidden" onClick={handleCloseAISettings}>
                  <div
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.3)] w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Accent bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-trampo-500" />

                    {/* Header */}
                    <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-trampo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/30">
                        <Bot size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">Configuração de IA</h3>
                        <p className="text-[11px] text-slate-400">Conecte seu provedor de IA preferido</p>
                      </div>
                      <button onClick={handleCloseAISettings} className="ml-auto p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* Provider */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">Provedor</label>
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                          <button
                            onClick={() => setAiConfig({ ...aiConfig, provider: 'gemini' })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${aiConfig.provider === 'gemini'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                          >
                            ✦ Google Gemini
                          </button>
                          <button
                            onClick={() => setAiConfig({ ...aiConfig, provider: 'openrouter' })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${aiConfig.provider === 'openrouter'
                              ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                          >
                            ⟡ OpenRouter
                          </button>
                        </div>
                      </div>

                      {/* API Key */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                          API Key {aiConfig.provider === 'gemini' ? '· Google AI Studio' : '· OpenRouter'}
                        </label>
                        <div className="relative">
                          <Key size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            type="password"
                            value={aiConfig.apiKey}
                            onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                            placeholder={hasEnvKey && aiConfig.provider === 'gemini' ? 'Usando chave do sistema (opcional)' : 'Cole sua chave aqui...'}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-trampo-500/30 focus:border-trampo-400 outline-none dark:text-white transition-all"
                          />
                        </div>
                        {hasEnvKey && aiConfig.provider === 'gemini' && !aiConfig.apiKey && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
                            <Check size={10} /> Chave de ambiente detectada — funcionará sem configuração.
                          </p>
                        )}
                      </div>

                      {/* Model */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">Modelo</label>
                        <input
                          type="text"
                          value={aiConfig.model}
                          onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                          placeholder={aiConfig.provider === 'gemini' ? 'gemini-2.0-flash' : 'google/gemini-2.0-flash-001'}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-trampo-500/30 focus:border-trampo-400 outline-none dark:text-white transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
                      <button onClick={reopenOnboarding} className="text-xs text-slate-400 hover:text-trampo-600 dark:hover:text-trampo-400 transition-colors flex items-center gap-1.5">
                        🎓 Tutorial
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={handleTestConnection}
                          disabled={isTestingConnection}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          {isTestingConnection ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Testar
                        </button>
                        <button
                          onClick={handleSaveAIConfig}
                          className="bg-gradient-to-r from-trampo-500 to-trampo-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-trampo-500/25 hover:shadow-trampo-500/40 transition-all active:scale-95 flex items-center gap-2"
                        >
                          <Check size={15} /> Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showJobTracker && <JobTracker onClose={() => setShowJobTracker(false)} />}

              {showLinkedinGenerator && <LinkedinProfileGenerator data={resumeData} onUpdate={setResumeData} onClose={() => setShowLinkedinGenerator(false)} onShowToast={setToastMessage} />}

              {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

              {/* Paper shadow */}
              <div
                id="resume-paper"
                data-size={resumeData.settings.paperSize}
                className="relative flex-shrink-0 bg-white origin-top transition-transform duration-200"
                style={{
                  width: resumeData.settings.paperSize === 'letter' ? '215.9mm' : '210mm',
                  minHeight: resumeData.settings.paperSize === 'letter' ? '279.4mm' : '297mm',
                  transform: `scale(${zoom})`,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 60px -8px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
              >
                <Preview data={resumeData} theme={THEMES.find(t => t.id === activeThemeId) || THEMES[0]} mode={previewMode} />
              </div>
            </div>

            {/* ── Floating Controls ─────────────────────────────────── */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 print:hidden z-40">
              <div className="glass-panel flex items-center gap-1 p-1.5 rounded-2xl
                             shadow-[0_8px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)]
                             transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
                {/* Export buttons */}
                <FCtrlBtn onClick={handleTxtExport} title="Exportar TXT"><FileType size={16} /></FCtrlBtn>
                <FCtrlBtn onClick={handleDocxExport} title="Exportar Word (.doc)"><FileText size={16} /></FCtrlBtn>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

                {/* Zoom controls - slider */}
                <FCtrlBtn onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} title="Diminuir Zoom">
                  <ZoomOut size={15} />
                </FCtrlBtn>
                <div className="flex items-center gap-1.5 px-1">
                  <input
                    type="range"
                    min="30" max="150" step="5"
                    value={Math.round(zoom * 100)}
                    onChange={e => setZoom(Number(e.target.value) / 100)}
                    className="w-20"
                    title={`Zoom: ${Math.round(zoom * 100)}%`}
                  />
                  <span className="text-[10px] font-bold w-8 text-center tabular-nums text-slate-500 dark:text-slate-400 select-none">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <FCtrlBtn onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} title="Aumentar Zoom">
                  <ZoomIn size={15} />
                </FCtrlBtn>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

                <FCtrlBtn onClick={handleAutoFit} title="Ajustar à tela (Fit)"><Maximize size={15} /></FCtrlBtn>
                <FCtrlBtn onClick={() => setZoom(window.innerWidth < 768 ? 0.45 : 0.8)} title="Resetar zoom"><RotateCcw size={15} /></FCtrlBtn>

                {/* Mobile PDF button */}
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 md:hidden" />
                <button
                  onClick={() => setIsPrinting(true)}
                  className="md:hidden p-2 bg-gradient-to-b from-slate-800 to-slate-900 text-white rounded-xl shadow-md active:scale-95 transition-all"
                >
                  <Printer size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {toastMessage && <Toast message={toastMessage} onClose={handleToastClose} />}

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
