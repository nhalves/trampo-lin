
import React from 'react';
import { Edit2, Eye, Briefcase, Linkedin, Bot, UserPlus, Save, RotateCcw, EyeOff, Sun, Moon, HelpCircle, Palette, Printer } from 'lucide-react';
import { ResumeData } from '../../types';

interface NavbarProps {
    resumeData: ResumeData;
    focusMode: boolean;
    showMobilePreview: boolean;
    setShowMobilePreview: (v: boolean) => void;
    setShowJobTracker: (v: boolean) => void;
    setShowLinkedinGenerator: (v: boolean) => void;
    setShowAISettings: (v: boolean) => void;
    showProfileMenu: boolean;
    setShowProfileMenu: (v: boolean) => void;
    handleOpenSaveProfile: () => void;
    savedProfiles: ResumeData[];
    loadProfile: (p: ResumeData) => void;
    deleteProfile: (id: string, e: React.MouseEvent) => void;
    togglePrivacyMode: () => void;
    toggleDarkMode: () => void;
    darkMode: boolean;
    setShowOnboarding: (v: boolean) => void;
    previewMode: 'resume' | 'cover';
    setPreviewMode: (v: 'resume' | 'cover') => void;
    showThemeSelector: boolean;
    setShowThemeSelector: (v: boolean) => void;
    setIsPrinting: (v: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = (props) => {
    if (props.focusMode) return null;

    return (
        <nav id="app-navbar" className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 shadow-sm z-50 flex-shrink-0 animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-trampo-500 to-trampo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-trampo-500/20 transform hover:rotate-3 transition-transform cursor-default select-none">T</div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white hidden md:inline select-none">Trampo-lin</span>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Mobile Preview Toggle */}
              <button aria-label="Toggle Mobile Preview" onClick={() => props.setShowMobilePreview(!props.showMobilePreview)} className="md:hidden p-2 rounded-lg bg-trampo-50 dark:bg-slate-800 text-trampo-600 dark:text-slate-300 font-bold text-xs active:scale-95 transition-transform">
                  {props.showMobilePreview ? <Edit2 size={18}/> : <Eye size={18}/>}
              </button>
              
              <button aria-label="Open Job Tracker" onClick={() => props.setShowJobTracker(true)} className="hidden sm:flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-sm font-medium" title="Gerenciar Vagas">
                  <Briefcase size={18}/> <span className="hidden lg:inline">Vagas</span>
              </button>

              <button aria-label="Open LinkedIn Generator" onClick={() => props.setShowLinkedinGenerator(true)} className="hidden sm:flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95 border border-transparent hover:border-blue-100 dark:hover:border-blue-900 text-sm font-medium" title="Gerador de Perfil LinkedIn">
                  <Linkedin size={18}/> <span className="hidden lg:inline">LinkedIn</span>
              </button>

              <button aria-label="AI Settings" onClick={() => props.setShowAISettings(true)} className="p-2.5 rounded-xl transition-all active:scale-95 text-slate-500 hover:text-trampo-600 hover:bg-trampo-50 dark:hover:bg-trampo-900/10" title="Configurar IA"><Bot size={20}/></button>
              
              <div className="relative">
                <button aria-label="Profile Menu" onClick={() => props.setShowProfileMenu(!props.showProfileMenu)} className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 text-sm font-medium transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Gerenciar Perfis">
                  <UserPlus size={18} /> <span className="hidden lg:inline truncate max-w-[120px]">{props.resumeData.profileName || 'Meu Currículo'}</span>
                </button>
                {props.showProfileMenu && (
                  <div className="absolute top-14 right-0 w-64 bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl p-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        <button onClick={props.handleOpenSaveProfile} className="w-full text-left p-2.5 text-xs font-bold hover:bg-trampo-50 dark:hover:bg-trampo-900/20 rounded-lg flex gap-2 items-center text-trampo-600 dark:text-trampo-400 mb-2 border border-dashed border-trampo-200 dark:border-trampo-800 transition-colors"><Save size={14}/> SALVAR VERSÃO ATUAL</button>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-2">Salvos</div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                            {props.savedProfiles.map(p => (
                            <div key={p.id} className="flex group">
                                <button onClick={() => props.loadProfile(p)} className="flex-1 text-left p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 rounded-l-lg truncate text-slate-600 dark:text-slate-300 font-medium transition-colors">{p.profileName}</button>
                                <button aria-label="Delete Profile" onClick={(e) => props.deleteProfile(p.id!, e)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 hover:text-red-500 rounded-r-lg transition-colors"><RotateCcw size={12} className="rotate-45"/></button>
                            </div>
                            ))}
                            {props.savedProfiles.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Nenhum perfil salvo.</p>}
                        </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
              <button aria-label="Privacy Mode" onClick={props.togglePrivacyMode} className={`p-2.5 rounded-xl transition-all active:scale-95 ${props.resumeData.settings.privacyMode ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Modo Privacidade (Blur)"><EyeOff size={18}/></button>
              <button aria-label="Toggle Dark Mode" onClick={props.toggleDarkMode} className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95">{props.darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
              <button aria-label="Onboarding" onClick={() => props.setShowOnboarding(true)} className="hidden sm:block p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95" title="Ajuda"><HelpCircle size={18}/></button>
              <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => props.setPreviewMode('resume')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${props.previewMode === 'resume' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>CV</button>
                  <button onClick={() => props.setPreviewMode('cover')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${props.previewMode === 'cover' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>CARTA</button>
              </div>
              <button aria-label="Theme Selector" onClick={() => props.setShowThemeSelector(!props.showThemeSelector)} className={`p-2.5 rounded-xl transition-all active:scale-95 ${props.showThemeSelector ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'text-slate-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'}`} title="Temas"><Palette size={20}/></button>
              <button onClick={() => props.setIsPrinting(true)} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/5 transition-all active:scale-95" title="Baixar PDF (Ctrl+P)"><Printer size={18}/> <span>Baixar</span></button>
            </div>
        </nav>
    );
};
