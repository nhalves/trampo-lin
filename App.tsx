
import React, { useState, useRef, useEffect } from 'react';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { ResumeData, ThemeId } from './types';
import { INITIAL_RESUME, THEMES } from './constants';
import { Printer, Download, Upload, RotateCcw, Palette, Layout, Moon, Sun, Save, FileText, ZoomIn, ZoomOut, UserPlus } from 'lucide-react';

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl text-sm font-medium z-50 animate-slide-in flex items-center gap-2">{message}</div>;
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
    
    // Initial Zoom based on screen width
    if (window.innerWidth < 768) setZoom(0.45);
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
    <div className="h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-200 overflow-hidden">
      {/* Navbar */}
      <nav className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 shadow-sm z-50 print:hidden flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-trampo-500 to-trampo-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-trampo-500/20">T</div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-800 dark:text-white hidden md:inline">Trampo-lin</span>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
           {/* Profile Manager */}
           <div className="relative">
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Perfis Salvos">
               <UserPlus size={16} /> <span className="hidden sm:inline truncate max-w-[100px]">{resumeData.profileName || 'Perfil'}</span>
             </button>
             {showProfileMenu && (
               <div className="absolute top-12 right-0 w-56 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-xl p-2 z-50 animate-in slide-in-from-top-2 duration-200">
                 <button onClick={saveProfile} className="w-full text-left p-2.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex gap-2 items-center text-trampo-600 dark:text-trampo-400"><Save size={14}/> Salvar Perfil Atual</button>
                 <div className="h-px bg-slate-100 dark:bg-slate-700 my-1.5"></div>
                 <div className="max-h-60 overflow-y-auto custom-scrollbar">
                     {savedProfiles.map(p => (
                       <button key={p.id} onClick={() => loadProfile(p)} className="w-full text-left p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg truncate text-slate-600 dark:text-slate-300">{p.profileName}</button>
                     ))}
                     {savedProfiles.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Nenhum perfil salvo.</p>}
                 </div>
               </div>
             )}
           </div>

           <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
           
           <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

           <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
               <button onClick={() => setPreviewMode('resume')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewMode === 'resume' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>CV</button>
               <button onClick={() => setPreviewMode('cover')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewMode === 'cover' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>CARTA</button>
           </div>
           
           <button onClick={() => setShowThemeSelector(!showThemeSelector)} className={`p-2 rounded-lg transition-colors ${showThemeSelector ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'text-slate-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'}`} title="Temas"><Palette size={18}/></button>
           <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-slate-900/20 transition-all active:scale-95"><Printer size={16}/> <span className="hidden sm:inline">Baixar PDF</span></button>
        </div>
      </nav>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Editor Sidebar */}
        <div className="w-full md:w-[480px] lg:w-[520px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full overflow-hidden print:hidden z-10 flex-shrink-0 shadow-xl">
            <Editor data={resumeData} onChange={setResumeData} onShowToast={setToastMessage} />
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-slate-100/50 dark:bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center print:p-0 print:bg-white print:overflow-visible">
          
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className="w-full h-full overflow-auto flex items-start justify-center p-8 md:p-12 custom-scrollbar relative z-10">
              {showThemeSelector && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-50 animate-in slide-in-from-top-4 duration-300 w-[90%] max-w-3xl">
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

              {/* Resume Paper Container */}
              <div ref={printRef} className={`relative flex-shrink-0 transition-transform duration-300 print:scale-100 print:w-full print:h-full ${resumeData.settings.paperSize === 'letter' ? 'w-[216mm] min-h-[279mm]' : 'w-[210mm] min-h-[297mm]'}`}>
                <Preview data={resumeData} theme={THEMES.find(t => t.id === activeThemeId) || THEMES[0]} mode={previewMode} zoom={zoom} />
              </div>
          </div>

          {/* Floating Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 print:hidden z-40">
             <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300" title="Zoom Out"><ZoomOut size={18}/></button>
             <span className="text-xs font-bold w-12 text-center tabular-nums text-slate-600 dark:text-slate-300">{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300" title="Zoom In"><ZoomIn size={18}/></button>
             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
             <button onClick={() => setZoom(0.8)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300" title="Reset"><RotateCcw size={16}/></button>
          </div>

        </div>
      </main>
      
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;
