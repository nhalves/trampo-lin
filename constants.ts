
import { ResumeData, ThemeConfig } from './types';

export const INITIAL_RESUME: ResumeData = {
  id: 'default',
  profileName: 'Meu Currículo Principal',
  personalInfo: {
    fullName: 'Ana Silva',
    jobTitle: 'Gerente de Produto Sênior',
    email: 'ana.silva@exemplo.com',
    phone: '(11) 99999-8888',
    address: 'São Paulo, SP',
    website: 'anasilva.dev',
    linkedin: 'linkedin.com/in/anasilva',
    github: 'github.com/anasilva',
    twitter: '',
    behance: '',
    dribbble: '',
    medium: '',
    photoUrl: '',
    summary: 'Gerente de Produto com mais de 8 anos de experiência liderando equipes ágeis e lançando produtos digitais de sucesso. Especialista em estratégia de produto, design thinking e análise de dados para otimização de conversão. Apaixonada por criar soluções centradas no usuário.',
  },
  coverLetter: {
    recipientName: 'Gestor de Contratação',
    companyName: '',
    jobTitle: '',
    content: ''
  },
  experience: [
    {
      id: '1',
      role: 'Head de Produto',
      company: 'TechFlow Solutions',
      location: 'São Paulo, SP',
      startDate: '2021-03',
      endDate: '',
      current: true,
      description: 'Lidero uma equipe de 15 PMs e Designers. Aumentei a receita recorrente em 40% através do lançamento de novas features estratégicas. Implementei cultura de discovery contínuo.',
    },
    {
      id: '2',
      role: 'Product Owner',
      company: 'InovaSoft',
      location: 'Rio de Janeiro, RJ',
      startDate: '2018-01',
      endDate: '2021-02',
      current: false,
      description: 'Responsável pelo ciclo de vida do aplicativo móvel. Gerenciei backlog, priorização e roadmap. Reduzi o churn em 15% melhorando a experiência de onboarding.',
    }
  ],
  education: [
    {
      id: '1',
      school: 'Universidade de São Paulo (USP)',
      degree: 'Bacharelado em Administração',
      location: 'São Paulo',
      startDate: '2013-02',
      endDate: '2017-12',
      description: 'Foco em Marketing e Estratégia.'
    }
  ],
  projects: [],
  certifications: [],
  volunteer: [],
  awards: [],
  references: [],
  customSections: [],
  skills: [
    { id: '1', name: 'Gestão de Produto', level: 5 },
    { id: '2', name: 'Scrum & Agile', level: 5 },
    { id: '3', name: 'Figma', level: 4 },
  ],
  languages: ['Português (Nativo)', 'Inglês (Fluente)'],
  settings: {
    fontScale: 1,
    spacingScale: 1,
    marginScale: 1,
    sectionOrder: ['experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'volunteer', 'awards', 'references', 'custom'],
    visibleSections: {
      experience: true,
      education: true,
      projects: true,
      certifications: true,
      skills: true,
      languages: true,
      summary: true,
      volunteer: true,
      awards: true,
      references: true,
      custom: true
    },
    paperSize: 'a4',
    dateFormat: 'MMM yyyy',
    headerFont: 'font-sans',
    bodyFont: 'font-sans',
    headerStyle: 'simple',
    skillStyle: 'tags',
    showQrCode: false,
    compactMode: false,
    showDuration: true
  }
};

export const THEMES: ThemeConfig[] = [
  // --- NOVOS TEMAS DIFERENCIADOS ---
  {
    id: 'timeline-pro',
    name: 'Timeline Pro',
    description: 'Conecta suas experiências com uma linha do tempo elegante.',
    colors: { primary: '#2563eb', secondary: '#64748b', text: '#334155', bg: '#ffffff', accent: '#3b82f6' },
    layout: 'sidebar-left' // Usará lógica customizada no Preview
  },
  {
    id: 'swiss-grid',
    name: 'Swiss Grid',
    description: 'Tipografia forte, inspirado no Estilo Internacional. Grade rígida.',
    colors: { primary: '#dc2626', secondary: '#171717', text: '#000000', bg: '#ffffff', accent: '#dc2626' },
    layout: 'grid-complex'
  },
  {
    id: 'geometric-pop',
    name: 'Geometric Pop',
    description: 'Formas sutis ao fundo para um visual criativo e moderno.',
    colors: { primary: '#4f46e5', secondary: '#818cf8', text: '#312e81', bg: '#eef2ff', accent: '#6366f1' },
    layout: 'sidebar-right'
  },
  {
    id: 'studio-minimal',
    name: 'Studio Minimal',
    description: 'Absolutamente limpo. Muito espaço em branco. Sofisticado.',
    colors: { primary: '#000000', secondary: '#737373', text: '#171717', bg: '#ffffff', accent: '#404040' },
    layout: 'single-column'
  },
  {
    id: 'tech-dark',
    name: 'Tech Terminal',
    description: 'Estilo inspirado em editores de código. Fundo escuro.',
    colors: { primary: '#4ade80', secondary: '#94a3b8', text: '#e2e8f0', bg: '#0f172a', accent: '#22c55e' },
    layout: 'single-column'
  },

  // --- CLÁSSICOS ---
  {
    id: 'modern-slate',
    name: 'Moderno Slate',
    description: 'O padrão da indústria. Limpo e eficaz.',
    colors: { primary: '#334155', secondary: '#94a3b8', text: '#1e293b', bg: '#ffffff', accent: '#3b82f6' },
    layout: 'sidebar-left'
  },
  {
    id: 'ats-clean',
    name: 'ATS Friendly',
    description: 'Otimizado para leitura de robôs. Sem colunas.',
    colors: { primary: '#000000', secondary: '#4b5563', text: '#000000', bg: '#ffffff', accent: '#000000' },
    layout: 'single-column'
  },
  {
    id: 'classic-serif',
    name: 'Clássico Serif',
    description: 'Tradicional, ideal para áreas jurídicas e acadêmicas.',
    colors: { primary: '#111827', secondary: '#4b5563', text: '#000000', bg: '#ffffff', accent: '#000000' },
    layout: 'stacked'
  },
  {
    id: 'executive-blue',
    name: 'Executivo',
    description: 'Banner no topo. Autoridade e confiança.',
    colors: { primary: '#1e3a8a', secondary: '#60a5fa', text: '#1e293b', bg: '#eff6ff', accent: '#2563eb' },
    layout: 'banner'
  },
  {
    id: 'creative-coral',
    name: 'Criativo',
    description: 'Ousado e vibrante para designers.',
    colors: { primary: '#be123c', secondary: '#fb7185', text: '#374151', bg: '#fff1f2', accent: '#f43f5e' },
    layout: 'sidebar-right'
  },
  {
    id: 'minimal-mono',
    name: 'Dev Mono',
    description: 'Fonte monoespaçada. Estilo técnico.',
    colors: { primary: '#404040', secondary: '#a3a3a3', text: '#171717', bg: '#ffffff', accent: '#737373' },
    layout: 'stacked'
  }
];

export const AVAILABLE_FONTS = [
  { name: 'Inter (Padrão)', value: 'font-sans' },
  { name: 'Merriweather (Serifa)', value: 'font-serif' },
  { name: 'Roboto Mono (Code)', value: 'font-mono' },
  { name: 'Poppins (Display)', value: 'font-display' },
  { name: 'Lato', value: 'font-lato' },
  { name: 'Open Sans', value: 'font-open' },
  { name: 'Montserrat', value: 'font-montserrat' },
  { name: 'Raleway', value: 'font-raleway' },
];
