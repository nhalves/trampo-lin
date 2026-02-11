
export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface Volunteer {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
}

export interface Reference {
  id: string;
  name: string;
  role: string;
  company: string;
  contact: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
}

export interface CustomSection {
  id: string;
  name: string;
  icon?: string;
  items: CustomSectionItem[];
}

export interface Skill {
  id: string;
  name: string;
  level: number; // 1-5
}

export interface ResumeSettings {
  fontScale: number;
  spacingScale: number;
  marginScale: number;
  lineHeight: number; // Novo: Altura da linha
  primaryColor?: string;
  sectionOrder: string[];
  visibleSections: Record<string, boolean>;
  paperSize: 'a4' | 'letter';
  dateFormat: 'MM/yyyy' | 'MMM yyyy' | 'yyyy' | 'full';
  headerFont: string;
  bodyFont: string;
  headerStyle: 'simple' | 'underline' | 'box' | 'left-bar' | 'gradient';
  headerAlignment: 'left' | 'center' | 'right'; // Novo
  photoShape: 'square' | 'rounded' | 'circle'; // Novo
  skillStyle: 'tags' | 'bar' | 'dots' | 'circles' | 'hidden'; // Novo: Circles
  showQrCode: boolean;
  compactMode: boolean;
  showDuration: boolean;
  grayscale: boolean; // Novo
  privacyMode: boolean; // Novo: Borrar dados sensíveis
  aiTone: 'professional' | 'creative' | 'academic' | 'enthusiastic'; // Novo
}

export interface CoverLetterData {
  recipientName: string;
  companyName: string;
  jobTitle: string;
  content: string;
}

export interface ResumeData {
  id?: string;
  profileName?: string;
  personalInfo: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    linkedin: string;
    github: string;
    twitter: string; // Novo
    behance: string; // Novo
    dribbble: string;
    medium: string;
    photoUrl: string;
    summary: string;
  };
  coverLetter: CoverLetterData;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  volunteer: Volunteer[];
  awards: Award[];
  references: Reference[];
  customSections: CustomSection[];
  skills: Skill[];
  languages: string[];
  settings: ResumeSettings;
}

export type ThemeId = 
  | 'modern-slate'
  | 'classic-serif'
  | 'minimal-mono'
  | 'executive-blue'
  | 'creative-coral'
  | 'ats-clean'
  | 'timeline-pro'
  | 'swiss-grid'
  | 'tech-dark'
  | 'geometric-pop'
  | 'studio-minimal';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    bg: string;
    accent: string;
  };
  layout: 'sidebar-left' | 'sidebar-right' | 'stacked' | 'banner' | 'single-column' | 'grid-complex';
  fonts?: {
    header?: string;
    body?: string;
  };
  gradient?: string;
}

export interface AtsAnalysis {
  score: number;
  feedback: string[];
  missingKeywords: string[];
}
