
import React from 'react';
import { ResumeData, ThemeConfig, ResumeSettings, Skill } from '../../types';
import { MapPin, Mail, Phone, Linkedin, Globe, Github, Twitter, ExternalLink, Dribbble, Youtube, Facebook, Instagram, Hash, Star, Code, Heart, PenTool, Award, BookOpen, UserCheck, Zap, Feather } from 'lucide-react';

interface PreviewProps {
  data: ResumeData;
  theme: ThemeConfig;
  mode?: 'resume' | 'cover';
}

const MarkdownText = ({ text }: { text: string }) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return (
        <>
            {lines.map((line, i) => {
                const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
                const renderedLine = parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('*') && part.endsWith('*')) {
                        return <em key={j}>{part.slice(1, -1)}</em>;
                    }
                    return part;
                });
                return <span key={i} className="block min-h-[1em]">{renderedLine}</span>;
            })}
        </>
    );
};

const SkillItem: React.FC<{ skill: Skill; settings: ResumeSettings; primary: string; accent: string; dark?: boolean }> = ({ skill, settings, primary, accent, dark }) => {
  if (settings.skillStyle === 'hidden') {
    return <span className={`text-sm font-medium mr-3 mb-1 inline-block print:text-black ${dark ? 'text-slate-300' : 'text-[var(--text)]'}`}>• {skill.name}</span>;
  }
  if (settings.skillStyle === 'bar') {
    return (
      <div className="mb-2 w-full break-inside-avoid">
        <div className={`flex justify-between text-xs mb-0.5 print:text-black ${dark ? 'text-slate-300' : 'text-slate-700'}`}><span>{skill.name}</span></div>
        <div className={`h-1.5 w-full rounded-full overflow-hidden print:border print:border-slate-300 ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div className="h-full print:print-color-adjust-exact" style={{ width: `${skill.level * 20}%`, backgroundColor: primary }}></div>
        </div>
      </div>
    );
  }
  if (settings.skillStyle === 'dots') {
      return (
        <div className={`flex justify-between items-center mb-1 text-xs print:text-black ${dark ? 'text-slate-300' : 'text-slate-700'} break-inside-avoid`}>
          <span>{skill.name}</span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => <div key={i} className={`w-2 h-2 rounded-full print:print-color-adjust-exact ${i <= skill.level ? '' : (dark ? 'bg-slate-700' : 'bg-slate-200')}`} style={{ backgroundColor: i <= skill.level ? accent : undefined }}></div>)}
          </div>
        </div>
      );
  }
  if (settings.skillStyle === 'circles') {
      return (
          <div className="flex flex-col items-center justify-center text-center w-20 mb-3 break-inside-avoid">
              <div className="relative w-12 h-12 mb-1 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className={`${dark ? 'text-slate-700' : 'text-slate-200'}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path className="print:print-color-adjust-exact" style={{ color: primary }} strokeDasharray={`${skill.level * 20}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                  <span className="absolute text-[10px] font-bold print:text-black">{skill.level}</span>
              </div>
              <span className={`text-[10px] leading-tight print:text-black ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{skill.name}</span>
          </div>
      );
  }
  // Tag Style
  return <span className={`px-2 py-1 rounded text-xs font-medium inline-block border break-inside-avoid print:print-color-adjust-exact print:text-black print:border-slate-300 ${dark ? 'border-slate-700 text-slate-300' : 'bg-opacity-10'}`} style={{ backgroundColor: dark ? 'transparent' : `${accent}1a`, color: dark ? undefined : primary, borderColor: dark ? accent : 'transparent' }}>{skill.name}</span>;
};

const getIconForUrl = (url: string, defaultIcon: any) => {
    if (!url) return defaultIcon;
    const lower = url.toLowerCase();
    if (lower.includes('github')) return Github;
    if (lower.includes('linkedin')) return Linkedin;
    if (lower.includes('twitter') || lower.includes('x.com')) return Twitter;
    if (lower.includes('dribbble')) return Dribbble;
    if (lower.includes('behance')) return Hash; 
    if (lower.includes('youtube')) return Youtube;
    if (lower.includes('facebook')) return Facebook;
    if (lower.includes('instagram')) return Instagram;
    return defaultIcon;
};

const sanitizeLink = (link: string) => {
    if (!link) return '';
    if (link.startsWith('http')) return link;
    if (link.includes('@')) return `mailto:${link}`;
    return `https://${link}`;
};

const ContactItem = ({ icon: Icon, text, link, primary, className, privacyMode }: { icon: any, text: string, link?: string, primary: string, className?: string, privacyMode?: boolean }) => {
  if (!text) return null;
  const DisplayIcon = link ? getIconForUrl(link, Icon) : Icon;
  const safeLink = link ? sanitizeLink(link) : undefined;
  
  return (
    <div className={`flex items-center gap-1.5 mb-1 text-xs ${className} break-inside-avoid`}>
      <DisplayIcon size={12} className="flex-shrink-0 print:text-black" style={{ color: primary }} />
      {safeLink ? (
          <a href={safeLink} target="_blank" rel="noreferrer" className={`hover:underline truncate print:text-black print:no-underline ${privacyMode ? 'blur-[3px] select-none print:blur-none' : ''}`}>{text}</a>
      ) : (
          <span className={`truncate print:text-black ${privacyMode ? 'blur-[3px] select-none print:blur-none' : ''}`}>{text}</span>
      )}
    </div>
  );
};

const SectionTitle = ({ title, font, accent, primary, style = 'simple', dark, gradient }: { title: string, font: string, accent: string, primary: string, style?: string, dark?: boolean, gradient?: string }) => {
  let classes = `text-sm font-bold uppercase tracking-wider mb-4 pb-1 ${font} break-after-avoid break-inside-avoid print:text-black `;
  let inlineStyles: React.CSSProperties = { color: dark ? '#fff' : primary };
  
  if (style === 'underline') {
      inlineStyles.borderBottom = `2px solid ${accent}`;
  } else if (style === 'box') {
      classes += " px-2 py-1 inline-block print:print-color-adjust-exact";
      inlineStyles.backgroundColor = accent;
      inlineStyles.color = '#fff';
  } else if (style === 'left-bar') {
      classes += " pl-3 border-l-4";
      inlineStyles.borderColor = accent;
  } else if (style === 'gradient' && gradient) {
      inlineStyles.background = gradient;
      inlineStyles.WebkitBackgroundClip = 'text';
      inlineStyles.WebkitTextFillColor = 'transparent';
      inlineStyles.borderBottom = `1px solid ${accent}40`;
  } else {
      inlineStyles.borderBottom = `1px solid ${dark ? '#333' : '#e2e8f0'}`;
  }

  return <h3 className={classes} style={inlineStyles}>{title}</h3>;
};

const DateDisplay = ({ date, formatStr }: { date: string, formatStr?: string }) => {
  if (!date) return null;
  
  let parsedDate: Date | null = null;
  
  try {
     if (typeof date !== 'string') return null;

     if (date.match(/^\d{4}-\d{2}$/)) { 
         const [y, m] = date.split('-').map(Number);
         parsedDate = new Date(y, m - 1);
     } else if (date.match(/^\d{2}\/\d{4}$/)) { 
         const [m, y] = date.split('/').map(Number);
         parsedDate = new Date(y, m - 1);
     } else if (date.match(/^\d{4}$/)) {
         return <span>{date}</span>;
     } else {
         return <span>{date}</span>; 
     }
     
     if (!parsedDate || isNaN(parsedDate.getTime())) return <span>{date}</span>;

     const locale = 'pt-BR';
     
     if (formatStr === 'yyyy') return <span>{parsedDate.getFullYear()}</span>;
     if (formatStr === 'MM/yyyy') {
         const m = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
         return <span>{m}/{parsedDate.getFullYear()}</span>;
     }
     if (formatStr === 'full') {
         return <span>{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parsedDate)}</span>;
     }
     
     return <span className="capitalize">{new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(parsedDate).replace('.', '')}</span>;

  } catch (e) {
    return <span>{date}</span>;
  }
};

export const Preview: React.FC<PreviewProps> = ({ data, theme, mode = 'resume' }) => {
  const { colors, layout } = theme;
  const { settings } = data;
  
  const headerFontClass = settings.headerFont || theme.fonts?.header || 'font-sans';
  const bodyFontClass = settings.bodyFont || theme.fonts?.body || 'font-sans';

  // Base styles for the resume paper
  const style = {
    '--primary': settings.primaryColor || colors.primary,
    '--secondary': colors.secondary,
    '--text': colors.text,
    '--bg': colors.bg,
    '--accent': colors.accent,
    fontSize: `${settings.fontScale * 0.875}rem`,
    lineHeight: settings.lineHeight || settings.spacingScale * 1.5,
    backgroundColor: theme.id === 'tech-dark' ? '#0f172a' : '#fff',
    color: theme.id === 'tech-dark' ? '#cbd5e1' : colors.text,
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
          <div className="mb-6 group-section break-inside-avoid">
            <SectionTitle title="Experiência" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
            <div className={`${theme.id === 'timeline-pro' ? 'border-l-2 border-slate-200 ml-2 pl-4 space-y-6' : 'space-y-4'}`}>
              {data.experience.map((exp, i) => (
                <div key={exp.id} className={`break-inside-avoid relative ${settings.compactMode ? 'mb-2' : ''}`}>
                   {theme.id === 'timeline-pro' && <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white print:print-color-adjust-exact" style={{backgroundColor: primaryColor}}></div>}
                   <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`font-bold text-lg ${bodyFontClass} print:text-black`} style={{color: isDarkTheme ? '#fff' : 'var(--text)'}}>{exp.role}</h4>
                      {settings.showDuration && (
                          <span className="text-xs opacity-70 whitespace-nowrap print:text-black">
                              <DateDisplay date={exp.startDate} formatStr={settings.dateFormat}/> – {exp.current ? 'Atualmente' : <DateDisplay date={exp.endDate} formatStr={settings.dateFormat}/>}
                          </span>
                      )}
                   </div>
                   <div className="text-sm font-semibold mb-2 print:text-black" style={{color: colors.accent}}>{exp.company} {exp.location && `• ${exp.location}`}</div>
                   <div className={`text-sm opacity-90 text-justify ${bodyFontClass} print:text-black`} style={{color: isDarkTheme ? '#ccc' : 'var(--text)'}}>
                       <MarkdownText text={exp.description} />
                   </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'education':
         if (data.education.length === 0) return null;
         return (
           <div className="mb-6 group-section break-inside-avoid">
             <SectionTitle title="Educação" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
             {data.education.map(edu => (
               <div key={edu.id} className="mb-3 break-inside-avoid">
                 <div className="flex justify-between font-bold print:text-black"><span style={{color: isDarkTheme ? '#fff' : 'var(--text)'}}>{edu.school}</span> <span className="text-xs font-normal opacity-70"><DateDisplay date={edu.endDate} formatStr={settings.dateFormat}/></span></div>
                 <div className="text-sm print:text-black" style={{color: colors.accent}}>{edu.degree}</div>
               </div>
             ))}
           </div>
         );
      case 'skills':
          if (data.skills.length === 0) return null;
          return (
            <div className="mb-6 group-section break-inside-avoid">
              <SectionTitle title="Habilidades" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
              <div className={`flex flex-wrap ${settings.skillStyle === 'tags' || settings.skillStyle === 'circles' ? 'gap-2' : settings.skillStyle === 'hidden' ? 'block' : 'flex-col gap-1'}`}>
                {data.skills.map(s => <SkillItem key={s.id} skill={s} settings={settings} primary={primaryColor} accent={colors.accent} dark={isDarkTheme} />)}
              </div>
            </div>
          );
      case 'projects':
          if (data.projects.length === 0) return null;
          return (
             <div className="mb-6 group-section break-inside-avoid">
               <SectionTitle title="Projetos" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
               {data.projects.map(p => (
                 <div key={p.id} className="mb-3 break-inside-avoid">
                    <div className="font-bold flex items-center gap-2 print:text-black" style={{color: isDarkTheme ? '#fff' : 'var(--text)'}}>
                        {p.name} 
                        {p.url && <a href={sanitizeLink(p.url)} target="_blank" rel="noreferrer" className="text-blue-500 print:text-black print:no-underline"><ExternalLink size={10}/></a>}
                    </div>
                    <div className="text-sm opacity-90 print:text-black"><MarkdownText text={p.description} /></div>
                 </div>
               ))}
             </div>
          );
      case 'languages':
         if (data.languages.length === 0) return null;
         return (
            <div className="mb-6 group-section break-inside-avoid">
              <SectionTitle title="Idiomas" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
              <div className="text-sm opacity-90 print:text-black">{data.languages.join(' • ')}</div>
            </div>
         );
      case 'interests':
         if (data.interests.length === 0) return null;
         return (
            <div className="mb-6 group-section break-inside-avoid">
              <SectionTitle title="Interesses" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
              <div className="text-sm opacity-90 print:text-black flex flex-wrap gap-2">
                  {data.interests.map(int => (
                      <span key={int.id} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 text-xs print:border print:bg-white">{int.name}</span>
                  ))}
              </div>
            </div>
         );
      case 'publications':
         if (data.publications.length === 0) return null;
         return (
             <div className="mb-6 group-section break-inside-avoid">
                 <SectionTitle title="Publicações" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
                 {data.publications.map(pub => (
                     <div key={pub.id} className="mb-3 break-inside-avoid">
                         <div className="font-bold flex items-center gap-1 print:text-black">
                            {pub.title}
                            {pub.url && <a href={sanitizeLink(pub.url)} target="_blank" rel="noreferrer"><ExternalLink size={10} className="text-blue-500"/></a>}
                         </div>
                         <div className="text-xs opacity-70 italic print:text-black">{pub.publisher} • {pub.date}</div>
                     </div>
                 ))}
             </div>
         );
      case 'volunteer':
         if (data.volunteer.length === 0) return null;
         return (
             <div className="mb-6 group-section break-inside-avoid">
                 <SectionTitle title="Voluntariado" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
                 {data.volunteer.map(vol => (
                     <div key={vol.id} className="mb-3 break-inside-avoid">
                         <div className="flex justify-between font-bold print:text-black"><span style={{color: isDarkTheme ? '#fff' : 'var(--text)'}}>{vol.role}</span> <span className="text-xs font-normal opacity-70">{vol.startDate}</span></div>
                         <div className="text-sm print:text-black" style={{color: colors.accent}}>{vol.organization}</div>
                     </div>
                 ))}
             </div>
         );
       case 'awards':
         if (data.awards.length === 0) return null;
         return (
             <div className="mb-6 group-section break-inside-avoid">
                 <SectionTitle title="Prêmios" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
                 {data.awards.map(aw => (
                     <div key={aw.id} className="mb-2 break-inside-avoid">
                         <div className="font-bold print:text-black">{aw.title}</div>
                         <div className="text-xs opacity-70 print:text-black">{aw.issuer} • {aw.date}</div>
                     </div>
                 ))}
             </div>
         );
       case 'references':
         if (data.references.length === 0) return null;
         return (
             <div className="mb-6 group-section break-inside-avoid">
                 <SectionTitle title="Referências" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
                 {data.references.map(ref => (
                     <div key={ref.id} className="mb-2 break-inside-avoid">
                         <div className="font-bold print:text-black">{ref.name}</div>
                         <div className="text-xs opacity-80 print:text-black">{ref.role} @ {ref.company}</div>
                         <div className="text-xs opacity-60 print:text-black">{ref.contact}</div>
                     </div>
                 ))}
             </div>
         );
      case 'custom':
         if (data.customSections.length === 0) return null;
         return (
           <>
             {data.customSections.map(sec => {
               if(sec.items.length === 0) return null;
               const CustomIcon = getCustomIcon(sec.icon);
               return (
               <div key={sec.id} className="mb-6 group-section break-inside-avoid">
                 <div className="flex items-center gap-2 mb-4">
                    {CustomIcon && <CustomIcon size={18} style={{color: colors.accent}} />}
                    <SectionTitle title={sec.name} font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} dark={isDarkTheme} gradient={theme.gradient} />
                 </div>
                 {sec.items.map(item => (
                   <div key={item.id} className="mb-2 break-inside-avoid">
                      <div className="font-bold print:text-black">{item.title}</div>
                      <div className="text-xs opacity-70 mb-1 print:text-black">{item.subtitle}</div>
                      <div className="text-sm opacity-90 whitespace-pre-line print:text-black"><MarkdownText text={item.description} /></div>
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
     <div className={`flex ${vertical ? 'flex-col gap-1' : 'flex-wrap gap-x-4 gap-y-1'} text-sm opacity-90 ${className} ${settings.headerAlignment === 'center' && !vertical ? 'justify-center' : settings.headerAlignment === 'right' && !vertical ? 'justify-end' : ''}`} style={{color: isDarkTheme ? '#ccc' : 'var(--text)'}}>
        <ContactItem icon={Mail} text={data.personalInfo.email} primary={primaryColor} privacyMode={settings.privacyMode} />
        <ContactItem icon={Phone} text={data.personalInfo.phone} primary={primaryColor} privacyMode={settings.privacyMode} />
        <ContactItem icon={MapPin} text={data.personalInfo.address} primary={primaryColor} privacyMode={settings.privacyMode} />
        <ContactItem icon={Linkedin} text={data.personalInfo.linkedin} link={data.personalInfo.linkedin} primary={primaryColor} />
        <ContactItem icon={Github} text={data.personalInfo.github} link={data.personalInfo.github} primary={primaryColor} />
        <ContactItem icon={Globe} text={data.personalInfo.website} link={data.personalInfo.website} primary={primaryColor} />
        <ContactItem icon={Twitter} text={data.personalInfo.twitter} link={data.personalInfo.twitter} primary={primaryColor} />
        <ContactItem icon={Hash} text={data.personalInfo.behance} link={data.personalInfo.behance} primary={primaryColor} />
     </div>
  );

  const getPhotoClasses = () => {
      switch(settings.photoShape) {
          case 'circle': return 'rounded-full';
          case 'rounded': return 'rounded-xl';
          default: return 'rounded-none';
      }
  };

  const getAlignmentClasses = () => {
      switch(settings.headerAlignment) {
          case 'center': return 'text-center items-center';
          case 'right': return 'text-right items-end';
          default: return 'text-left items-start';
      }
  };

  const getBackgroundStyle = () => {
      const color = colors.accent + '20'; // 12% opacity
      switch(settings.backgroundPattern) {
          case 'dots': return { backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`, backgroundSize: '20px 20px' };
          case 'grid': return { backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize: '20px 20px' };
          case 'lines': return { backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 1px, transparent 1px, transparent 10px)` };
          default: return {};
      }
  };

  const renderSingleColumn = () => (
    <div className={`p-${8 * settings.marginScale} max-w-3xl mx-auto h-full relative`}>
       {settings.watermark && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
               <span className="text-8xl font-black -rotate-45 uppercase text-slate-900">Rascunho</span>
           </div>
       )}
       
       <div className={`relative z-10 flex flex-col mb-8 ${getAlignmentClasses()}`}>
          {data.personalInfo.photoUrl && <img src={data.personalInfo.photoUrl} className={`w-24 h-24 mb-4 object-cover border-4 border-white shadow-sm ${getPhotoClasses()}`}/>}
          <h1 className={`text-4xl font-bold mb-2 uppercase tracking-tight ${headerFontClass} print:text-black`} style={{color: primaryColor}}>{data.personalInfo.fullName}</h1>
          <p className={`text-xl mb-4 ${bodyFontClass} print:text-black`} style={{color: colors.accent}}>{data.personalInfo.jobTitle}</p>
          <ContactList />
       </div>
       {data.settings.visibleSections.summary && data.personalInfo.summary && (
         <div className={`mb-8 relative z-10 ${settings.headerAlignment === 'center' ? 'text-center px-8' : ''}`}>
            <div className={`text-sm leading-relaxed opacity-80 ${bodyFontClass} print:text-black`}><MarkdownText text={data.personalInfo.summary} /></div>
         </div>
       )}
       <div className="relative z-10">
           {data.settings.sectionOrder.map(id => renderSection(id))}
       </div>
       
       {data.personalInfo.signature && (
           <div className="mt-12 pt-4 border-t border-slate-200 w-48 break-inside-avoid">
               <p className="font-handwriting text-xl text-slate-800 dark:text-slate-300 print:text-black" style={{fontFamily: 'cursive'}}>{data.personalInfo.signature}</p>
           </div>
       )}
    </div>
  );

  const renderSidebarLeft = () => (
    <div className="flex h-full">
       <div className={`w-[32%] p-${6 * settings.marginScale} flex flex-col gap-6 text-white h-full print:print-color-adjust-exact`} style={{backgroundColor: theme.id === 'timeline-pro' ? '#f8fafc' : colors.primary, color: theme.id === 'timeline-pro' ? '#334155' : '#fff'}}>
          <div className="text-center flex flex-col items-center">
             {data.personalInfo.photoUrl && <img src={data.personalInfo.photoUrl} className={`w-32 h-32 mb-4 object-cover border-4 border-white/20 ${getPhotoClasses()}`}/>}
             {theme.id === 'timeline-pro' ? null : (
               <>
                 <h2 className="font-bold text-xl mb-1">{data.personalInfo.fullName}</h2>
                 <p className="opacity-80 text-sm mb-4">{data.personalInfo.jobTitle}</p>
               </>
             )}
          </div>
          
          <div className="flex flex-col gap-2 text-sm opacity-90">
             <div className="font-bold uppercase tracking-wider mb-2 border-b border-white/20 pb-1">Contato</div>
             <ContactItem icon={Mail} text={data.personalInfo.email} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} privacyMode={settings.privacyMode} />
             <ContactItem icon={Phone} text={data.personalInfo.phone} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} privacyMode={settings.privacyMode} />
             <ContactItem icon={MapPin} text={data.personalInfo.address} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} privacyMode={settings.privacyMode} />
             <ContactItem icon={Linkedin} text={data.personalInfo.linkedin} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} link={data.personalInfo.linkedin} />
             <ContactItem icon={Globe} text={data.personalInfo.website} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} link={data.personalInfo.website} />
             <ContactItem icon={Twitter} text={data.personalInfo.twitter} primary={theme.id==='timeline-pro' ? primaryColor : '#fff'} link={data.personalInfo.twitter} />
          </div>

          <div className="mt-4">
             {renderSection('skills')}
             {renderSection('languages')}
             {renderSection('interests')}
             {renderSection('awards')}
          </div>
       </div>
       <div className={`flex-1 p-${8 * settings.marginScale} bg-white relative`}>
          {settings.watermark && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
                   <span className="text-8xl font-black -rotate-45 uppercase text-slate-900">Rascunho</span>
               </div>
          )}
          <div className="relative z-10">
              {theme.id === 'timeline-pro' && (
                 <div className="mb-8 border-b pb-4">
                    <h1 className={`text-4xl font-bold mb-1 ${headerFontClass} print:text-black`} style={{color: primaryColor}}>{data.personalInfo.fullName}</h1>
                    <p className="text-xl opacity-70 print:text-black">{data.personalInfo.jobTitle}</p>
                 </div>
              )}
              {data.settings.visibleSections.summary && data.personalInfo.summary && (
                 <div className="mb-8">
                    <SectionTitle title="Resumo" font={headerFontClass} accent={colors.accent} primary={primaryColor} style={settings.headerStyle} gradient={theme.gradient} />
                    <div className="text-sm leading-relaxed opacity-80 print:text-black"><MarkdownText text={data.personalInfo.summary} /></div>
                 </div>
              )}
              {data.settings.sectionOrder.filter(id => !['skills','languages','awards','interests'].includes(id)).map(id => renderSection(id))}
              
              {data.personalInfo.signature && (
               <div className="mt-12 pt-4 border-t border-slate-200 w-48 break-inside-avoid">
                   <p className="font-handwriting text-xl text-slate-800 dark:text-slate-300 print:text-black" style={{fontFamily: 'cursive'}}>{data.personalInfo.signature}</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );

  const renderGridComplex = () => (
     <div className={`p-${8 * settings.marginScale} h-full bg-white relative`}>
        <div className="grid grid-cols-12 gap-4 mb-12 border-b-4 border-black pb-4">
           <div className="col-span-8">
              <h1 className={`text-6xl font-bold tracking-tighter leading-none mb-2 ${headerFontClass} print:text-black`} style={{color: primaryColor}}>{data.personalInfo.fullName}</h1>
              <p className="text-2xl font-light tracking-wide print:text-black">{data.personalInfo.jobTitle}</p>
           </div>
           <div className="col-span-4 text-right flex flex-col items-end justify-end">
              <ContactList vertical className="items-end" />
           </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
           <div className="col-span-4">
              {data.settings.visibleSections.summary && data.personalInfo.summary && (
                 <div className="mb-8">
                    <h3 className="font-bold text-sm uppercase mb-2 border-t-2 border-black pt-1 print:text-black">Sobre</h3>
                    <div className="text-sm leading-relaxed print:text-black"><MarkdownText text={data.personalInfo.summary} /></div>
                 </div>
              )}
              {renderSection('skills')}
              {renderSection('education')}
              {renderSection('languages')}
              {renderSection('interests')}
           </div>
           <div className="col-span-8">
              {data.settings.sectionOrder.filter(id => !['skills','education','languages','interests'].includes(id)).map(id => (
                  <div key={id} className="mb-8 border-l-2 border-slate-100 pl-4">
                      {renderSection(id)}
                  </div>
              ))}
           </div>
        </div>
     </div>
  );

  const renderGeometric = () => (
     <div className={`p-${8 * settings.marginScale} h-full relative overflow-hidden print:print-color-adjust-exact`} style={{backgroundColor: colors.bg}}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl print:hidden" style={{backgroundColor: colors.primary}}></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl print:hidden" style={{backgroundColor: colors.accent}}></div>
        <div className="absolute top-20 left-10 w-20 h-20 rounded-lg rotate-12 opacity-5" style={{backgroundColor: colors.secondary}}></div>

        <div className="relative z-10 flex flex-col items-center mb-10">
           {data.personalInfo.photoUrl && <img src={data.personalInfo.photoUrl} className={`w-28 h-28 shadow-lg mb-4 object-cover ${getPhotoClasses()}`}/>}
           <h1 className={`text-4xl font-bold mb-1 ${headerFontClass} print:text-black`}>{data.personalInfo.fullName}</h1>
           <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white shadow-sm print:border" style={{color: colors.accent}}>{data.personalInfo.jobTitle}</span>
           <div className="mt-4 p-3 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white print:border-slate-200">
              <ContactList />
           </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8">
           <div className="col-span-2 md:col-span-1 space-y-2">
              {renderSection('experience')}
              {renderSection('projects')}
           </div>
           <div className="col-span-2 md:col-span-1 space-y-2">
              {data.settings.visibleSections.summary && data.personalInfo.summary && (
                 <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-slate-100 print:border-slate-200 break-inside-avoid">
                    <h3 className="font-bold text-sm uppercase mb-2 print:text-black" style={{color: colors.primary}}>Resumo</h3>
                    <p className="text-sm opacity-80 print:text-black"><MarkdownText text={data.personalInfo.summary} /></p>
                 </div>
              )}
              {renderSection('education')}
              {renderSection('skills')}
              {renderSection('languages')}
              {renderSection('interests')}
           </div>
        </div>
     </div>
  );

  if (mode === 'cover') {
      return (
          <div className={`p-${12 * settings.marginScale} max-w-3xl mx-auto h-full`}>
             <div className="border-b-2 border-slate-800 pb-6 mb-8">
                 <h1 className="text-4xl font-bold uppercase tracking-wider mb-2" style={{color: primaryColor}}>{data.personalInfo.fullName}</h1>
                 <p className="text-lg opacity-80 mb-4">{data.personalInfo.jobTitle}</p>
                 <ContactList />
             </div>
             
             <div className="mb-8">
                 <p className="font-bold">{data.coverLetter.recipientName || 'Hiring Manager'}</p>
                 <p>{data.coverLetter.companyName}</p>
             </div>

             <div className="whitespace-pre-wrap text-sm leading-loose opacity-90 text-justify font-serif">
                 {data.coverLetter.content || "Use a aba 'Carta' no editor para gerar seu conteúdo..."}
             </div>
          </div>
      )
  }

  let Content = renderSingleColumn;
  if (layout === 'sidebar-left' || layout === 'sidebar-right') Content = renderSidebarLeft;
  if (layout === 'grid-complex') Content = renderGridComplex;
  if (theme.id === 'geometric-pop') Content = renderGeometric;
  if (theme.id === 'tech-dark') Content = renderSingleColumn; 

  const patternStyle = getBackgroundStyle();
  const glassClass = settings.glassmorphism ? 'backdrop-blur-sm bg-opacity-90' : '';

  return (
    <div className={`w-full h-full min-h-full print:h-auto overflow-hidden print:overflow-visible bg-white relative print:shadow-none print:!bg-white print:!text-black ${settings.grayscale ? 'grayscale' : ''} ${glassClass}`} style={{...style, ...patternStyle}}>
        {/* Page Guide Overlay */}
        <div className="absolute top-[1122px] left-0 w-full border-b-2 border-dashed border-red-300 opacity-50 z-50 pointer-events-none print:hidden flex items-center justify-center">
            <span className="bg-red-100 text-red-500 text-[10px] px-1">Fim da Página 1 (A4)</span>
        </div>
        
        <Content />
        {settings.showQrCode && data.personalInfo.linkedin && (
           <div className="absolute top-4 right-4 print:block hidden">
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(data.personalInfo.linkedin)}`} className="w-16 h-16 opacity-80" />
           </div>
        )}
    </div>
  );
};
