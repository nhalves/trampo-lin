
import React from 'react';
import { Edit2, Eye, Briefcase, Bot, UserPlus, Save, Trash2, EyeOff, Sun, Moon, HelpCircle, Palette, Printer, ChevronDown, LinkedinIcon, Share2, Trophy, Command } from 'lucide-react';
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
  // v4 optional props
  onShare?: () => void;
  onShowBadges?: () => void;
  onOpenCommandPalette?: () => void;
  earnedBadgesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = (props) => {
  if (props.focusMode) return null;

  return (
    <header
      id="app-navbar"
      className="h-16 flex-shrink-0 z-50 flex items-center justify-between px-4 lg:px-6
                       bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
                       border-b border-slate-200/80 dark:border-slate-800/80
                       shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_2px_12px_rgba(0,0,0,0.04)]
                       dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)]"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 select-none">
        <div className="relative w-8 h-8 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-trampo-400 to-trampo-700 rounded-[10px] shadow-md shadow-trampo-500/30 hover:scale-110 transition-transform duration-200 cursor-default" />
          <span className="absolute inset-0 flex items-center justify-center text-white font-black text-base leading-none">T</span>
        </div>
        <div className="hidden md:flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-[15px] tracking-tight text-slate-900 dark:text-white">Trampo-lin</span>
            <span className="px-1.5 py-0.5 rounded-md bg-trampo-100 dark:bg-trampo-900/30 text-[9px] font-bold text-trampo-700 dark:text-trampo-300">v4.0</span>
          </div>
          <span className="text-[10px] text-trampo-500 font-semibold tracking-wider uppercase">Currículo Pro</span>
        </div>
      </div>

      {/* ── Centro: Toggle CV/Carta ── */}
      <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-0.5 shadow-inner">
        <button
          onClick={() => props.setPreviewMode('resume')}
          className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 active:scale-95
                        ${props.previewMode === 'resume'
              ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/[0.06] dark:ring-white/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
          CV
        </button>
        <button
          onClick={() => props.setPreviewMode('cover')}
          className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 active:scale-95
                        ${props.previewMode === 'cover'
              ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/[0.06] dark:ring-white/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
          CARTA
        </button>
      </div>

      {/* ── Direita: Ações ── */}
      <div className="flex items-center gap-1 lg:gap-1.5">

        {/* Mobile: toggle editor/preview */}
        <button
          aria-label="Alternar visão mobile"
          onClick={() => props.setShowMobilePreview(!props.showMobilePreview)}
          className="md:hidden p-2 rounded-lg bg-trampo-50 dark:bg-slate-800 text-trampo-600 dark:text-slate-300 active:scale-95 transition-all"
        >
          {props.showMobilePreview ? <Edit2 size={18} /> : <Eye size={18} />}
        </button>

        {/* Separador */}
        <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Vagas */}
        <NavBtn
          label="Vagas"
          title="Gerenciar Vagas (Job Tracker)"
          onClick={() => props.setShowJobTracker(true)}
          icon={<Briefcase size={16} />}
          className="hidden sm:flex"
        />

        {/* Compartilhar */}
        {props.onShare && (
          <button
            aria-label="Compartilhar currículo"
            title="Gerar link de compartilhamento"
            onClick={props.onShare}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/40 transition-all active:scale-95"
          >
            <Share2 size={14} /> Compartilhar
          </button>
        )}

        {/* Conquistas (Badges) */}
        {props.onShowBadges && (
          <button
            aria-label="Minhas conquistas"
            title="Ver conquistas desbloqueadas"
            onClick={props.onShowBadges}
            className="relative p-2 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all active:scale-95"
          >
            <Trophy size={18} />
            {(props.earnedBadgesCount ?? 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {props.earnedBadgesCount}
              </span>
            )}
          </button>
        )}

        {/* Command Palette */}
        {props.onOpenCommandPalette && (
          <button
            aria-label="Paleta de comandos"
            title="Abrir paleta de comandos (⌘K)"
            onClick={props.onOpenCommandPalette}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
          >
            <Command size={13} /> <span className="text-[10px]">K</span>
          </button>
        )}

        {/* LinkedIn */}
        <NavBtn
          label="LinkedIn"
          title="Gerar Perfil LinkedIn com IA"
          onClick={() => props.setShowLinkedinGenerator(true)}
          icon={<LinkedinIcon size={16} />}
          className="hidden lg:flex text-blue-600 dark:text-blue-400 hover:!bg-blue-50 dark:hover:!bg-blue-900/20 hover:!text-blue-700"
        />

        {/* IA Config */}
        <button
          aria-label="Configurar IA"
          title="Configurações de IA"
          onClick={() => props.setShowAISettings(true)}
          className="p-2 rounded-xl text-slate-500 hover:text-trampo-600 hover:bg-trampo-50 dark:hover:bg-trampo-900/20 dark:hover:text-trampo-400 transition-all active:scale-95"
        >
          <Bot size={18} />
        </button>

        {/* Tema */}
        <button
          aria-label="Selecionar Tema"
          title="Temas visuais"
          onClick={() => props.setShowThemeSelector(!props.showThemeSelector)}
          className={`p-2 rounded-xl transition-all active:scale-95
                        ${props.showThemeSelector
              ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
              : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20'
            }`}
        >
          <Palette size={18} />
        </button>

        {/* Privacidade */}
        <button
          aria-label={props.resumeData.settings.privacyMode ? 'Desativar modo privacidade' : 'Ativar modo privacidade'}
          title={props.resumeData.settings.privacyMode ? 'Modo Privacidade ativo — clique para desativar' : 'Ativar Modo Privacidade'}
          onClick={props.togglePrivacyMode}
          className={`p-2 rounded-xl transition-all active:scale-95
                        ${props.resumeData.settings.privacyMode
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <EyeOff size={18} />
        </button>

        {/* Dark mode */}
        <button
          aria-label="Alternar modo escuro"
          title={props.darkMode ? 'Modo claro' : 'Modo escuro'}
          onClick={props.toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
        >
          {props.darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Ajuda */}
        <button
          aria-label="Ajuda / Tutorial"
          title="Ver tutorial"
          onClick={() => props.setShowOnboarding(true)}
          className="hidden sm:block p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
        >
          <HelpCircle size={16} />
        </button>

        {/* Separador */}
        <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Perfis */}
        <div className="relative">
          <button
            aria-label="Gerenciar perfis"
            title="Perfis salvos"
            onClick={() => props.setShowProfileMenu(!props.showProfileMenu)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                                   text-slate-600 dark:text-slate-300
                                   hover:bg-slate-100 dark:hover:bg-slate-800
                                   border border-transparent hover:border-slate-200 dark:hover:border-slate-700
                                   transition-all active:scale-95"
          >
            <UserPlus size={15} />
            <span className="hidden lg:inline max-w-[90px] truncate text-xs">
              {props.resumeData.profileName || 'Meu Currículo'}
            </span>
            <ChevronDown size={13} className={`transition-transform duration-200 ${props.showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {props.showProfileMenu && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-64
                                        bg-white dark:bg-slate-800
                                        shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
                                        border border-slate-200/80 dark:border-slate-700/80
                                        rounded-2xl overflow-hidden z-50 animate-scale-in">

              <div className="p-2">
                <button
                  onClick={props.handleOpenSaveProfile}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold
                                               text-trampo-600 dark:text-trampo-400
                                               hover:bg-trampo-50 dark:hover:bg-trampo-900/20
                                               rounded-xl border border-dashed border-trampo-200 dark:border-trampo-800
                                               transition-all active:scale-[0.98]"
                >
                  <Save size={13} /> SALVAR VERSÃO ATUAL
                </button>
              </div>

              {props.savedProfiles.length > 0 && (
                <>
                  <div className="px-4 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salvos</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto px-2 pb-2 space-y-0.5">
                    {props.savedProfiles.map(p => (
                      <div key={p.id} className="flex items-center group rounded-xl overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <button
                          onClick={() => props.loadProfile(p)}
                          className="flex-1 text-left px-3 py-2 min-w-0"
                        >
                          <span className="block text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{p.profileName}</span>
                          {(p as any).createdAt && (
                            <span className="text-[10px] text-slate-400">
                              {new Date((p as any).createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </button>
                        <button
                          aria-label="Excluir perfil"
                          onClick={(e) => props.deleteProfile(p.id!, e)}
                          className="p-2 mr-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {props.savedProfiles.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 pb-5 italic">Nenhum perfil salvo.</p>
              )}
            </div>
          )}
        </div>

        {/* CTA: Imprimir */}
        <button
          onClick={() => props.setIsPrinting(true)}
          title="Imprimir / Baixar PDF (Ctrl+P)"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
                               bg-gradient-to-b from-slate-800 to-slate-900
                               dark:from-white dark:to-slate-100
                               text-white dark:text-slate-900
                               shadow-md shadow-slate-900/20 dark:shadow-black/20
                               hover:shadow-lg hover:shadow-slate-900/30
                               hover:from-slate-700 hover:to-slate-800
                               dark:hover:from-slate-100 dark:hover:to-white
                               transition-all duration-200 active:scale-95 active:shadow-sm"
        >
          <Printer size={16} />
          <span>PDF</span>
        </button>
      </div>
    </header>
  );
};

// ── Helper: botão de nav ──────────────────────────────────────────
interface NavBtnProps {
  label: string;
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
}
const NavBtn: React.FC<NavBtnProps> = ({ label, title, onClick, icon, className = '' }) => (
  <button
    title={title}
    onClick={onClick}
    className={`items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                   text-xs font-medium text-slate-600 dark:text-slate-300
                   hover:bg-slate-100 dark:hover:bg-slate-800
                   border border-transparent hover:border-slate-200 dark:hover:border-slate-700
                   transition-all active:scale-95 ${className}`}
  >
    {icon}
    <span className="hidden xl:inline">{label}</span>
  </button>
);
