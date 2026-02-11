
import { ResumeData, ThemeConfig } from './types';

export const INITIAL_RESUME: ResumeData = {
  id: 'default',
  profileName: 'Meu Currículo Principal',
  personalInfo: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
    behance: '',
    dribbble: '',
    medium: '',
    photoUrl: '',
    summary: '',
  },
  coverLetter: {
    recipientName: 'Gestor de Contratação',
    companyName: '',
    jobTitle: '',
    content: ''
  },
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  volunteer: [],
  awards: [],
  references: [],
  customSections: [],
  skills: [],
  languages: [],
  settings: {
    fontScale: 1,
    spacingScale: 1,
    marginScale: 1,
    lineHeight: 1.5,
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
    headerAlignment: 'left',
    photoShape: 'rounded',
    skillStyle: 'tags',
    showQrCode: false,
    compactMode: false,
    showDuration: true,
    grayscale: false,
    privacyMode: false,
    aiTone: 'professional'
  }
};

export const EXAMPLE_PERSONAS: ResumeData[] = [
    {
        ...INITIAL_RESUME,
        id: 'dev-example',
        profileName: 'Exemplo: Desenvolvedor Fullstack',
        personalInfo: {
            fullName: 'Lucas Oliveira',
            jobTitle: 'Senior Fullstack Developer',
            email: 'lucas.dev@email.com',
            phone: '(11) 98765-4321',
            address: 'São Paulo, SP',
            website: 'lucas.dev.br',
            linkedin: 'linkedin.com/in/lucasdev',
            github: 'github.com/lucasdev',
            twitter: 'x.com/lucascode',
            behance: '',
            dribbble: '',
            medium: 'medium.com/@lucasdev',
            photoUrl: '',
            summary: 'Desenvolvedor Fullstack com 6 anos de experiência em React, Node.js e arquitetura de microsserviços. Apaixonado por código limpo, performance e UX. Liderei a migração de sistemas legados para arquiteturas modernas em nuvem, reduzindo custos em 30%.',
        },
        experience: [
            { id: '1', role: 'Tech Lead', company: 'Fintech X', location: 'Remoto', startDate: '2021-06', endDate: '', current: true, description: 'Lidero uma equipe de 8 desenvolvedores. Responsável pela arquitetura de novas features e code review. Implementei CI/CD que reduziu tempo de deploy em 50%.' },
            { id: '2', role: 'Frontend Developer', company: 'Agência Web', location: 'São Paulo', startDate: '2018-01', endDate: '2021-05', current: false, description: 'Desenvolvimento de interfaces responsivas e acessíveis para grandes e-commerces. Uso intensivo de React e TypeScript.' }
        ],
        skills: [
            { id: '1', name: 'React.js', level: 5 }, { id: '2', name: 'Node.js', level: 4 }, { id: '3', name: 'TypeScript', level: 5 }, { id: '4', name: 'AWS', level: 3 }
        ],
        languages: ['Português (Nativo)', 'Inglês (Avançado)']
    },
    {
        ...INITIAL_RESUME,
        id: 'mkt-example',
        profileName: 'Exemplo: Marketing Digital',
        personalInfo: {
            fullName: 'Mariana Costa',
            jobTitle: 'Especialista em Growth Marketing',
            email: 'mari.mkt@email.com',
            phone: '(21) 99999-1234',
            address: 'Rio de Janeiro, RJ',
            website: 'maricosta.com',
            linkedin: 'linkedin.com/in/maricosta',
            github: '',
            twitter: 'x.com/marigrowth',
            behance: '',
            dribbble: '',
            medium: '',
            photoUrl: '',
            summary: 'Especialista em Marketing Digital focada em Growth Hacking e CRM. Histórico comprovado de aumento de ROI em campanhas pagas e orgânicas. Certificada em Google Ads e Analytics. Criativa, orientada a dados e excelente comunicadora.',
        },
        experience: [
            { id: '1', role: 'Growth Manager', company: 'Startup Y', location: 'Rio de Janeiro', startDate: '2022-01', endDate: '', current: true, description: 'Gestão de budget mensal de R$ 500k. Aumentei a taxa de conversão em 25% através de testes A/B rigorosos.' },
            { id: '2', role: 'Analista de Marketing', company: 'Corp Z', location: 'São Paulo', startDate: '2019-03', endDate: '2021-12', current: false, description: 'Responsável por Email Marketing e automação. Criei réguas de relacionamento que aumentaram a retenção de clientes em 15%.' }
        ],
        skills: [
            { id: '1', name: 'Google Ads', level: 5 }, { id: '2', name: 'SEO', level: 4 }, { id: '3', name: 'Copywriting', level: 5 }, { id: '4', name: 'Data Analysis', level: 4 }
        ],
        languages: ['Português (Nativo)', 'Espanhol (Intermediário)']
    }
];

export const THEMES: ThemeConfig[] = [
  // --- NOVOS TEMAS DIFERENCIADOS ---
  {
    id: 'timeline-pro',
    name: 'Timeline Pro',
    description: 'Conecta suas experiências com uma linha do tempo elegante.',
    colors: { primary: '#2563eb', secondary: '#64748b', text: '#334155', bg: '#ffffff', accent: '#3b82f6' },
    layout: 'sidebar-left'
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
    layout: 'sidebar-right',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)'
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
    layout: 'banner',
    gradient: 'linear-gradient(to right, #1e3a8a, #2563eb)'
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

export const FONT_PAIRINGS = [
  { name: 'Moderno (Inter + Inter)', header: 'font-sans', body: 'font-sans' },
  { name: 'Editorial (Serifa + Sans)', header: 'font-serif', body: 'font-sans' },
  { name: 'Técnico (Mono + Sans)', header: 'font-mono', body: 'font-sans' },
  { name: 'Elegante (Raleway + Lato)', header: 'font-raleway', body: 'font-lato' },
  { name: 'Impacto (Poppins + Open Sans)', header: 'font-display', body: 'font-open' },
];
