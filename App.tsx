
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Navbar } from './components/Layout/Navbar';
import { ResumeData, ThemeId, AIConfig } from './types';
import { INITIAL_RESUME, THEMES, CURRENT_DATA_VERSION } from './constants';
import { getAIConfig, saveAIConfig, validateConnection } from './services/geminiService';
import { Printer, Download, Upload, RotateCcw, Palette, Layout, Moon, Sun, Save, FileText, ZoomIn, ZoomOut, UserPlus, Menu, Eye, EyeOff, FileType, Bot, Settings2, Check, X, AlertCircle, Monitor, ChevronRight, Maximize, Briefcase, Key, Linkedin, Minimize2, Edit2, Loader2, RefreshCw, ShieldOff, Link2, Share2, Trophy, Command, Sparkles, Shield, Star, Zap, Search, Hash, ChevronUp } from 'lucide-react';
import { JobTracker } from './components/JobTracker/JobTracker';
import { LinkedinProfileGenerator } from './components/Linkedin/LinkedinProfileGenerator';
import { Onboarding } from './components/Onboarding/Onboarding';

// ── URL Compression (SimpleBase64 JSON) ──────────────────────────────────────
const compressToURL = (obj: any): string => {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); } catch { return ''; }
};
const decompressFromURL = (str: string): any => {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
};

// ── Achievement Definitions ──────────────────────────────────────────────────
interface Badge { id: string; icon: string; label: string; desc: string; color: string; }
const BADGES: Badge[] = [
  { id: 'first_step', icon: '🌟', label: 'Primeiro Passo', desc: 'Adicionou o nome', color: '#f59e0b' },
  { id: 'veteran', icon: '💼', label: 'Veterano', desc: '3+ experiências', color: '#0ea5e9' },
  { id: 'scholar', icon: '🎓', label: 'Estudioso', desc: '2+ formações', color: '#8b5cf6' },
  { id: 'skill_ninja', icon: '🔥', label: 'Ninja das Skills', desc: '8+ habilidades', color: '#ef4444' },
  { id: 'pro_photo', icon: '📸', label: 'Profissional', desc: 'Foto adicionada', color: '#10b981' },
  { id: 'side_hustle', icon: '🚀', label: 'Side Hustler', desc: '3+ projetos', color: '#f97316' },
  { id: 'polyglot', icon: '🌍', label: 'Poliglota', desc: '2+ idiomas', color: '#06b6d4' },
  { id: 'perfect', icon: '✨', label: 'Currículo Perfeito', desc: 'Score = 100', color: '#6366f1' },
  { id: 'dark_knight', icon: '🌙', label: 'Dark Knight', desc: 'Ativou o modo escuro', color: '#334155' },
  { id: 'sharer', icon: '🔗', label: 'Compartilhou', desc: 'Gerou link de compartilhamento', color: '#0284c7' },
];

const checkBadges = (data: ResumeData, darkMode: boolean, hasShared: boolean): string[] => {
  const earned: string[] = [];
  if (data.personalInfo.fullName) earned.push('first_step');
  if (data.experience.length >= 3) earned.push('veteran');
  if (data.education.length >= 2) earned.push('scholar');
  if (data.skills.length >= 8) earned.push('skill_ninja');
  if (data.personalInfo.photoUrl) earned.push('pro_photo');
  if (data.projects.length >= 3) earned.push('side_hustle');
  if (data.languages.length >= 2) earned.push('polyglot');
  if (darkMode) earned.push('dark_knight');
  if (hasShared) earned.push('sharer');
  // perfect computed separately
  return earned;
};

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

  // ── v4 Feature States ──────────────────────────────────────────────────────
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [showBadgesPanel, setShowBadgesPanel] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showPrintChecklist, setShowPrintChecklist] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<{ ts: number; score: number }[]>([]);
  const cmdInputRef = useRef<HTMLInputElement>(null);

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
    // Check URL for shared CV
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCv = urlParams.get('cv');
    if (sharedCv) {
      const decoded = decompressFromURL(sharedCv);
      if (decoded) {
        const merged = { ...INITIAL_RESUME, ...decoded, settings: { ...INITIAL_RESUME.settings, ...(decoded.settings || {}) } };
        setResumeData(merged);
        setToastMessage('🔗 Currículo carregado via link!');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
    }

    const saved = localStorage.getItem('trampolin_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.version && parsed?.data) {
          if (parsed.version === RESUME_DATA_VERSION) {
            setResumeData(parsed.data);
          } else {
            const migrated = { ...INITIAL_RESUME, ...parsed.data, settings: { ...INITIAL_RESUME.settings, ...(parsed.data.settings || {}) } };
            setResumeData(migrated);
          }
        } else {
          const migrated = { ...INITIAL_RESUME, ...parsed, settings: { ...INITIAL_RESUME.settings, ...(parsed.settings || {}) } };
          setResumeData(migrated);
        }
      } catch (e) { console.error('Error loading saved data', e); }
    }
    const profiles = localStorage.getItem('trampolin_profiles');
    if (profiles) { try { setSavedProfiles(JSON.parse(profiles)); } catch (e) { } }
    const dark = localStorage.getItem('trampolin_dark');
    if (dark === 'true') { setDarkMode(true); document.documentElement.classList.add('dark'); }
    const savedFocus = localStorage.getItem('trampolin_focus');
    if (savedFocus === 'true') setFocusMode(true);
    const hasSeenOnboarding = localStorage.getItem('trampolin_onboarding');
    if (!hasSeenOnboarding) { setTimeout(() => setShowOnboarding(true), 1000); }
    const savedZoom = localStorage.getItem('trampolin_zoom');
    if (savedZoom) setZoom(parseFloat(savedZoom));
    const sh = localStorage.getItem('trampolin_shared');
    if (sh === 'true') setHasShared(true);
    const hist = localStorage.getItem('trampolin_score_history');
    if (hist) { try { setScoreHistory(JSON.parse(hist)); } catch { } }
    const badges = localStorage.getItem('trampolin_badges');
    if (badges) { try { setEarnedBadges(JSON.parse(badges)); } catch { } }

    // Auto dark by hour
    if (!dark) {
      const hour = new Date().getHours();
      if (hour >= 19 || hour < 7) { setDarkMode(true); document.documentElement.classList.add('dark'); }
    }

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
    setIsDirty(true);
    const t = setTimeout(() => {
      setLastSavedAt(new Date());
      setIsDirty(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [resumeData]);

  // Achievement badge checker
  useEffect(() => {
    const newEarned = checkBadges(resumeData, darkMode, hasShared);
    // completeness
    let sc = 0;
    if (resumeData.personalInfo.fullName) sc += 10;
    if (resumeData.personalInfo.summary?.length > 50) sc += 15;
    if (resumeData.experience.length > 0) sc += 20;
    if (resumeData.education.length > 0) sc += 15;
    if (resumeData.skills.length >= 3) sc += 15;
    if (resumeData.projects.length > 0) sc += 10;
    if (resumeData.languages.length > 0) sc += 5;
    if (resumeData.certifications.length > 0) sc += 10;
    if (Math.min(100, sc) === 100) newEarned.push('perfect');
    // Find newly unlocked badge
    const justUnlocked = newEarned.find(id => !earnedBadges.includes(id));
    if (justUnlocked) {
      const badge = BADGES.find(b => b.id === justUnlocked);
      if (badge) { setNewBadge(badge); setTimeout(() => setNewBadge(null), 4000); }
    }
    setEarnedBadges(newEarned);
    localStorage.setItem('trampolin_badges', JSON.stringify(newEarned));
  }, [resumeData, darkMode, hasShared]);

  // Score history tracking (once per session change)
  useEffect(() => {
    let sc = 0;
    if (resumeData.personalInfo.fullName) sc += 10;
    if (resumeData.personalInfo.summary?.length > 50) sc += 15;
    if (resumeData.experience.length > 0) sc += 20;
    if (resumeData.education.length > 0) sc += 15;
    if (resumeData.skills.length >= 3) sc += 15;
    if (resumeData.projects.length > 0) sc += 10;
    if (resumeData.languages.length > 0) sc += 5;
    if (resumeData.certifications.length > 0) sc += 10;
    const score = Math.min(100, sc);
    setScoreHistory(prev => {
      const last = prev[prev.length - 1];
      if (last?.score === score) return prev;
      const next = [...prev.slice(-29), { ts: Date.now(), score }];
      localStorage.setItem('trampolin_score_history', JSON.stringify(next));
      return next;
    });
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); setShowPrintChecklist(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); setToastMessage('💾 Salvo!'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(p => !p); setCmdQuery(''); }
      if (e.key === 'Escape') { setShowCommandPalette(false); setShowShareModal(false); setShowPrintChecklist(false); setShowBadgesPanel(false); }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Clipboard import
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      const text = e.clipboardData?.getData('text/plain') || '';
      if (!text.trim().startsWith('{')) return;
      try {
        const parsed = JSON.parse(text);
        if (parsed.personalInfo || parsed.experience) {
          requestConfirm(
            '📋 JSON Detectado no Clipboard',
            'Importar currículo do clipboard? Isso substituirá os dados atuais.',
            () => { setResumeData({ ...INITIAL_RESUME, ...parsed, settings: { ...INITIAL_RESUME.settings, ...(parsed.settings || {}) } }); setToastMessage('📋 Importado do clipboard!'); closeConfirm(); },
            'info'
          );
        }
      } catch { }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Focus command palette input when opened
  useEffect(() => {
    if (showCommandPalette) { setTimeout(() => cmdInputRef.current?.focus(), 50); }
  }, [showCommandPalette]);

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

  // v4: Share URL
  const handleShare = () => {
    const encoded = compressToURL(resumeData);
    const url = `${window.location.origin}${window.location.pathname}?cv=${encoded}`;
    setShareUrl(url);
    setShowShareModal(true);
    setHasShared(true);
    localStorage.setItem('trampolin_shared', 'true');
  };

  // v4: Print after checklist
  const handlePrintDirect = () => { setShowPrintChecklist(false); setIsPrinting(true); };

  // v4: Print quality checklist items
  const printChecks = useMemo(() => [
    { ok: !!resumeData.personalInfo.fullName, label: 'Nome completo preenchido' },
    { ok: !!resumeData.personalInfo.email, label: 'Email preenchido' },
    { ok: !!resumeData.personalInfo.phone, label: 'Telefone preenchido' },
    { ok: (resumeData.personalInfo.summary?.length || 0) >= 50, label: 'Resumo com pelo menos 50 caracteres' },
    { ok: resumeData.experience.length > 0, label: 'Ao menos uma experiência' },
    { ok: resumeData.skills.length >= 3, label: 'Ao menos 3 habilidades' },
    { ok: !resumeData.personalInfo.email.includes(' '), label: 'Email sem espaços' },
    { ok: resumeData.education.length > 0, label: 'Ao menos uma formação' },
  ], [resumeData]);

  // v4: Command Palette commands
  const paletteCommands = useMemo(() => [
    { icon: '🖨️', label: 'Imprimir PDF', action: () => { setShowPrintChecklist(true); setShowCommandPalette(false); } },
    { icon: '🔗', label: 'Compartilhar Link', action: () => { handleShare(); setShowCommandPalette(false); } },
    { icon: '🌓', label: 'Alternar Modo Escuro', action: () => { toggleDarkMode(); setShowCommandPalette(false); } },
    { icon: '🎨', label: 'Escolher Tema', action: () => { setShowThemeSelector(true); setShowCommandPalette(false); } },
    { icon: '💼', label: 'Job Tracker', action: () => { setShowJobTracker(true); setShowCommandPalette(false); } },
    { icon: '🏆', label: 'Minhas Conquistas', action: () => { setShowBadgesPanel(true); setShowCommandPalette(false); } },
    { icon: '💾', label: 'Salvar Perfil', action: () => { saveProfile(); setShowCommandPalette(false); } },
    { icon: '📄', label: 'Exportar TXT', action: () => { handleTxtExport(); setShowCommandPalette(false); } },
    { icon: '📝', label: 'Exportar Word', action: () => { handleDocxExport(); setShowCommandPalette(false); } },
    { icon: '🤖', label: 'Configurar IA', action: () => { setShowAISettings(true); setShowCommandPalette(false); } },
    { icon: '↩️', label: 'Preview Carta', action: () => { setPreviewMode('cover'); setShowCommandPalette(false); } },
    { icon: '📊', label: 'Preview Currículo', action: () => { setPreviewMode('resume'); setShowCommandPalette(false); } },
    { icon: '🔒', label: 'Modo Privacidade', action: () => { togglePrivacyMode(); setShowCommandPalette(false); } },
    { icon: '↔️', label: 'Ajustar à Tela', action: () => { handleAutoFit(); setShowCommandPalette(false); } },
  ], [darkMode, resumeData]);

  const filteredCommands = cmdQuery
    ? paletteCommands.filter(c => c.label.toLowerCase().includes(cmdQuery.toLowerCase()))
    : paletteCommands;

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

      {/* ── Auto-save Indicator ─────────────────────────────────────── */}
      {lastSavedAt && (
        <div className={`fixed top-[68px] right-4 z-50 flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-500 pointer-events-none
          ${isDirty
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 border border-amber-200 dark:border-amber-800'
            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border border-emerald-200 dark:border-emerald-800'}
        `}>
          {isDirty
            ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Salvando...</>
            : <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Salvo {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
          }
        </div>
      )}

      {/* ── Badge Toast Notification ────────────────────────────────── */}
      {newBadge && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-bounce-in">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-5 py-4 flex items-center gap-3 min-w-[280px]">
            <div className="text-3xl">{newBadge.icon}</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: newBadge.color }}>🏆 Conquista Desbloqueada!</p>
              <p className="font-bold text-slate-800 dark:text-white text-sm">{newBadge.label}</p>
              <p className="text-[11px] text-slate-400">{newBadge.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Command Palette ─────────────────────────────────────────── */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowCommandPalette(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <Search size={16} className="text-slate-400" />
              <input
                ref={cmdInputRef}
                value={cmdQuery}
                onChange={e => setCmdQuery(e.target.value)}
                placeholder="Buscar ações... (⌘K para fechar)"
                className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white outline-none placeholder-slate-400"
              />
              <kbd className="kbd">ESC</kbd>
            </div>
            <div className="max-h-72 overflow-auto py-1">
              {filteredCommands.map((cmd, i) => (
                <button key={i} onClick={cmd.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                  <span className="text-lg w-6 text-center">{cmd.icon}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{cmd.label}</span>
                </button>
              ))}
              {filteredCommands.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">Nenhum comando encontrado</div>
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3 text-[10px] text-slate-400">
              <span><kbd className="kbd">↑↓</kbd> navegar</span>
              <span><kbd className="kbd">Enter</kbd> executar</span>
              <span><kbd className="kbd">⌘K</kbd> abrir/fechar</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Modal ─────────────────────────────────────────────── */}
      {showShareModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowShareModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600"><Share2 size={18} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Compartilhar Currículo</h3>
                  <p className="text-[11px] text-slate-400">Link direto, sem cadastro</p>
                </div>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X size={16} /></button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex items-center gap-2 mb-4">
              <Link2 size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1 font-mono">{shareUrl}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl); setToastMessage('🔗 Link copiado!'); }}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20">
                <Link2 size={14} /> Copiar Link
              </button>
              <button
                onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent('Veja meu currículo: ' + shareUrl)}`, '_blank'); }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95">
                WhatsApp
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3">O link contém os dados do seu currículo encoded na URL. Nenhum dado é enviado para servidores.</p>
          </div>
        </div>
      )}

      {/* ── Print Quality Checklist ─────────────────────────────────── */}
      {showPrintChecklist && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowPrintChecklist(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600"><Printer size={18} /></div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Checklist Pré-Impressão</h3>
                <p className="text-[11px] text-slate-400">Verifique antes de imprimir</p>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              {printChecks.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all
                  ${item.ok ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-300'}`}>
                  {item.ok ? <Check size={14} className="flex-shrink-0" /> : <X size={14} className="flex-shrink-0" />}
                  {item.label}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPrintChecklist(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                Voltar e Editar
              </button>
              <button onClick={handlePrintDirect} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20">
                <Printer size={14} /> Imprimir Assim Mesmo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Badges Panel ────────────────────────────────────────────── */}
      {showBadgesPanel && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowBadgesPanel(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600"><Trophy size={18} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Minhas Conquistas</h3>
                  <p className="text-[11px] text-slate-400">{earnedBadges.length}/{BADGES.length} desbloqueadas</p>
                </div>
              </div>
              <button onClick={() => setShowBadgesPanel(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X size={16} /></button>
            </div>
            {/* Score Timeline Sparkline */}
            {scoreHistory.length > 1 && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evolução do Score</p>
                <svg width="100%" height="40" viewBox={`0 0 ${scoreHistory.length * 10} 40`} preserveAspectRatio="none">
                  <defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#10b981" />
                  </linearGradient></defs>
                  <polyline
                    points={scoreHistory.map((p, i) => `${i * 10 + 5},${40 - (p.score / 100) * 36}`).join(' ')}
                    fill="none" stroke="url(#sparkGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {BADGES.map(badge => {
                const unlocked = earnedBadges.includes(badge.id);
                return (
                  <div key={badge.id} className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all
                    ${unlocked
                      ? 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 shadow-sm'
                      : 'bg-slate-50/50 dark:bg-slate-900/50 border-transparent opacity-40 grayscale'
                    }`}>
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{badge.label}</p>
                      <p className="text-[10px] text-slate-400">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
        onShare={handleShare}
        onShowBadges={() => setShowBadgesPanel(true)}
        onOpenCommandPalette={() => { setShowCommandPalette(true); setCmdQuery(''); }}
        earnedBadgesCount={earnedBadges.length}
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
