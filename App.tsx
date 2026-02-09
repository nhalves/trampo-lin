import React, { useState, useRef, useEffect } from 'react';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { ResumeData, ThemeId } from './types';
import { INITIAL_RESUME, THEMES } from './constants';
import { Printer, Download, Upload, RotateCcw, Palette, Layout, Moon, Sun, Save, FileText, ZoomIn, ZoomOut, UserPlus } from 'lucide-react';

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-slide-in">{message}</div>;
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Load Logic
  useEffect(() => {
    const saved = localStorage.getItem('trampolin_data');
    if (saved) setResumeData(JSON.parse(saved));
    const profiles = localStorage.getItem('trampolin_profiles');
    if (profiles) setSavedProfiles(JSON.parse(profiles));
    const dark = localStorage.getItem('trampolin_dark');
    if (dark === 'true') { setDarkMode(true); document.documentElement.classList.add('dark'); }
  }, []);

  // Save Logic
  useEffect(() => {
    localStorage.setItem('trampolin_data', JSON.stringify(resumeData));
  }, [resumeData]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('trampolin_dark', (!darkMode).toString());
  };

  const saveProfile = () => {
    const name = prompt("Nome para este perfil (ex: Dev Fullstack):", resumeData.profileName);
    if (!name) return;
    const newProfile = { ...resumeData, id: Date.now().toString(), profileName: name };
    const newProfiles = [...savedProfiles, newProfile];
    setSavedProfiles(newProfiles);
    localStorage.setItem('trampolin_profiles', JSON.stringify(newProfiles));
    setResumeData(newProfile);
    setToastMessage(`Perfil "${name}" salvo!`);
  };

  const loadProfile = (profile: ResumeData) => {
    if (confirm(`Carregar perfil "${profile.profileName}"? Dados não salvos serão perdidos.`)) {
      setResumeData(profile);
      setShowProfileMenu(false);
    }
  };

  const handleExportTxt = () => {
    const txt = `
${resumeData.personalInfo.fullName.toUpperCase()}
${resumeData.personalInfo.jobTitle}
${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.linkedin}

RESUMO
${resumeData.personalInfo.summary}

EXPERIÊNCIA
${resumeData.experience.map(e => `${e.role} em ${e.company} (${e.startDate} - ${e.current ? 'Atual' : e.endDate})\n${e.description}`).join('\n\n')}

EDUCAÇÃO
${resumeData.education.map(e => `${e.degree} em ${e.school}`).join('\n')}

SKILLS
${resumeData.skills.map(s => s.name).join(', ')}
    `;
    const blob = new Blob([txt], { type: "text/plain" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `curriculo-${resumeData.personalInfo.fullName}.txt`;
    link.click();
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-trampo-50 dark:bg-slate-900 flex flex-col font-sans text-slate-800 dark:text-slate-200 transition-colors">
      {/* Navbar */}
      <nav className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-50 print:hidden sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-trampo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">T</div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white hidden md:inline">Trampo-lin</span>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Profile Manager */}
           <div className="relative">
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-1" title="Perfis Salvos">
               <UserPlus size={18} /> <span className="text-xs hidden sm:inline">{resumeData.profileName || 'Perfil'}</span>
             </button>
             {showProfileMenu && (
               <div className="absolute top-10 right-0 w-48 bg-white dark:bg-slate-800 shadow-xl border dark:border-slate-700 rounded-lg p-2 z-50">
                 <button onClick={saveProfile} className="w-full text-left p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex gap-2"><Save size={14}/> Salvar Atual como Novo</button>
                 <div className="h-px bg-slate-200 my-1"></div>
                 {savedProfiles.map(p => (
                   <button key={p.id} onClick={() => loadProfile(p)} className="w-full text-left p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded truncate">{p.profileName}</button>
                 ))}
               </div>
             )}
           </div>

           <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
           <button onClick={() => setPreviewMode(previewMode === 'resume' ? 'cover' : 'resume')} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-bold text-xs">{previewMode === 'resume' ? 'CV' : 'CARTA'}</button>
           
           <div className="w-px h-6 bg-slate-200 mx-1"></div>
           
           <button onClick={handleExportTxt} className="p-2 text-slate-500 hover:text-blue-500 rounded" title="Exportar TXT"><FileText size={18}/></button>
           <button onClick={() => setShowThemeSelector(!showThemeSelector)} className="p-2 text-slate-500 hover:text-purple-500 rounded" title="Temas"><Palette size={18}/></button>
           <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-trampo-600 hover:bg-trampo-700 text-white rounded text-sm font-medium shadow-sm"><Printer size={16}/> <span className="hidden sm:inline">PDF</span></button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="w-full md:w-[450px] lg:w-[500px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full overflow-y-auto print:hidden z-10 flex-shrink-0">
            <Editor data={resumeData} onChange={setResumeData} onShowToast={setToastMessage} />
        </div>

        <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-y-auto p-4 md:p-8 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible relative">
          
          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 print:hidden z-40">
             <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 bg-white dark:bg-slate-800 shadow rounded-full"><ZoomIn size={20}/></button>
             <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))} className="p-2 bg-white dark:bg-slate-800 shadow rounded-full"><ZoomOut size={20}/></button>
          </div>

          {showThemeSelector && (
            <div className="absolute top-4 left-4 right-4 md:left-[520px] md:right-8 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 z-40 animate-slide-in print:hidden">
               <div className="flex justify-between items-center mb-4 text-slate-800 dark:text-white"><h3 className="font-bold">Temas</h3><button onClick={() => setShowThemeSelector(false)}>✕</button></div>
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                 {THEMES.map(theme => (
                   <button key={theme.id} onClick={() => setActiveThemeId(theme.id)} className={`text-left border-2 rounded-lg p-3 hover:shadow-md transition-all ${activeThemeId === theme.id ? 'border-trampo-500' : 'border-slate-100 dark:border-slate-700'}`}>
                     <div className="w-full h-8 bg-slate-100 dark:bg-slate-700 rounded mb-2 overflow-hidden relative"><div className="absolute inset-0 opacity-50" style={{backgroundColor: theme.colors.primary}}></div></div>
                     <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">{theme.name}</div>
                   </button>
                 ))}
               </div>
            </div>
          )}

          <div ref={printRef} className={`bg-white shadow-2xl print:shadow-none min-h-[297mm] flex-shrink-0 origin-top transition-transform print:scale-100 print:w-full print:h-full ${resumeData.settings.paperSize === 'letter' ? 'w-[216mm]' : 'w-[210mm]'}`}>
            <Preview data={resumeData} theme={THEMES.find(t => t.id === activeThemeId) || THEMES[0]} mode={previewMode} zoom={zoom} />
          </div>
        </div>
      </main>
      
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;