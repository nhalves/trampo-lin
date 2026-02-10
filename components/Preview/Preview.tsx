

import React from 'react';
import { ResumeData, ThemeConfig, ResumeSettings, Skill } from '../../types';
import { MapPin, Mail, Phone, Linkedin, Globe, Github, Twitter, ExternalLink, Dribbble, Youtube, Facebook, Instagram, Hash, Star, Code, Heart, PenTool, Award } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PreviewProps {
  data: ResumeData;
  theme: ThemeConfig;
  mode?: 'resume' | 'cover';
  zoom: number;
}

const SkillItem: React.FC<{ skill: Skill; settings: ResumeSettings; primary: string; accent: string; dark?: boolean }> = ({ skill, settings, primary, accent, dark }) => {
  if (settings.skillStyle === 'hidden') {
    return <span className={`text-sm font-medium mr-3 mb-1 inline-block ${dark ? 'text-slate-300' : 'text-[var(--text)]'}`}>• {skill.name}</span>;
  }
  if (settings.skillStyle === 'bar') {
    return (
      <div className="mb-2 w-full">
        <div className={`flex justify-between text-xs mb-0.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}><span>{skill.name}</span></div>
        <div className={`h-1.5 w-full rounded-full overflow-hidden ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div className="h-full" style={{ width: `${skill.level * 20}%`, backgroundColor: primary }}></div>
        </div>
      </div>
    );
  }
  if (settings.skillStyle === 'dots') {
      return (
        <div className={`flex justify-between items-center mb-1 text-xs ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
          <span>{skill.name}</span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i <= skill.level ? '' : (dark ? 'bg-slate-700' : 'bg-slate-200')}`} style={{ backgroundColor: i <= skill.level ? accent : undefined }}></div>)}
          </div>
        </div>
      );
  }
  // Tag Style
  return <span className={`px-2 py-1 rounded text-xs font-medium inline-block border ${dark ? 'border-slate-700 text-slate-300' : 'bg-opacity-10'}`} style={{ backgroundColor: dark ? 'transparent' : `${accent}1a`, color: dark ? undefined : primary, borderColor: dark ? accent : 'transparent' }}>{skill.name}</span>;
};

// Helper para detectar ícone
const getIconForUrl = (url: string, defaultIcon: any) => {
    if (!url) return defaultIcon;
    const lower = url.toLowerCase();
    if (lower.includes('github')) return Github;
    if (lower.includes('linkedin')) return Linkedin;
    if (lower.includes('twitter') || lower.includes('x.com')) return Twitter;
    if (lower.includes('dribbble')) return Dribbble;
    if (lower.includes('behance')) return Hash; // Lucide doesn't have Behance, using Hash as fallback generic
    if (lower.includes('youtube')) return Youtube;
    if (lower.includes('facebook')) return Facebook;
    if (lower.includes('instagram')) return Instagram;
    return defaultIcon;
};

const ContactItem = ({ icon: Icon, text, link, primary, className }: { icon: any, text: string, link?: string, primary: string, className?: string }) => {
  if (!text) return null;
  const DisplayIcon = link ? getIconForUrl(link, Icon) : Icon;
  
  return (
    <div className={`flex items-center gap-1.5 mb-1 text-xs ${className}`}>
      <DisplayIcon size={12} className="flex-shrink-0" style={{ color: primary }} />
      {link ? <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="hover:underline truncate">{text}</a> : <span className="truncate">{text}</span>}
    </div>
  );
};

const SectionTitle = ({ title, font, accent, primary, style = 'simple', dark, gradient }: { title: string, font: string, accent: string, primary: string, style?: string, dark?: boolean, gradient?: string }) => {
  let classes = `text-sm font-bold uppercase tracking-wider mb-4 pb-1 ${font} break-after-avoid `;
  let inlineStyles: React.CSSProperties = { color: dark ? '#fff' : primary };
  
  if (style === 'underline') {
      inlineStyles.borderBottom = `2px solid ${accent}`;
  } else if (style === 'box') {
      classes += " px-2 py-1 inline-block";
      inlineStyles.backgroundColor = accent;
      inlineStyles.color = '#fff';
  } else if (style === 'left-bar') {
      classes += " pl-3 border-l-4";
      inlineStyles.borderColor = accent;
  } else if (style === 'gradient' && gradient) {
      inlineStyles.background = gradient;
      inlineStyles.WebkitBackgroundClip = 'text';
      inlineStyles.WebkitTextFillColor = 'transparent';
      inlineStyles.borderBottom = `1px solid ${accent}40`; // Slight border
  } else {
      // Simple default
      inlineStyles.borderBottom = `1px solid ${dark ? '#333' : '#e2e8f0'}`;
  }

  return <h3 className={classes} style={inlineStyles}>{title}</h3>;
};

// Date Formatter Helper
const DateDisplay = ({ date, formatStr }: { date: string, formatStr?: string }) => {
  if (!date) return null;
  try {
     let parsedDate = new Date();
     if (date.includes('-') && date.length === 7) { 
         parsedDate = parse(date, 'yyyy-MM', new Date());
     } else if (date.includes('/') && date.length === 7) { 
         parsedDate = parse(date, 'MM/yyyy', new Date());
     } else if (date.length === 4) {
         return <span>{date}</span>;
     } else {
         return <span>{date}</span>; 
     }
     
     if (!isValid(parsedDate)) return <span>{date}</span>;

     if (formatStr === 'yyyy') return <span>{format(parsedDate, 'yyyy')}</span>;
     if (formatStr === 'MM/yyyy') return <span>{format(parsedDate, 'MM/yyyy')}</span>;
     if (formatStr === 'full') return <span>{format(parsedDate, 'MMMM yyyy', { locale: ptBR })}</span>;
     
     return <span className="capitalize">{format(parsedDate, 'MMM yyyy', { locale: ptBR })}</span>;
  } catch (e) {
    return <span>{date}</span>;
  }
};

export const Preview: React.FC<PreviewProps> = ({ data, theme, mode = 'resume', zoom }) => {
  const { colors, layout } = theme;
  const { settings } = data;
  
  const headerFontClass = settings.headerFont || theme.fonts?.header || 'font-sans';
  const bodyFontClass = settings.bodyFont || theme.fonts?.body || 'font-sans';

  const style = {
    '--primary': settings.primaryColor || colors.primary,
    '--secondary': colors.secondary,
    '--text': colors.text,
    '--bg': colors.bg,
    '--accent': colors.accent,
    fontSize: `${settings.fontScale * 0.875}rem`,
    lineHeight: settings.spacingScale * 1.5,
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
    width: `calc(100% / ${zoom})`,
    height: `calc(100% / ${zoom})`,
  } as React.CSSProperties;

  const primaryColor = settings.primaryColor || colors.primary;
  const isDarkTheme = theme.id === 'tech-dark'; 

  const getCustomIcon = (id?: string) => {
      switch(id) {
          case 'star': return Star;
          case 'globe': return Globe;
          case 'code': return Code;
          case 'heart': return Heart;
          case 'pen': return PenTool;
          case 'award': return Award;
          default: return null;
      }
  };

  const renderSection = (type: string) => {
    if (!data.settings.visibleSections[type]) return null;
    
    switch(type) {
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <div className="mb-6 group-section">
            <SectionTitle title="Experiência" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
            <div className={`${theme.id === 'timeline-pro' ? 'border-l-2 border-slate-200 ml-2 pl-4 space-y-6' : 'space-y-4'}`}>
              {data.experience.map((exp, i) => (
                <div key={exp.id} className={`break-inside-avoid relative ${settings.compactMode ? 'mb-2' : ''}`}>
                   {theme.id === 'timeline-pro' && <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white" style={{backgroundColor: primaryColor}}></div>}
                   <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`font-bold text-lg ${bodyFontClass}`} style={{color: isDarkTheme ? '#fff' : 'var(--text)'}}>{exp.role}</h4>
                      {settings.showDuration && <span className="text-xs opacity-70 whitespace-nowrap"><DateDisplay date={exp.startDate} formatStr={settings.dateFormat}/> – {exp.current ? 'Atual' : <DateDisplay date={exp.endDate} formatStr={settings.dateFormat}/>}</span>}
                   </div>
                   <div className="text-sm font-semibold mb-2" style={{color: colors.accent}}>{exp.company} {exp.location && `• ${exp.location}`}</div>
                   <p className={`text-sm opacity-90 whitespace-pre-line text-justify ${bodyFontClass}`} style={{color: isDarkTheme ? '#ccc' : 'var(--text)'}}>{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'education':
         if (data.education.length === 0) return null;
         return (
           <div className="mb-6 group-section">
             <SectionTitle title="Educação" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
             {data.education.map(edu => (
               <div key={edu.id} className="mb-3 break-inside-avoid">
                 <div className="flex justify-between font-bold"><span style={{color: isDarkTheme ? '#fff' : 'var(--text)'}}>{edu.school}</span> <span className="text-xs font-normal opacity-70"><DateDisplay date={edu.endDate} formatStr={settings.dateFormat}/></span></div>
                 <div className="text-sm" style={{color: colors.accent}}>{edu.degree}</div>
               </div>
             ))}
           </div>
         );
      case 'skills':
          if (data.skills.length === 0) return null;
          return (
            <div className="mb-6 group-section">
              <SectionTitle title="Habilidades" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
              <div className={`flex flex-wrap ${settings.skillStyle === 'tags' ? 'gap-2' : settings.skillStyle === 'hidden' ? 'block' : 'flex-col gap-1'}`}>
                {data.skills.map(s => <SkillItem key={s.id} skill={s} settings={settings} primary={primaryColor} accent={colors.accent} dark={isDarkTheme} />)}
              </div>
            </div>
          );
      case 'projects':
          if (data.projects.length === 0) return null;
          return (
             <div className="mb-6 group-section">
               <SectionTitle title="Projetos" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
               {data.projects.map(p => (
                 <div key={p.id} className="mb-3 break-inside-avoid">
                    <div className="font-bold flex items-center gap-2" style={{color: isDarkTheme ? '#fff' : 'var(--text)'}}>{p.name} {p.url && <a href={p.url} className="text-blue-500"><ExternalLink size={10}/></a>}</div>
                    <p className="text-sm opacity-90">{p.description}</p>
                 </div>
               ))}
             </div>
          );
      case 'languages':
         if (data.languages.length === 0) return null;
         return (
            <div className="mb-6 group-section">
              <SectionTitle title="Idiomas" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
              <div className="text-sm opacity-90">{data.languages.join(' • ')}</div>
            </div>
         );
      case 'custom':
         return (
           <>
             {data.customSections.map(sec => {
               const CustomIcon = getCustomIcon(sec.icon);
               return (
               <div key={sec.id} className="mb-6 group-section">
                 <div className="flex items-center gap-2 mb-4">
                    {CustomIcon && <CustomIcon size={18} style={{color: colors.accent}} />}
                    <SectionTitle title={sec.name} font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
                 </div>
                 {sec.items.map(item => (
                   <div key={item.id} className="mb-2 break-inside-avoid">
                      <div className="font-bold">{item.title}</div>
                      <div className="text-xs opacity-70 mb-1">{item.subtitle}</div>
                      <p className="text-sm opacity-90">{item.description}</p>
                   </div>
                 ))}
               </div>
             )})}
           </>
         );
      default: return null;
    }
  };

  const ContactList = ({ vertical = false, className = '' }) => (
     <div className={`flex ${vertical ? 'flex-col gap-1' : 'flex-wrap gap-x-4 gap-y-1 justify-center'} text-sm opacity-90 ${className}`} style={{color: isDarkTheme ? '#ccc' : 'var(--text)'}}>
        <ContactItem icon={Mail} text={data.personalInfo.email} primary={primaryColor} />
        <ContactItem icon={Phone} text={data.personalInfo.phone} primary={primaryColor} />
        <ContactItem icon={MapPin} text={data.personalInfo.address} primary={primaryColor} />
        <ContactItem icon={Linkedin} text={data.personalInfo.linkedin} link={data.personalInfo.linkedin} primary={primaryColor} />
        <ContactItem icon={Github} text={data.personalInfo.github} link={data.personalInfo.github} primary={primaryColor} />
        <ContactItem icon={Globe} text={data.personalInfo.website} link={data.personalInfo.website} primary={primaryColor} />
     </div>
  );

  const renderSingleColumn = () => (
    <div className={`p-${8 * settings.marginScale} max-w-3xl mx-auto h-full`}>
       <div className="text-center mb-8">
          {data.personalInfo.photoUrl && <img src={data.personalInfo.photoUrl} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-sm"/>}
          <h1 className={`text-4xl font-bold mb-2 uppercase tracking-tight ${headerFontClass}`} style={{color: primaryColor}}>{data.personalInfo.fullName}</h1>
          <p className={`text-xl mb-4 ${bodyFontClass}`} style={{color: colors.accent}}>{data.personalInfo.jobTitle}</p>
          <ContactList />
       </div>
       {data.settings.visibleSections.summary && (
         <div className="mb-8 text-center px-8">
            <p className={`text-sm leading-relaxed opacity-80 ${bodyFontClass}`}>{data.personalInfo.summary}</p>
         </div>
       )}
       {data.settings.sectionOrder.map(id => renderSection(id))}
    </div>
  );

  const renderSidebarLeft = () => (
    <div className="flex h-full">
       <div className={`w-[32%] p-${6 * settings.marginScale} flex flex-col gap-6 text-white h-full`} style={{backgroundColor: theme.id === 'timeline-pro' ? '#f8fafc' : colors.primary, color: theme.id === 'timeline-pro' ? '#334155' : '#fff'}}>
          <div className="text-center">
             {data.personalInfo.photoUrl && <img src={data.personalInfo.photoUrl} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white/20"/>}
             {theme.id === 'timeline-pro' ? null : (
               <>
                 <h2 className="font-bold text-xl mb-1">{data.personalInfo.fullName}</h2>
                 <p className="opacity-80 text-sm mb-4">{data.personalInfo.jobTitle}</p>
               </>
             )}
          </div>
          
          <div className="flex flex-col gap-2 text-sm opacity-90">
             <div className="font-bold uppercase tracking-wider mb-2 border-b border-white/20 pb-1">Contato</div>
             <ContactItem icon={Mail} text={data.personalInfo.email} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} />
             <ContactItem icon={Phone} text={data.personalInfo.phone} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} />
             <ContactItem icon={MapPin} text={data.personalInfo.address} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} />
             <ContactItem icon={Linkedin} text={data.personalInfo.linkedin} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} link={data.personalInfo.linkedin} />
             <ContactItem icon={Globe} text={data.personalInfo.website} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} link={data.personalInfo.website} />
          </div>

          <div className="mt-4">
             {renderSection('skills')}
             {renderSection('languages')}
             {renderSection('awards')}
          </div>
       </div>
       <div className={`flex-1 p-${8 * settings.marginScale} bg-white`}>
          {theme.id === 'timeline-pro' && (
             <div className="mb-8 border-b pb-4">
                <h1 className={`text-4xl font-bold mb-1 ${headerFontClass}`} style={{color: primaryColor}}>{data.personalInfo.fullName}</h1>
                <p className="text-xl opacity-70">{data.personalInfo.jobTitle}</p>
             </div>
          )}
          {data.settings.visibleSections.summary && (
             <div className="mb-8">
                <SectionTitle title="Resumo" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} gradient={theme.gradient} />
                <p className="text-sm leading-relaxed opacity-80">{data.personalInfo.summary}</p>
             </div>
          )}
          {data.settings.sectionOrder.filter(id => !['skills','languages','awards'].includes(id)).map(id => renderSection(id))}
       </div>
    </div>
  );

  const renderGridComplex = () => (
     <div className={`p-${8 * settings.marginScale} h-full bg-white relative`}>
        <div className="grid grid-cols-12 gap-4 mb-12 border-b-4 border-black pb-4">
           <div className="col-span-8">
              <h1 className={`text-6xl font-bold tracking-tighter leading-none mb-2 ${headerFontClass}`} style={{color: primaryColor}}>{data.personalInfo.fullName}</h1>
              <p className="text-2xl font-light tracking-wide">{data.personalInfo.jobTitle}</p>
           </div>
           <div className="col-span-4 text-right flex flex-col items-end justify-end">
              <ContactList vertical className="items-end" />
           </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
           <div className="col-span-4">
              {data.settings.visibleSections.summary && (
                 <div className="mb-8">
                    <h3 className="font-bold text-sm uppercase mb-2 border-t-2 border-black pt-1">Sobre</h3>
                    <p className="text-sm leading-relaxed">{data.personalInfo.summary}</p>
                 </div>
              )}
              {renderSection('skills')}
              {renderSection('education')}
              {renderSection('languages')}
           </div>
           <div className="col-span-8">
              {data.settings.sectionOrder.filter(id => !['skills','education','languages'].includes(id)).map(id => (
                  <div key={id} className="mb-8 border-l-2 border-slate-100 pl-4">
                      {renderSection(id)}
                  </div>
              ))}
           </div>
        </div>
     </div>
  );

  const renderGeometric = () => (
     <div className={`p-${8 * settings.marginScale} h-full relative overflow-hidden`} style={{backgroundColor: colors.bg}}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{backgroundColor: colors.primary}}></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{backgroundColor: colors.accent}}></div>
        <div className="absolute top-20 left-10 w-20 h-20 rounded-lg rotate-12 opacity-5" style={{backgroundColor: colors.secondary}}></div>

        <div className="relative z-10 flex flex-col items-center mb-10">
           {data.personalInfo.photoUrl && <img src={data.personalInfo.photoUrl} className="w-28 h-28 rounded-2xl shadow-lg mb-4 object-cover"/>}
           <h1 className={`text-4xl font-bold mb-1 ${headerFontClass}`}>{data.personalInfo.fullName}</h1>
           <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white shadow-sm" style={{color: colors.accent}}>{data.personalInfo.jobTitle}</span>
           <div className="mt-4 p-3 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white">
              <ContactList />
           </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8">
           <div className="col-span-2 md:col-span-1 space-y-2">
              {renderSection('experience')}
              {renderSection('projects')}
           </div>
           <div className="col-span-2 md:col-span-1 space-y-2">
              {data.settings.visibleSections.summary && (
                 <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-sm uppercase mb-2" style={{color: colors.primary}}>Resumo</h3>
                    <p className="text-sm opacity-80">{data.personalInfo.summary}</p>
                 </div>
              )}
              {renderSection('education')}
              {renderSection('skills')}
              {renderSection('languages')}
           </div>
        </div>
     </div>
  );

  let Content = renderSingleColumn;
  if (layout === 'sidebar-left' || layout === 'sidebar-right') Content = renderSidebarLeft;
  if (layout === 'grid-complex') Content = renderGridComplex;
  if (theme.id === 'geometric-pop') Content = renderGeometric;
  if (theme.id === 'tech-dark') Content = renderSingleColumn; 

  return (
    <div className={`w-full h-full overflow-hidden shadow-2xl ring-1 ring-slate-900/5 transition-shadow duration-500`} style={{...style, backgroundColor: isDarkTheme ? '#0f172a' : '#fff'}}>
        <Content />
        {settings.showQrCode && data.personalInfo.linkedin && (
           <div className="absolute top-4 right-4 print:block hidden">
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(data.personalInfo.linkedin)}`} className="w-16 h-16 opacity-80" />
           </div>
        )}
    </div>
  );
};
