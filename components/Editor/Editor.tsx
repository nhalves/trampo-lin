
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ResumeData, ResumeSettings } from '../../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Wand2, Eye, EyeOff, ArrowUp, ArrowDown, Settings, Briefcase, GraduationCap, Medal, Code, User, Languages, FileText, Search, QrCode, Heart, Award, Users, FilePlus, Copy, Eraser, Languages as LangIcon, Upload, X, Type, Undo2, Redo2, Download, RefreshCw, Star, Globe, PenTool, CheckCircle2, AlertCircle, FileUp, Calendar, Link2, Mail, Phone, MapPin, FileJson, Twitter, Dribbble, Hash, Bold, Italic, List, Linkedin, BookOpen, Feather, Zap, Smile, Book, Timer, MessageSquare, Briefcase as BriefcaseIcon, LayoutGrid, GripVertical, Target, Maximize2, Minimize2 } from 'lucide-react';
import { improveText, generateSummary, suggestSkills, generateCoverLetter, analyzeJobMatch, translateText, generateBulletPoints, extractResumeFromPdf, generateInterviewQuestions, generateLinkedinHeadline, tailorResume, analyzeGap } from '../../services/geminiService';
import { AVAILABLE_FONTS, INITIAL_RESUME, FONT_PAIRINGS, EXAMPLE_PERSONAS } from '../../constants';

interface EditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onShowToast: (msg: string) => void;
  onRequestConfirm: (title: string, message: string, onConfirm: () => void, type?: 'danger' | 'info') => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
}

const COLOR_PRESETS = [
  '#000000', '#334155', '#1e3a8a', '#2563eb', '#0ea5e9', 
  '#0f766e', '#16a34a', '#ca8a04', '#ea580c', '#dc2626', 
  '#be123c', '#7c3aed', '#4b5563', '#a855f7', '#ec4899', '#f43f5e'
];

const CUSTOM_ICONS = [
  { id: 'star', icon: Star, label: 'Estrela' },
  { id: 'globe', icon: Globe, label: 'Globo' },
  { id: 'code', icon: Code, label: 'Código' },
  { id: 'heart', icon: Heart, label: 'Coração' },
  { id: 'pen', icon: PenTool, label: 'Caneta' },
  { id: 'award', icon: Award, label: 'Prêmio' },
  { id: 'zap', icon: Zap, label: 'Raio' },
  { id: 'feather', icon: Feather, label: 'Pena' },
  { id: 'book', icon: BookOpen, label: 'Livro' }
];

// Helper: Date Mask (MM/YYYY)
const handleDateInput = (value: string) => {
    let v = value.replace(/\D/g, '').slice(0, 6);
    if (v.length >= 3) {
        return `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    return v;
};

// --- OPTIMIZED INPUT COMPONENTS (DEBOUNCED) ---

const DebouncedInput = ({ label, value, onChange, type = "text", placeholder = "", step, disabled, icon: Icon, isDate, className }: any) => {
    const [localValue, setLocalValue] = useState(value);
    
    // Sync local state if prop changes externally (e.g. undo/redo/import)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Debounce Logic
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, 400); // 400ms delay

        return () => clearTimeout(handler);
    }, [localValue, onChange, value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = isDate ? handleDateInput(e.target.value) : e.target.value;
        setLocalValue(val);
    };

    return (
        <div className={`mb-1 w-full relative ${className}`}>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
            <div className="relative">
                <input 
                    type={type} 
                    step={step} 
                    disabled={disabled}
                    placeholder={placeholder} 
                    className={`w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-trampo-500/20 focus:border-trampo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-100 placeholder:text-slate-400 ${Icon ? 'pl-9' : ''}`} 
                    value={localValue} 
                    onChange={handleChange} 
                />
                {Icon && <Icon className="absolute left-3 top-2.5 text-slate-400" size={16} />}
            </div>
        </div>
    );
};

const DebouncedTextarea = ({ value, onChange, placeholder, className, id }: any) => {
    const [localValue, setLocalValue] = useState(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync from props
    useEffect(() => {
        setLocalValue(value);
        adjustHeight();
    }, [value]);

    // Adjust height helper
    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    // Debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localValue !== value) {
                // Mock event for parent handler compatibility
                onChange({ target: { value: localValue } });
            }
        }, 500); // 500ms for textareas

        return () => clearTimeout(handler);
    }, [localValue, onChange, value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        adjustHeight();
    };

    const handleMarkdown = (char: string, wrap: boolean) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = localValue || "";
        let newText = '';
        
        if (wrap) {
            newText = text.substring(0, start) + char + text.substring(start, end) + char + text.substring(end);
        } else {
            newText = text.substring(0, start) + char + text.substring(end);
        }
        
        setLocalValue(newText);
        // Force sync immediately for toolbar actions
        onChange({ target: { value: newText } });
        
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(start + char.length, wrap ? end + char.length : start + char.length);
            adjustHeight();
        }, 0);
    };

    return (
        <div className="relative group">
             <div className="opacity-0 group-focus-within:opacity-100 transition-opacity absolute -top-8 right-0 z-10">
                <div className="flex gap-1 mb-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit shadow-sm border border-slate-200 dark:border-slate-700">
                    <button onClick={() => handleMarkdown('**', true)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Negrito"><Bold size={12}/></button>
                    <button onClick={() => handleMarkdown('*', true)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Itálico"><Italic size={12}/></button>
                    <button onClick={() => handleMarkdown('\n• ', false)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Lista"><List size={12}/></button>
                </div>
            </div>
            <textarea
                id={id}
                ref={textareaRef}
                className={`${className} resize-none overflow-hidden`}
                value={localValue}
                onChange={handleChange}
                placeholder={placeholder}
                rows={1}
            />
        </div>
    );
};

// UI Component: Modern Section Wrapper
const Section = ({ title, icon: Icon, children, isOpen, onToggle, isVisible, onVisibilityToggle, onClear, itemCount }: any) => (
  <div className={`group border border-transparent rounded-xl transition-all duration-300 mb-4 ${isOpen ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
    <div className={`flex items-center justify-between p-4 cursor-pointer select-none rounded-xl ${!isVisible && isVisible !== undefined ? 'opacity-50 grayscale' : ''}`} onClick={onToggle}>
      <div className="flex-1 flex items-center gap-3 text-left">
        <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-trampo-100 dark:bg-trampo-900/30 text-trampo-600 dark:text-trampo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
           {Icon && <Icon size={18} />}
        </div>
        <div>
            <span className="font-semibold text-slate-700 dark:text-slate-200 block leading-tight">{title}</span>
            {itemCount !== undefined && <span className="text-[10px] text-slate-400 font-medium">{itemCount} itens</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onClear && (
          <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Limpar Seção">
            <Eraser size={16} />
          </button>
        )}
        {onVisibilityToggle && (
          <button onClick={(e) => { e.stopPropagation(); onVisibilityToggle(); }} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title={isVisible ? "Ocultar" : "Mostrar"}>
            {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
        <div className={`p-2 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <ChevronDown size={20} />
        </div>
      </div>
    </div>
    {isOpen && <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">{children}</div>}
  </div>
);

export const Editor: React.FC<EditorProps> = ({ data, onChange, onShowToast, onRequestConfirm, focusMode, setFocusMode }) => {
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
  
  // Extra Tools State
  const [interviewQs, setInterviewQs] = useState<string>('');
  const [linkedinHeadline, setLinkedinHeadline] = useState<string>('');
  
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

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              undo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              redo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
              e.preventDefault();
              setActiveTab('tools');
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Handle Changes with History
  const handleChangeWithHistory = useCallback((newData: ResumeData) => {
    if (isUndoRedoAction.current) {
      onChange(newData);
      isUndoRedoAction.current = false;
      return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    if (newHistory.length > 50) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange(newData);
  }, [history, historyIndex, onChange]);

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

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, listName: string, index: number) => {
      e.dataTransfer.setData("listName", listName);
      e.dataTransfer.setData("index", index.toString());
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessário para permitir o Drop
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, listName: string, dropIndex: number) => {
      e.preventDefault();
      const dragListName = e.dataTransfer.getData("listName");
      const dragIndex = parseInt(e.dataTransfer.getData("index"));

      if (dragListName !== listName || dragIndex === dropIndex || isNaN(dragIndex)) return;

      const list = [...(data as any)[listName]];
      const [movedItem] = list.splice(dragIndex, 1);
      list.splice(dropIndex, 0, movedItem);

      handleChangeWithHistory({ ...data, [listName]: list });
      onShowToast("Item reordenado.");
  };

  // --- Helpers ---
  const updateSettings = (field: keyof ResumeSettings, value: any) => {
    handleChangeWithHistory({ ...data, settings: { ...data.settings, [field]: value } });
  };
  
  const calculateCompleteness = () => {
    let score = 0;
    if (data.personalInfo.fullName) score += 10;
    if (data.personalInfo.summary && data.personalInfo.summary.length > 50) score += 15;
    if (data.experience.length > 0) score += 20;
    if (data.education.length > 0) score += 15;
    if (data.skills.length >= 3) score += 15;
    if (data.projects.length > 0) score += 10;
    if (data.languages.length > 0) score += 5;
    if (data.certifications.length > 0) score += 10;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();
  const wordCount = JSON.stringify(data).split(' ').length;
  const readingTime = Math.ceil(wordCount / 200);

  const toggleVisibility = (section: string) => {
    const visibleSections = { ...data.settings.visibleSections };
    visibleSections[section] = !visibleSections[section];
    updateSettings('visibleSections', visibleSections);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onShowToast("Erro: Imagem maior que 2MB.");
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
             const result = reader.result as string;
             const base64 = result.split(',')[1];
             setAtsFile({ name: file.name, data: base64, mimeType: file.type });
             onShowToast("PDF anexado com sucesso!");
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
           onShowToast("Currículo carregado!");
         } catch (e) {
           onShowToast("Erro: Arquivo inválido ou corrompido.");
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
    a.download = `backup-trampolin-${data.personalInfo.fullName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
  };

  const handleReset = () => {
    onRequestConfirm(
      "Resetar Currículo?",
      "Isso apagará TODOS os dados atuais e restaurará o modelo padrão. Deseja continuar?",
      () => {
        handleChangeWithHistory(INITIAL_RESUME);
        onShowToast("Currículo reiniciado.");
      },
      'danger'
    );
  };

  const loadExample = (example: ResumeData) => {
      onRequestConfirm(
        "Carregar Exemplo?",
        "Ao carregar este exemplo, seus dados atuais não salvos serão perdidos.",
        () => {
          handleChangeWithHistory(example);
          onShowToast("Exemplo carregado!");
          setShowExamples(false);
        },
        'info'
      );
  };

  // --- Actions ---
  const handleImproveText = async (text: string, path: (val: string) => void, action: 'grammar' | 'shorter' | 'longer' = 'grammar') => {
    if (!text || text.length < 5) {
        onShowToast("Texto muito curto para análise.");
        return;
    }
    setLoadingAI('improving');
    const improved = await improveText(text, 'resume', data.settings.aiTone, action);
    path(improved);
    setLoadingAI(null);
    onShowToast("✨ Texto aprimorado!");
  };

  const handleGenerateBullets = async (role: string, company: string, currentDesc: string, path: (val: string) => void) => {
    if (!role) { onShowToast("Preencha o cargo antes de gerar."); return; }
    setLoadingAI('bullets');
    const bullets = await generateBulletPoints(role, company);
    const newText = currentDesc ? currentDesc + '\n' + bullets : bullets;
    path(newText);
    setLoadingAI(null);
    onShowToast("✨ Bullets gerados!");
  };

  const handleAICoverLetter = async () => {
    if (!data.coverLetter.companyName || !data.coverLetter.jobTitle) {
      onShowToast("Preencha Empresa e Cargo para gerar.");
      return;
    }
    setLoadingAI('cover-letter');
    const content = await generateCoverLetter(data, data.coverLetter.companyName, data.coverLetter.jobTitle);
    handleChangeWithHistory({ ...data, coverLetter: { ...data.coverLetter, content } });
    setLoadingAI(null);
    onShowToast("✨ Carta criada!");
  };

  const handleAIGenerateSummary = async () => {
    setLoadingAI('gen-summary');
    const summary = await generateSummary(data.personalInfo.jobTitle, data.experience);
    handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, summary } });
    setLoadingAI(null);
    onShowToast("✨ Resumo criado!");
  };
  
  const handleAIInterview = async () => {
      setLoadingAI('interview');
      const res = await generateInterviewQuestions(data);
      setInterviewQs(res);
      setLoadingAI(null);
  };

  const handleAIHeadline = async () => {
      setLoadingAI('headline');
      const res = await generateLinkedinHeadline(data);
      setLinkedinHeadline(res);
      setLoadingAI(null);
  };
  
  // NEW: TAILOR RESUME
  const handleTailorResume = async () => {
      if (!tailorJobDesc) return;
      setLoadingAI('tailor');
      const result = await tailorResume(data, tailorJobDesc);
      
      if (result) {
          const newData = { ...data };
          // Atualiza Resumo
          if (result.summary) newData.personalInfo.summary = result.summary;
          
          // Atualiza Experiências (Match by ID)
          result.experience.forEach(rewritten => {
              const idx = newData.experience.findIndex(e => e.id === rewritten.id);
              if (idx !== -1) {
                  newData.experience[idx].description = rewritten.rewrittenDescription;
              }
          });
          
          handleChangeWithHistory(newData);
          onShowToast("Currículo adaptado à vaga com sucesso!");
          setShowTailorModal(false);
      } else {
          onShowToast("Erro ao adaptar currículo.");
      }
      setLoadingAI(null);
  };

  // NEW: GAP ANALYSIS
  const handleGapAnalysis = async () => {
      if (!gapJobDesc) return;
      setLoadingAI('gap');
      const result = await analyzeGap(data, gapJobDesc);
      setGapAnalysis(result);
      setLoadingAI(null);
  };

  const handleTranslate = async (lang: string) => {
     onRequestConfirm(
        `Traduzir para ${lang}?`,
        `A IA irá traduzir todos os textos do currículo. O processo pode levar alguns segundos.`,
        async () => {
            setLoadingAI('translating');
            const newData = { ...data };
            if (newData.personalInfo.summary) newData.personalInfo.summary = await translateText(newData.personalInfo.summary, lang);
            for (const exp of newData.experience) {
            if (exp.role) exp.role = await translateText(exp.role, lang);
            if (exp.description) exp.description = await translateText(exp.description, lang);
            }
            handleChangeWithHistory(newData);
            setLoadingAI(null);
            onShowToast(`Tradução para ${lang} concluída.`);
        },
        'info'
     );
  };

  const handleConvertToEditor = async () => {
      if (!atsFile) return;
      onRequestConfirm(
        "Converter PDF para Editor?",
        "Isso irá sobrescrever os dados atuais do Editor com as informações extraídas do PDF. Recomendamos fazer um backup antes.",
        async () => {
            setLoadingAI('convert-pdf');
            const extractedData = await extractResumeFromPdf(atsFile);
            
            if (extractedData) {
                handleChangeWithHistory({
                    ...INITIAL_RESUME,
                    personalInfo: { ...INITIAL_RESUME.personalInfo, ...extractedData.personalInfo },
                    experience: extractedData.experience || [],
                    education: extractedData.education || [],
                    skills: extractedData.skills || [],
                    languages: extractedData.languages || [],
                });
                onShowToast("Currículo convertido para o Editor com sucesso!");
                setActiveTab('resume');
            } else {
                onShowToast("Erro ao converter PDF. Tente novamente.");
            }
            setLoadingAI(null);
        },
        'danger'
      );
  };

  const handleRunAtsAnalysis = async () => {
      if (!jobDescription) { onShowToast("Cole a descrição da vaga."); return; }
      setLoadingAI('ats');
      
      let input: any = JSON.stringify(data);
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
     onRequestConfirm(
        "Remover Item?",
        "Deseja realmente remover este item da lista?",
        () => {
            const list = [...(data as any)[listName]];
            handleChangeWithHistory({ ...data, [listName]: list.filter((_, i) => i !== index) });
        },
        'danger'
     );
  };
  
  const clearList = (listName: string) => {
    onRequestConfirm(
        "Limpar Seção?",
        `Tem certeza que deseja limpar todos os itens da seção ${listName}?`,
        () => {
            handleChangeWithHistory({ ...data, [listName]: [] });
            onShowToast("Seção limpa.");
        },
        'danger'
    );
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
      onShowToast(`Fonte ${pair.name} aplicada!`);
  };

  // --- Renderers ---
  const renderGenericList = (key: string, titleField: string, subtitleField: string, newItem: any, fields: any[]) => (
    <div className="space-y-4">
       {(data as any)[key].map((item: any, index: number) => (
         <div 
            key={item.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, key, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, key, index)}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 relative group transition-all hover:shadow-md hover:border-trampo-200 dark:hover:border-slate-600 cursor-grab active:cursor-grabbing"
         >
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
               <div className="p-1.5 text-slate-400 cursor-move" title="Arrastar para reordenar"><GripVertical size={14}/></div>
               <button onClick={() => duplicateItem(key, index)} className="p-1.5 hover:text-blue-500 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Duplicar"><Copy size={14}/></button>
               <button onClick={() => removeItem(key, index)} className="p-1.5 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20" title="Remover"><Trash2 size={14}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 pr-8">
              {fields.map(f => {
                if (f.key === 'startDate' || f.key === 'endDate' || f.key === 'date') {
                    // Logic specifically for dates in Experience/Education
                    return (
                        <div key={f.key}>
                            <DebouncedInput 
                                label={f.label} 
                                value={item[f.key]} 
                                onChange={(v: string) => handleListChange(key, index, f.key, v)} 
                                type="text" 
                                placeholder="MM/AAAA" 
                                isDate={true}
                                disabled={f.key === 'endDate' && item.current}
                            />
                            {f.key === 'endDate' && key === 'experience' && (
                                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-trampo-600 focus:ring-trampo-500 w-3 h-3"
                                        checked={item.current || false}
                                        onChange={(e) => handleListChange(key, index, 'current', e.target.checked)}
                                    />
                                    <span className="text-[10px] font-bold text-trampo-600 uppercase">Trabalho Atual</span>
                                </label>
                            )}
                        </div>
                    )
                }
                return (
                    <div key={f.key} className={f.full ? "col-span-2" : ""}>
                        <DebouncedInput label={f.label} value={item[f.key]} onChange={(v: string) => handleListChange(key, index, f.key, v)} type={f.type || 'text'} placeholder={f.placeholder} />
                    </div>
                );
              })}
            </div>
            {item.description !== undefined && (
               <div className="relative mt-2">
                 <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Descrição / Conquistas</label>
                    <div className="flex gap-2">
                        {/* Bullet Generator Button */}
                        {key === 'experience' && (
                            <button onClick={() => handleGenerateBullets(item.role, item.company, item.description, (v) => handleListChange(key, index, 'description', v))} className="text-xs flex items-center gap-1 text-trampo-600 hover:text-trampo-700 bg-white dark:bg-slate-800 rounded px-2 py-0.5 border border-slate-200 dark:border-slate-600 transition-all hover:shadow-sm" title="Gerar Bullets">
                            <Type size={12} /> Gerar Bullets
                            </button>
                        )}
                        <button onClick={() => handleImproveText(item.description, (v) => handleListChange(key, index, 'description', v))} className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 bg-white dark:bg-slate-800 rounded px-2 py-0.5 border border-slate-200 dark:border-slate-600 transition-all hover:shadow-sm" title="Melhorar com IA">
                        <Wand2 size={12} /> Melhorar
                        </button>
                    </div>
                 </div>
                 <DebouncedTextarea 
                    id={`desc-${key}-${index}`}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500/20 focus:border-trampo-500 outline-none transition-all leading-relaxed" 
                    value={item.description} 
                    onChange={(e: any) => handleListChange(key, index, 'description', e.target.value)} 
                    placeholder="• Descreva suas principais responsabilidades&#10;• Mencione resultados quantitativos (ex: Aumentou vendas em 20%)" 
                 />
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
            <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 transition-all text-slate-600 dark:text-slate-300" title="Desfazer (Ctrl+Z)"><Undo2 size={16}/></button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 transition-all text-slate-600 dark:text-slate-300" title="Refazer (Ctrl+Y)"><Redo2 size={16}/></button>
         </div>
         <div className="flex gap-2">
            <input type="file" ref={jsonInputRef} onChange={handleJsonImport} accept=".json" className="hidden" />
            
            {/* Focus Mode Button */}
            <button onClick={() => setFocusMode(!focusMode)} className={`p-2 rounded-lg transition-colors border ${focusMode ? 'bg-trampo-100 border-trampo-300 text-trampo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`} title={focusMode ? "Sair do Modo Foco" : "Modo Foco (Zen)"}>
                {focusMode ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
            </button>
            
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => jsonInputRef.current?.click()} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all text-slate-600 dark:text-slate-300" title="Importar Backup JSON"><Upload size={16}/></button>
                <button onClick={handleJsonExport} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all text-slate-600 dark:text-slate-300" title="Exportar Backup JSON"><Download size={16}/></button>
                <div className="relative">
                    <button onClick={() => setShowExamples(!showExamples)} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all text-slate-600 dark:text-slate-300" title="Carregar Exemplo"><User size={16}/></button>
                    {showExamples && (
                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-lg p-1 min-w-[200px] z-50">
                            <div className="text-[10px] font-bold text-slate-400 p-2">PERSONAS</div>
                            {EXAMPLE_PERSONAS.map(ex => (
                                <button key={ex.id} onClick={() => loadExample(ex)} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md truncate">{ex.profileName}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <button onClick={handleReset} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Resetar Tudo"><RefreshCw size={16}/></button>
         </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex px-4 pt-4 pb-2 gap-4 bg-white dark:bg-slate-900 select-none overflow-x-auto">
        <button onClick={() => setActiveTab('resume')} className={`flex-1 min-w-fit pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'resume' ? 'text-trampo-600 border-trampo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}><FileText size={16}/> Editor</button>
        <button onClick={() => setActiveTab('tools')} className={`flex-1 min-w-fit pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'tools' ? 'text-amber-600 border-amber-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}><Zap size={16}/> Ferramentas</button>
        <button onClick={() => setActiveTab('cover')} className={`flex-1 min-w-fit pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'cover' ? 'text-purple-600 border-purple-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}><Wand2 size={16}/> Carta</button>
        <button onClick={() => setActiveTab('ats')} className={`flex-1 min-w-fit pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'ats' ? 'text-emerald-600 border-emerald-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}><Search size={16}/> ATS</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth">
        {activeTab === 'resume' && (
          <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Magic Actions Widget */}
             <div className="p-3 bg-gradient-to-r from-trampo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-trampo-100 dark:border-slate-700 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-trampo-600 dark:text-trampo-400"><Sparkles size={18}/></div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-white">Adaptação Inteligente</h4>
                        <p className="text-[10px] text-slate-500">Personalize para a vaga</p>
                    </div>
                </div>
                <button onClick={() => setShowTailorModal(true)} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-trampo-200 dark:border-slate-600 rounded-lg text-xs font-bold text-trampo-700 dark:text-trampo-300 hover:shadow-md transition-all active:scale-95">
                    🎯 Adaptar Currículo
                </button>
             </div>

             {/* Stats & Checklist Widget (New) */}
             <div className="grid grid-cols-2 gap-4 mb-2">
                 <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                     <span className="text-[10px] uppercase font-bold text-slate-400">Progresso</span>
                     <div className="flex items-center gap-2">
                         <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div className="bg-trampo-500 h-full rounded-full transition-all" style={{width: `${completeness}%`}}></div>
                         </div>
                         <span className="text-xs font-bold">{completeness}%</span>
                     </div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                     <span className="text-[10px] uppercase font-bold text-slate-400">Métricas</span>
                     <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-300">
                         <span className="flex items-center gap-1" title="Contagem de Palavras"><Book size={12}/> {wordCount}</span>
                         <span className="flex items-center gap-1" title="Tempo de Leitura"><Timer size={12}/> ~{readingTime}min</span>
                     </div>
                 </div>
             </div>

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
                   <DebouncedInput label="Nome Completo" value={data.personalInfo.fullName} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, fullName: v } })} placeholder="Seu Nome" />
                   <DebouncedInput label="Cargo Alvo" value={data.personalInfo.jobTitle} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, jobTitle: v } })} placeholder="Ex: Desenvolvedor Frontend" />
                   <DebouncedInput label="Email" value={data.personalInfo.email} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, email: v } })} placeholder="nome@email.com" icon={Mail} />
                   <DebouncedInput label="Telefone" value={data.personalInfo.phone} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, phone: v } })} placeholder="(11) 99999-9999" icon={Phone} />
                   <DebouncedInput label="Endereço" value={data.personalInfo.address} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, address: v } })} placeholder="Cidade, Estado" icon={MapPin} />
                   <DebouncedInput label="LinkedIn" value={data.personalInfo.linkedin} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, linkedin: v } })} placeholder="linkedin.com/in/voce" icon={Linkedin} />
                   <DebouncedInput label="Site / Portfólio" value={data.personalInfo.website} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, website: v } })} placeholder="seusite.com" icon={Globe} />
                   <DebouncedInput label="GitHub" value={data.personalInfo.github} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, github: v } })} placeholder="github.com/voce" icon={FileJson} />
                   <DebouncedInput label="Twitter / X" value={data.personalInfo.twitter} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, twitter: v } })} placeholder="x.com/voce" icon={Twitter} />
                   <DebouncedInput label="Behance" value={data.personalInfo.behance} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, behance: v } })} placeholder="behance.net/voce" icon={Hash} />
                </div>
                
                {/* Signature Field */}
                <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                     <DebouncedInput label="Assinatura Digital (Opcional)" value={data.personalInfo.signature || ''} onChange={(v: string) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, signature: v } })} placeholder="Digite seu nome para assinar" icon={PenTool} />
                </div>

                <div className="mt-5">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Resumo Profissional</label>
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-mono ${data.personalInfo.summary.length > 400 ? 'text-red-500' : 'text-slate-400'}`}>{data.personalInfo.summary.length} chars</span>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <select value={data.settings.aiTone} onChange={(e) => updateSettings('aiTone', e.target.value)} className="text-[10px] bg-transparent border-none outline-none text-slate-600 dark:text-slate-300">
                                <option value="professional">Profissional</option>
                                <option value="creative">Criativo</option>
                                <option value="academic">Acadêmico</option>
                                <option value="enthusiastic">Entusiasta</option>
                            </select>
                            <button onClick={handleAIGenerateSummary} disabled={!!loadingAI} className="text-xs px-2 py-1 bg-white dark:bg-slate-700 rounded text-trampo-600 dark:text-trampo-400 font-medium hover:shadow-sm"><Sparkles size={12}/></button>
                        </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <DebouncedTextarea 
                        id="summary-input"
                        className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500/20 focus:border-trampo-500 outline-none transition-all" 
                        value={data.personalInfo.summary} 
                        onChange={(e: any) => handleChangeWithHistory({ ...data, personalInfo: { ...data.personalInfo, summary: e.target.value } })}
                        placeholder="Breve descrição sobre sua experiência, paixões e o que busca..." 
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleImproveText(data.personalInfo.summary, (v) => handleChangeWithHistory({...data, personalInfo: {...data.personalInfo, summary: v}}), 'shorter')} className="text-slate-500 hover:text-trampo-600 bg-white dark:bg-slate-800 rounded-md p-1.5 shadow border border-slate-200 dark:border-slate-700 text-[10px] font-bold" title="Encurtar">CURTO</button>
                         <button onClick={() => handleImproveText(data.personalInfo.summary, (v) => handleChangeWithHistory({...data, personalInfo: {...data.personalInfo, summary: v}}), 'grammar')} className="text-slate-500 hover:text-green-600 bg-white dark:bg-slate-800 rounded-md p-1.5 shadow border border-slate-200 dark:border-slate-700 text-[10px] font-bold" title="Corrigir Gramática">ABC✓</button>
                         <button onClick={() => handleImproveText(data.personalInfo.summary, (v) => handleChangeWithHistory({...data, personalInfo: {...data.personalInfo, summary: v}}))} className="text-purple-600 bg-white dark:bg-slate-800 rounded-md p-1.5 shadow border border-slate-200 dark:border-slate-700 hover:scale-105"><Wand2 size={16}/></button>
                    </div>
                  </div>
                </div>
             </Section>

             {/* Dynamic Sections */}
             <Section title="Experiência" icon={Briefcase} isOpen={openSection === 'experience'} onToggle={() => toggleSection('experience')} isVisible={data.settings.visibleSections.experience} onVisibilityToggle={() => toggleVisibility('experience')} onClear={() => clearList('experience')} itemCount={data.experience.length}>
               {renderGenericList('experience', 'role', 'company', { role: 'Cargo', company: 'Empresa', current: false, description: '' }, [
                 { key: 'role', label: 'Cargo' }, { key: 'company', label: 'Empresa' }, 
                 { key: 'startDate', label: 'Início', type: 'text', placeholder: 'MM/AAAA' }, { key: 'endDate', label: 'Fim', type: 'text', placeholder: 'MM/AAAA ou deixe vazio' },
                 { key: 'location', label: 'Local (Opcional)' }
               ])}
             </Section>

             <Section title="Educação" icon={GraduationCap} isOpen={openSection === 'education'} onToggle={() => toggleSection('education')} isVisible={data.settings.visibleSections.education} onVisibilityToggle={() => toggleVisibility('education')} onClear={() => clearList('education')} itemCount={data.education.length}>
               {renderGenericList('education', 'school', 'degree', { school: 'Instituição', degree: 'Curso' }, [
                 { key: 'school', label: 'Instituição' }, { key: 'degree', label: 'Grau/Curso' },
                 { key: 'startDate', label: 'Início' }, { key: 'endDate', label: 'Fim/Previsão' },
                 { key: 'location', label: 'Local (Opcional)' }
               ])}
             </Section>

             {/* ... Other sections omitted for brevity but should remain ... */}
             <Section title="Habilidades" icon={Sparkles} isOpen={openSection === 'skills'} onToggle={() => toggleSection('skills')} isVisible={data.settings.visibleSections.skills} onVisibilityToggle={() => toggleVisibility('skills')} onClear={() => clearList('skills')} itemCount={data.skills.length}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.skills.map((skill, index) => (
                    <div key={skill.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg flex flex-col gap-2 shadow-sm min-w-[140px]">
                       <div className="flex justify-between items-center w-full">
                           <input value={skill.name} onChange={(e) => handleListChange('skills', index, 'name', e.target.value)} className="bg-transparent text-sm font-medium w-full outline-none dark:text-slate-200 placeholder:text-slate-300" placeholder="Skill" />
                           <button onClick={() => removeItem('skills', index)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                       </div>
                       
                       {data.settings.skillStyle !== 'hidden' && data.settings.skillStyle !== 'tags' && (
                         <div className="flex gap-1">
                             {[1,2,3,4,5].map(level => (
                                 <button 
                                    key={level} 
                                    onClick={() => handleListChange('skills', index, 'level', level)}
                                    className={`w-4 h-1.5 rounded-full transition-colors ${level <= skill.level ? 'bg-trampo-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                                    title={`Nível ${level}/5`}
                                 />
                             ))}
                         </div>
                       )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                   <button onClick={() => addItem('skills', { id: Date.now().toString(), name: 'Nova Skill', level: 3 })} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 flex items-center gap-2 transition-all shadow-sm"><Plus size={16}/> Add Skill</button>
                   <button onClick={async () => { setLoadingAI('skills'); const s = await suggestSkills(data.personalInfo.jobTitle); if(s.length) addItem('skills', s.map(n => ({ id: Date.now()+Math.random().toString(), name: n, level: 3 })).pop()); else onShowToast("Preencha o cargo primeiro."); }} disabled={!data.personalInfo.jobTitle} className="px-4 py-2 border border-purple-100 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center gap-2 transition-all shadow-sm"><Sparkles size={16}/> Sugerir IA</button>
                </div>
             </Section>

             {/* Keep remaining sections like Publications, Interests, etc. */}
             <Section title="Publicações" icon={BookOpen} isOpen={openSection === 'publications'} onToggle={() => toggleSection('publications')} isVisible={data.settings.visibleSections.publications} onVisibilityToggle={() => toggleVisibility('publications')} onClear={() => clearList('publications')} itemCount={data.publications.length}>
               {renderGenericList('publications', 'title', 'publisher', { title: 'Título', publisher: 'Editora', date: '', url: '' }, [
                 { key: 'title', label: 'Título' }, { key: 'publisher', label: 'Editora/Veículo' }, { key: 'date', label: 'Data', type: 'text' }, { key: 'url', label: 'Link' }
               ])}
             </Section>

             <Section title="Interesses" icon={Smile} isOpen={openSection === 'interests'} onToggle={() => toggleSection('interests')} isVisible={data.settings.visibleSections.interests} onVisibilityToggle={() => toggleVisibility('interests')} onClear={() => clearList('interests')} itemCount={data.interests.length}>
                <div className="flex flex-wrap gap-2">
                   {data.interests.map((int, i) => (
                     <div key={int.id} className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
                       <input value={int.name} onChange={(e) => { const ints = [...data.interests]; ints[i].name = e.target.value; handleChangeWithHistory({...data, interests: ints}); }} className="bg-transparent text-sm w-32 outline-none dark:text-slate-200" placeholder="Interesse" />
                       <button onClick={() => { const ints = [...data.interests]; ints.splice(i, 1); handleChangeWithHistory({...data, interests: ints}); }} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                     </div>
                   ))}
                   <button onClick={() => handleChangeWithHistory({...data, interests: [...data.interests, {id: Date.now().toString(), name: 'Novo Interesse'}]})} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 transition-all">+ Add</button>
                </div>
             </Section>
             
             <Section title="Voluntariado" icon={Heart} isOpen={openSection === 'volunteer'} onToggle={() => toggleSection('volunteer')} isVisible={data.settings.visibleSections.volunteer} onVisibilityToggle={() => toggleVisibility('volunteer')} onClear={() => clearList('volunteer')}>
               {renderGenericList('volunteer', 'role', 'organization', { role: 'Voluntário', organization: 'ONG' }, [
                 { key: 'role', label: 'Função' }, { key: 'organization', label: 'Organização' }, { key: 'startDate', label: 'Período', type: 'text' }
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
                             <DebouncedInput label="Título" value={item.title} onChange={(v: string) => { const secs = [...data.customSections]; secs[sIndex].items[iIndex].title = v; handleChangeWithHistory({...data, customSections: secs}); }} />
                             <DebouncedInput label="Subtítulo" value={item.subtitle} onChange={(v: string) => { const secs = [...data.customSections]; secs[sIndex].items[iIndex].subtitle = v; handleChangeWithHistory({...data, customSections: secs}); }} />
                           </div>
                           <DebouncedTextarea 
                             id={`custom-${sIndex}-${iIndex}`}
                             value={item.description} 
                             onChange={(e: any) => { const secs = [...data.customSections]; secs[sIndex].items[iIndex].description = e.target.value; handleChangeWithHistory({...data, customSections: secs}); }} 
                             className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-200 outline-none focus:border-trampo-500" 
                             placeholder="Detalhes..."
                           />
                        </div>
                      ))}
                      <button onClick={() => { const secs = [...data.customSections]; secs[sIndex].items.push({ id: Date.now().toString(), title: 'Novo Item', subtitle: '', date: '', description: '' }); handleChangeWithHistory({...data, customSections: secs}); }} className="text-sm text-trampo-600 font-medium hover:underline mt-2 flex items-center gap-1"><Plus size={14}/> Adicionar Item</button>
                   </div>
                ))}
                <button onClick={() => handleChangeWithHistory({...data, customSections: [...data.customSections, { id: Date.now().toString(), name: 'Nova Seção', items: [] }]})} className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"><Plus size={18}/> Criar Seção Personalizada</button>
             </Section>
             
             <Section title="Projetos" icon={Code} isOpen={openSection === 'projects'} onToggle={() => toggleSection('projects')} isVisible={data.settings.visibleSections.projects} onVisibilityToggle={() => toggleVisibility('projects')} onClear={() => clearList('projects')} itemCount={data.projects.length}>
               {renderGenericList('projects', 'name', 'url', { name: 'Projeto', url: '' }, [{key:'name', label:'Nome do Projeto'}, {key:'url', label:'Link (URL)', placeholder: 'ex: github.com/projeto'}])}
             </Section>
             
             <Section title="Idiomas" icon={Languages} isOpen={openSection === 'languages'} onToggle={() => toggleSection('languages')} isVisible={data.settings.visibleSections.languages} onVisibilityToggle={() => toggleVisibility('languages')} onClear={() => clearList('languages')} itemCount={data.languages.length}>
                <div className="flex flex-wrap gap-2">
                   {data.languages.map((l, i) => (
                     <div key={i} className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
                       <input value={l} onChange={(e) => { const ls = [...data.languages]; ls[i] = e.target.value; handleChangeWithHistory({...data, languages: ls}); }} className="bg-transparent text-sm w-32 outline-none dark:text-slate-200" placeholder="Idioma" />
                       <button onClick={() => { const ls = [...data.languages]; ls.splice(i, 1); handleChangeWithHistory({...data, languages: ls}); }} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                     </div>
                   ))}
                   <button onClick={() => handleChangeWithHistory({...data, languages: [...data.languages, 'Novo Idioma']})} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 transition-all">+ Add</button>
                </div>
             </Section>

             {/* Settings Section */}
             <Section title="Configurações & Visual" icon={Settings} isOpen={openSection === 'settings'} onToggle={() => toggleSection('settings')}>
               <div className="space-y-5">
                 {/* Reused settings code... */}
                 <div className="grid grid-cols-2 gap-3">
                    <DebouncedInput label="Tam. Fonte" value={data.settings.fontScale} onChange={(v: string) => updateSettings('fontScale', v)} type="number" step="0.05" />
                    <DebouncedInput label="Margem" value={data.settings.marginScale} onChange={(v: string) => updateSettings('marginScale', v)} type="number" step="0.1" />
                    <DebouncedInput label="Espaçamento" value={data.settings.spacingScale} onChange={(v: string) => updateSettings('spacingScale', v)} type="number" step="0.1" />
                    <DebouncedInput label="Alt. Linha" value={data.settings.lineHeight} onChange={(v: string) => updateSettings('lineHeight', v)} type="number" step="0.1" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                         <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Padrão de Fundo</label>
                         <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.backgroundPattern} onChange={(e) => updateSettings('backgroundPattern', e.target.value)}>
                             <option value="none">Nenhum</option>
                             <option value="dots">Pontilhado</option>
                             <option value="grid">Grade (Grid)</option>
                             <option value="lines">Linhas Diagonais</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Efeito Glass</label>
                         <button onClick={() => updateSettings('glassmorphism', !data.settings.glassmorphism)} className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors flex items-center justify-between ${data.settings.glassmorphism ? 'bg-trampo-100 border-trampo-300 text-trampo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                             {data.settings.glassmorphism ? 'Ativado' : 'Desativado'}
                             {data.settings.glassmorphism ? <Eye size={16}/> : <EyeOff size={16}/>}
                         </button>
                     </div>
                 </div>

                 {/* Font Pairings */}
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Combinações de Fontes</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
                        {FONT_PAIRINGS.map((pair, idx) => (
                            <button key={idx} onClick={() => applyFontPairing(idx)} className="snap-start px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 whitespace-nowrap text-xs font-medium hover:border-trampo-500 hover:text-trampo-600 transition-colors shadow-sm">{pair.name}</button>
                        ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Fonte Título</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.headerFont} onChange={(e) => updateSettings('headerFont', e.target.value)}>
                        {AVAILABLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Fonte Corpo</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.bodyFont} onChange={(e) => updateSettings('bodyFont', e.target.value)}>
                        {AVAILABLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Formato Data</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.dateFormat} onChange={(e) => updateSettings('dateFormat', e.target.value)}>
                        <option value="MMM yyyy">jan 2023</option>
                        <option value="MM/yyyy">01/2023</option>
                        <option value="yyyy">2023</option>
                        <option value="full">Janeiro 2023</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Estilo Títulos</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.headerStyle} onChange={(e) => updateSettings('headerStyle', e.target.value)}>
                        <option value="simple">Simples</option>
                        <option value="underline">Sublinhado</option>
                        <option value="box">Caixa Preenchida</option>
                        <option value="left-bar">Barra Lateral</option>
                        <option value="gradient">Gradiente</option>
                      </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Visual Skills</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-trampo-500/20 outline-none" value={data.settings.skillStyle} onChange={(e) => updateSettings('skillStyle', e.target.value)}>
                        <option value="tags">Tags (Etiquetas)</option>
                        <option value="bar">Barra de Progresso</option>
                        <option value="dots">Pontos</option>
                        <option value="circles">Círculos</option>
                        <option value="hidden">Apenas Texto</option>
                      </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Alinhamento</label>
                        <div className="flex gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                            {['left', 'center', 'right'].map((align: any) => (
                                <button key={align} onClick={() => updateSettings('headerAlignment', align)} className={`flex-1 p-1.5 rounded flex justify-center ${data.settings.headerAlignment === align ? 'bg-white dark:bg-slate-700 shadow-sm text-trampo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <div className={`w-3 h-2 bg-current opacity-50 ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''} rounded-sm`}></div>
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Cor Principal</label>
                    <div className="flex gap-2 items-center mb-2">
                        <input type="color" value={data.settings.primaryColor || '#000000'} onChange={(e) => updateSettings('primaryColor', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer border-2 border-slate-200 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-800"/>
                    </div>
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

                 <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">Formato Foto</label>
                        <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-200 outline-none" value={data.settings.photoShape} onChange={(e) => updateSettings('photoShape', e.target.value)}>
                            <option value="square">Quadrado</option>
                            <option value="rounded">Arredondado</option>
                            <option value="circle">Círculo</option>
                        </select>
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                   <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none"><input type="checkbox" className="rounded text-trampo-600 focus:ring-trampo-500" checked={data.settings.showQrCode} onChange={(e) => updateSettings('showQrCode', e.target.checked)} /> QR Code LinkedIn</label>
                   <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none"><input type="checkbox" className="rounded text-trampo-600 focus:ring-trampo-500" checked={data.settings.compactMode} onChange={(e) => updateSettings('compactMode', e.target.checked)} /> Modo Compacto</label>
                   <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none"><input type="checkbox" className="rounded text-trampo-600 focus:ring-trampo-500" checked={data.settings.showDuration} onChange={(e) => updateSettings('showDuration', e.target.checked)} /> Mostrar Duração</label>
                   <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none"><input type="checkbox" className="rounded text-trampo-600 focus:ring-trampo-500" checked={data.settings.grayscale} onChange={(e) => updateSettings('grayscale', e.target.checked)} /> Modo P&B</label>
                   <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none"><input type="checkbox" className="rounded text-trampo-600 focus:ring-trampo-500" checked={data.settings.watermark} onChange={(e) => updateSettings('watermark', e.target.checked)} /> Marca d'água Rascunho</label>
                 </div>
                 
                 <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Traduzir Currículo (IA)</label>
                    <div className="flex gap-2">
                       <button onClick={() => handleTranslate('English')} disabled={!!loadingAI} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"><LangIcon size={14}/> English</button>
                       <button onClick={() => handleTranslate('Español')} disabled={!!loadingAI} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"><LangIcon size={14}/> Español</button>
                    </div>
                 </div>
               </div>
             </Section>

          </div>
        )}
        
        {activeTab === 'tools' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <h3 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-2"><Zap size={20}/> Ferramentas Extras</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400">Recursos poderosos para impulsionar sua candidatura.</p>
                </div>

                {/* Gap Analysis */}
                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                     <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Target size={16}/> Análise de Gaps (Skills Faltantes)</h4>
                     <p className="text-xs text-slate-500 mb-4">Descubra o que você precisa aprender para conquistar a vaga dos sonhos.</p>
                     <button onClick={() => setShowGapModal(true)} className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                         Identificar Gaps
                     </button>
                </div>

                {/* Existing Tools... */}
                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                     <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><MessageSquare size={16}/> Simulador de Entrevista</h4>
                     <button onClick={handleAIInterview} disabled={!!loadingAI} className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                         {loadingAI === 'interview' ? 'Gerando...' : 'Gerar Perguntas'}
                     </button>
                     {interviewQs && (
                         <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-200 dark:border-slate-800">
                             {interviewQs}
                         </div>
                     )}
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                     <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Linkedin size={16}/> Gerador de Headline LinkedIn</h4>
                     <button onClick={handleAIHeadline} disabled={!!loadingAI} className="w-full py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                         {loadingAI === 'headline' ? 'Criando...' : 'Criar Headlines'}
                     </button>
                     {linkedinHeadline && (
                         <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-200 dark:border-slate-800">
                             {linkedinHeadline}
                         </div>
                     )}
                </div>
            </div>
        )}

        {/* ... Other Tabs (Cover/ATS) ... */}
      </div>

      {/* TAILOR RESUME MODAL */}
      {showTailorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-trampo-50 to-white dark:from-slate-800 dark:to-slate-900">
                      <div>
                          <h3 className="font-bold text-lg text-trampo-700 dark:text-white flex items-center gap-2"><Sparkles size={20}/> Tailor Resume (IA)</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Reescreve seu currículo para a vaga.</p>
                      </div>
                      <button onClick={() => setShowTailorModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  <div className="p-4 flex-1 overflow-auto">
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Descrição da Vaga</label>
                      <textarea 
                          value={tailorJobDesc}
                          onChange={(e) => setTailorJobDesc(e.target.value)}
                          className="w-full h-48 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500/20 dark:bg-slate-800 dark:text-white resize-none"
                          placeholder="Cole aqui a descrição completa da vaga..."
                      />
                      <div className="mt-4 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                          <p className="text-xs text-amber-800 dark:text-amber-400">
                              ⚠️ A IA irá <strong>substituir</strong> seu Resumo Profissional e descrições de Experiência atuais. 
                              Recomendamos salvar um <strong>Perfil (Backup)</strong> antes de continuar.
                          </p>
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                      <button onClick={() => setShowTailorModal(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancelar</button>
                      <button onClick={handleTailorResume} disabled={!tailorJobDesc || !!loadingAI} className="px-5 py-2 bg-trampo-600 hover:bg-trampo-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-trampo-500/20 transition-all flex items-center gap-2">
                          {loadingAI === 'tailor' ? 'Processando...' : 'Adaptar Agora'} <Wand2 size={16}/>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* GAP ANALYSIS MODAL */}
      {showGapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Target size={20}/> Análise de Gaps</h3>
                      <button onClick={() => {setShowGapModal(false); setGapAnalysis(null);}} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  
                  {!gapAnalysis ? (
                    <div className="p-4">
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Descrição da Vaga</label>
                        <textarea 
                            value={gapJobDesc}
                            onChange={(e) => setGapJobDesc(e.target.value)}
                            className="w-full h-40 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500/20 dark:bg-slate-800 dark:text-white resize-none"
                            placeholder="Cole a vaga para descobrir o que falta no seu perfil..."
                        />
                        <button onClick={handleGapAnalysis} disabled={!gapJobDesc || !!loadingAI} className="mt-4 w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm">
                            {loadingAI === 'gap' ? 'Analisando...' : 'Identificar Gaps'}
                        </button>
                    </div>
                  ) : (
                    <div className="p-4 flex-1 overflow-auto custom-scrollbar">
                        <div className="space-y-4">
                            <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                                <h4 className="font-bold text-red-800 dark:text-red-300 text-sm mb-2 flex items-center gap-2"><AlertCircle size={16}/> Hard Skills Faltantes</h4>
                                <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-400 space-y-1">
                                    {gapAnalysis.missingHardSkills.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm mb-2 flex items-center gap-2"><Users size={16}/> Soft Skills Faltantes</h4>
                                <ul className="list-disc list-inside text-xs text-orange-700 dark:text-orange-400 space-y-1">
                                    {gapAnalysis.missingSoftSkills.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                                <h4 className="font-bold text-green-800 dark:text-green-300 text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> Sugestões de Melhoria</h4>
                                <ul className="list-disc list-inside text-xs text-green-700 dark:text-green-400 space-y-1">
                                    {gapAnalysis.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};
