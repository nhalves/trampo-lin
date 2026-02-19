
import { ResumeData, ThemeConfig } from './types';

export const CURRENT_DATA_VERSION = 2;

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
    signature: ''
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
  publications: [],
  interests: [],
  references: [],
  customSections: [],
  skills: [],
  languages: [],
  settings: {
    fontScale: 1,
    spacingScale: 1,
    marginScale: 1,
    lineHeight: 1.4,
    sectionOrder: ['experience', 'education', 'skills', 'projects', 'certifications', 'publications', 'languages', 'volunteer', 'interests', 'awards', 'references', 'custom'],
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
      custom: true,
      publications: true,
      interests: true
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
    aiTone: 'professional',
    backgroundPattern: 'none',
    glassmorphism: false,
    watermark: false
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
  // --- TEMAS PREMIUM ---
  {
    id: 'modern-slate',
    name: 'Moderno Slate',
    description: 'Equilibrado e seguro. O favorito dos recrutadores.',
    colors: { primary: '#334155', secondary: '#64748b', text: '#1e293b', bg: '#ffffff', accent: '#3b82f6' },
    layout: 'sidebar-left'
  },
  {
    id: 'executive-gold',
    name: 'The CEO',
    description: 'Minimalismo de alto nível. Muita área branca, fontes serifadas e elegância.',
    colors: { primary: '#171717', secondary: '#404040', text: '#262626', bg: '#ffffff', accent: '#d4af37' }, // Dourado sutil
    layout: 'single-column',
    fonts: { header: 'font-serif', body: 'font-sans' }
  },
  {
    id: 'tech-lead-dark',
    name: 'Tech Lead',
    description: 'Barra lateral escura com alto contraste. Impactante e moderno.',
    colors: { primary: '#0f172a', secondary: '#334155', text: '#334155', bg: '#ffffff', accent: '#22d3ee' }, // Cyan accent
    layout: 'sidebar-left'
  },
  {
    id: 'creative-blob',
    name: 'Creative Studio',
    description: 'Formas orgânicas no cabeçalho. Para designers e criativos.',
    colors: { primary: '#4f46e5', secondary: '#818cf8', text: '#312e81', bg: '#ffffff', accent: '#c7d2fe' },
    layout: 'banner',
    gradient: 'linear-gradient(120deg, #4f46e5 0%, #c026d3 100%)'
  },
  {
    id: 'swiss-international',
    name: 'Swiss Grid',
    description: 'Tipografia ousada, linhas fortes, layout de revista.',
    colors: { primary: '#000000', secondary: '#171717', text: '#000000', bg: '#ffffff', accent: '#ef4444' }, // Vermelho suíço
    layout: 'grid-complex'
  },
  {
    id: 'startup-pop',
    name: 'Startup Pop',
    description: 'Jovem, dinâmico, cantos arredondados e cor vibrante.',
    colors: { primary: '#2563eb', secondary: '#60a5fa', text: '#1e293b', bg: '#eff6ff', accent: '#3b82f6' },
    layout: 'single-column'
  },
  {
    id: 'ivy-league',
    name: 'Ivy League',
    description: 'Tradicional, acadêmico, bordas duplas e seriedade.',
    colors: { primary: '#451a03', secondary: '#78350f', text: '#292524', bg: '#fffbeb', accent: '#92400e' }, // Tons de marrom/creme
    layout: 'stacked',
    fonts: { header: 'font-serif', body: 'font-serif' }
  },
  {
    id: 'mono-hacker',
    name: 'System.Out',
    description: 'Estilo terminal/código. Fonte monoespaçada.',
    colors: { primary: '#16a34a', secondary: '#86efac', text: '#14532d', bg: '#f0fdf4', accent: '#15803d' },
    layout: 'single-column',
    fonts: { header: 'font-mono', body: 'font-mono' }
  },
  {
    id: 'timeline-pro',
    name: 'Timeline Pro',
    description: 'Conecta suas experiências com uma linha do tempo visual.',
    colors: { primary: '#0ea5e9', secondary: '#7dd3fc', text: '#0c4a6e', bg: '#ffffff', accent: '#0284c7' },
    layout: 'sidebar-right'
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
  { name: 'Oswald (Strong)', value: 'font-[Oswald]' },
  { name: 'Playfair (Elegant)', value: 'font-[Playfair_Display]' },
  { name: 'Comic Neue (Dislexia)', value: 'font-dyslexic' },
];

export const FONT_PAIRINGS = [
  { name: 'Moderno (Inter + Inter)', header: 'font-sans', body: 'font-sans' },
  { name: 'Editorial (Serifa + Sans)', header: 'font-serif', body: 'font-sans' },
  { name: 'Técnico (Mono + Sans)', header: 'font-mono', body: 'font-sans' },
  { name: 'Elegante (Raleway + Lato)', header: 'font-raleway', body: 'font-lato' },
  { name: 'Impacto (Poppins + Open Sans)', header: 'font-display', body: 'font-open' },
  { name: 'Luxo (Playfair + Open)', header: 'font-[Playfair_Display]', body: 'font-open' },
  { name: 'Bold (Oswald + Inter)', header: 'font-[Oswald]', body: 'font-sans' },
];
