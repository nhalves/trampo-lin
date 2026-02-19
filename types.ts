
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

export interface Publication {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url: string;
}

export interface Interest {
  id: string;
  name: string;
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
  lineHeight: number;
  primaryColor?: string;
  sectionOrder: string[];
  visibleSections: Record<string, boolean>;
  paperSize: 'a4' | 'letter';
  dateFormat: 'MM/yyyy' | 'MMM yyyy' | 'yyyy' | 'full';
  headerFont: string;
  bodyFont: string;
  headerStyle: 'simple' | 'underline' | 'box' | 'left-bar' | 'gradient';
  headerAlignment: 'left' | 'center' | 'right';
  photoShape: 'square' | 'rounded' | 'circle';
  skillStyle: 'tags' | 'bar' | 'dots' | 'circles' | 'hidden';
  showQrCode: boolean;
  compactMode: boolean;
  showDuration: boolean;
  grayscale: boolean;
  privacyMode: boolean;
  aiTone: 'professional' | 'creative' | 'academic' | 'enthusiastic';

  // New Features
  backgroundPattern: 'none' | 'dots' | 'grid' | 'lines' | 'geometric';
  glassmorphism: boolean;
  watermark: boolean;
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
  createdAt?: string; // #14 — Data de criação do perfil (ISO 8601)
  personalInfo: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    linkedin: string;
    github: string;
    twitter: string;
    behance: string;
    dribbble: string;
    medium: string;
    photoUrl: string;
    summary: string;
    signature?: string; // New: Signature text
  };
  coverLetter: CoverLetterData;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  volunteer: Volunteer[];
  awards: Award[];
  publications: Publication[]; // New Section
  interests: Interest[]; // New Section
  references: Reference[];
  customSections: CustomSection[];
  skills: Skill[];
  languages: string[];
  settings: ResumeSettings;
}

export interface AIConfig {
  provider: 'gemini' | 'openrouter';
  apiKey: string;
  model: string;
}

export type ThemeId =
  | 'modern-slate'
  | 'executive-gold'
  | 'tech-lead-dark'
  | 'creative-blob'
  | 'swiss-international'
  | 'startup-pop'
  | 'ivy-league'
  | 'mono-hacker'
  | 'timeline-pro';

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

export interface GapAnalysis {
  missingHardSkills: string[];
  missingSoftSkills: string[];
  improvements: string[];
}

export interface TailoredContent {
  summary: string;
  experience: {
    id: string; // ID da experiência original para match
    rewrittenDescription: string;
  }[];
}

export type JobStatus = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  dateAdded: string;
  url?: string;
  salary?: string;
  notes?: string;
}

export interface PhotoAnalysis {
  score: number;
  feedback: string[];
  lighting: 'good' | 'bad' | 'average';
  professionalism: 'high' | 'medium' | 'low';
}

export interface OnboardingStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}
