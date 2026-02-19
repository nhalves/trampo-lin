
import React, { useMemo } from 'react';
import { ResumeData, ThemeConfig, ResumeSettings, Skill } from '../../types';
import { MapPin, Mail, Phone, Linkedin, Globe, Github, Twitter, ExternalLink, Dribbble, Youtube, Facebook, Instagram, Hash, Star, Code, Heart, PenTool, Award, BookOpen, Zap, Briefcase, GraduationCap } from 'lucide-react';

interface PreviewProps {
    data: ResumeData;
    theme: ThemeConfig;
    mode?: 'resume' | 'cover';
}

// Utilitários fora do componente para estabilidade
// #17 — getLuminance extraída para evitar duplicação de cálculo YIQ
const getLuminance = (hexcolor: string): number => {
    if (!hexcolor) return 0;
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000;
};
const getContrastColor = (hexcolor: string) => getLuminance(hexcolor) >= 128 ? '#0f172a' : '#ffffff';
const isColorTooLight = (hexcolor: string) => getLuminance(hexcolor) >= 200;

// #16 — sanitizeLink valida protocolo para evitar URIs maliciosas (ex: javascript:)
const sanitizeLink = (link: string) => {
    if (!link) return '';
    try {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`);
        if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return '';
        return url.toString();
    } catch {
        if (link.includes('@')) return `mailto:${link}`;
        return '';
    }
};

// Componente de texto leve
const MarkdownText = React.memo(({ text, className }: { text: string, className?: string }) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
        <div className={`break-words ${className}`}>
            {lines.map((line, i) => {
                // #8 — key composta para melhor diffing quando o texto muda
                const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
                const renderedLine = parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) return <strong key={`${i}-${j}`}>{part.slice(2, -2)}</strong>;
                    if (part.startsWith('*') && part.endsWith('*')) return <em key={`${i}-${j}`}>{part.slice(1, -1)}</em>;
                    return part;
                });
                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                    return <div key={`line-${i}`} className="flex gap-2 ml-1 mb-0.5"><span className="opacity-70">•</span><span className="flex-1">{renderedLine.slice(1)}</span></div>;
                }
                return <span key={`line-${i}`} className="block min-h-[1em] mb-0.5">{renderedLine}</span>;
            })}
        </div>
    );
});

const DateDisplay = React.memo(({ date, formatStr, className }: { date: string, formatStr?: string, className?: string }) => {
    if (!date) return null;
    let display = date;

    try {
        if (typeof date === 'string') {
            if (date.length > 10 || isNaN(Date.parse(date)) && !date.match(/\d/)) {
                return <span className={`capitalize tabular-nums ${className}`}>{date}</span>;
            }

            let d: Date | null = null;
            if (date.match(/^\d{4}-\d{2}$/)) { const [y, m] = date.split('-').map(Number); d = new Date(y, m - 1); }
            else if (date.match(/^\d{2}\/\d{4}$/)) { const [m, y] = date.split('/').map(Number); d = new Date(y, m - 1); }
            else if (date.match(/^\d{4}$/)) { d = new Date(Number(date), 0); }

            if (d && !isNaN(d.getTime())) {
                const locale = 'pt-BR';
                if (formatStr === 'yyyy') display = d.getFullYear().toString();
                else if (formatStr === 'MM/yyyy') display = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                else if (formatStr === 'full') display = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d);
                else display = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(d).replace('.', '');
            }
        }
    } catch (e) {
        display = date;
    }
    return <span className={`capitalize tabular-nums ${className}`}>{display}</span>;
});

const ContactItem = ({ icon: Icon, text, link, style, iconStyle }: any) => {
    if (!text) return null;
    const DisplayIcon = link ? (text.includes('github') ? Github : text.includes('linkedin') ? Linkedin : Icon) : Icon;
    const safeLink = link ? sanitizeLink(link) : undefined;
    return (
        <div className="flex items-center gap-2 mb-1.5 break-inside-avoid break-all" style={style}>
            <DisplayIcon size={14} style={iconStyle} className="flex-shrink-0" />
            {safeLink ? (<a href={safeLink} target="_blank" rel="noreferrer" className="hover:underline text-[inherit] print:no-underline">{text}</a>) : <span>{text}</span>}
        </div>
    );
};

const SectionTitle = ({ title, theme, settings, customIcon }: any) => {
    const { colors, id } = theme;
    const { headerFont, headerStyle } = settings;
    const primary = settings.primaryColor || colors.primary;
    let containerClass = "mb-4 break-after-avoid break-inside-avoid flex items-center gap-3";
    let textClass = `text-sm font-bold uppercase tracking-wider ${headerFont}`;
    let textStyle: any = { color: primary };

    if (headerStyle === 'underline') { containerClass += " border-b-2 pb-1"; textStyle.borderColor = colors.accent; }
    else if (headerStyle === 'box') { textClass += " px-3 py-1.5 rounded-md"; textStyle = { backgroundColor: colors.accent, color: getContrastColor(colors.accent) }; }
    else if (headerStyle === 'left-bar') { containerClass += " border-l-4 pl-3"; textStyle = { color: colors.text }; textStyle.borderColor = colors.accent; }
    if (id === 'swiss-international') { textClass = "text-lg font-black uppercase tracking-tighter border-b-4 border-black pb-1 mb-6"; textStyle = { color: '#000' }; }
    if (id === 'ivy-league') { containerClass = "mb-4 pb-1 border-b border-double border-slate-300 flex items-center gap-2 justify-center text-center"; textClass = "text-base font-serif font-bold tracking-widest text-center"; textStyle = { color: primary }; }

    return (
        <div className={containerClass} style={headerStyle === 'underline' ? { borderColor: `${primary}40` } : {}}>
            {id === 'tech-lead-dark' && <span className="text-cyan-400 font-mono">//</span>}
            {customIcon && headerStyle !== 'box' && headerStyle !== 'left-bar' && <span style={{ color: colors.accent }}>{customIcon}</span>}
            <h3 className={textClass} style={textStyle}>{title}</h3>
            {headerStyle === 'simple' && <div className="flex-1 h-px bg-slate-200 print:bg-slate-300 ml-2" style={{ backgroundColor: `${primary}20` }}></div>}
        </div>
    );
};

const SkillPill = ({ name, level, theme, settings }: any) => {
    const primary = settings.primaryColor || theme.colors.primary;
    const isDark = theme.id.includes('dark');
    if (settings.skillStyle === 'hidden') return <span className="mr-3 mb-1">• {name}</span>;
    if (settings.skillStyle === 'bar') {
        return (
            <div className="w-full mb-2 break-inside-avoid">
                <div className="flex justify-between text-xs mb-0.5 font-medium"><span>{name}</span></div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden print:border print:border-slate-200"><div className="h-full print:print-color-adjust-exact" style={{ width: `${level * 20}%`, backgroundColor: primary }}></div></div>
            </div>
        );
    }
    const bgColor = isDark ? 'rgba(255,255,255,0.15)' : `${theme.colors.accent}15`;
    const textColor = isDark ? '#fff' : (isColorTooLight(primary) ? '#1e293b' : primary);
    const borderColor = isDark ? 'rgba(255,255,255,0.2)' : `${theme.colors.accent}30`;

    return (
        <span className="px-2.5 py-1 rounded-md text-xs font-semibold border print:print-color-adjust-exact break-inside-avoid" style={{ backgroundColor: bgColor, color: textColor, borderColor: borderColor }}>
            {name}
        </span>
    );
};

export const Preview: React.FC<PreviewProps> = React.memo(({ data, theme, mode = 'resume' }) => {
    const { settings, personalInfo } = data;
    const { colors, layout, id } = theme;
    const primary = settings.primaryColor || colors.primary;
    const hFont = settings.headerFont || theme.fonts?.header || 'font-sans';
    const bFont = settings.bodyFont || theme.fonts?.body || 'font-sans';

    const renderList = (sectionId: string) => {
        const items = (data as any)[sectionId];
        if (!items || items.length === 0 || !settings.visibleSections[sectionId]) return null;
        let SectionIcon = null;
        if (sectionId === 'experience') SectionIcon = <Briefcase size={16} />;
        if (sectionId === 'education') SectionIcon = <GraduationCap size={16} />;
        if (sectionId === 'skills') SectionIcon = <Zap size={16} />;
        const titleMap: any = { experience: 'Experiência', education: 'Educação', skills: 'Habilidades', projects: 'Projetos', volunteer: 'Voluntariado', awards: 'Prêmios', interests: 'Interesses', publications: 'Publicações', references: 'Referências', languages: 'Idiomas' };
        const title = titleMap[sectionId] || sectionId;

        return (
            <div key={sectionId} className="mb-6 section-block">
                <SectionTitle title={title} theme={theme} settings={settings} customIcon={SectionIcon} />
                {['skills', 'languages', 'interests'].includes(sectionId) ? (
                    <div className={`flex flex-wrap ${settings.skillStyle === 'bar' ? 'flex-col gap-0' : 'gap-2'}`}>
                        {items.map((item: any, i: number) => (typeof item === 'string' ? <SkillPill key={i} name={item} level={5} theme={theme} settings={settings} /> : <SkillPill key={item.id} name={item.name} level={item.level || 5} theme={theme} settings={settings} />))}
                    </div>
                ) : (
                    <div className={`space-y-4 ${id === 'timeline-pro' ? 'border-l-2 border-slate-200 pl-4 ml-1.5' : ''}`}>
                        {items.map((item: any) => (
                            <div key={item.id} className="break-inside-avoid relative">
                                {id === 'timeline-pro' && <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white print:print-color-adjust-exact" style={{ backgroundColor: primary }}></div>}
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h4 className={`text-base font-bold ${hFont}`} style={{ color: id.includes('dark') ? '#fff' : '#1e293b' }}>{item.role || item.school || item.title || item.name}</h4>
                                    {(item.startDate || item.date) && settings.showDuration && (<span className="text-xs font-medium opacity-70 whitespace-nowrap"><DateDisplay date={item.startDate || item.date} formatStr={settings.dateFormat} /> {item.endDate && ` - `} {item.endDate && (item.current ? 'Pres.' : <DateDisplay date={item.endDate} formatStr={settings.dateFormat} />)}</span>)}
                                </div>
                                {(item.company || item.degree || item.organization || item.publisher) && (<div className="text-sm font-semibold mb-1.5" style={{ color: colors.accent }}>{item.company || item.degree || item.organization || item.publisher} {item.location && <span className="opacity-70 font-normal text-slate-500"> • {item.location}</span>}</div>)}
                                {item.description && (<MarkdownText text={item.description} className={`text-sm opacity-90 leading-relaxed text-justify ${bFont}`} />)}
                                {item.url && <a href={sanitizeLink(item.url)} target="_blank" className="text-xs underline mt-1 block opacity-70 break-all">{item.url}</a>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderPhoto = (size: string = 'w-24 h-24') => {
        if (!personalInfo.photoUrl) return null;
        let shape = 'rounded-lg'; if (settings.photoShape === 'circle') shape = 'rounded-full'; if (settings.photoShape === 'square') shape = 'rounded-none';
        return <img src={personalInfo.photoUrl} alt={`Foto de perfil de ${personalInfo.fullName || 'usuário'}`} className={`${size} object-cover ${shape} mb-4 shadow-sm border-2 border-white flex-shrink-0`} style={{ borderColor: id === 'creative-blob' ? 'transparent' : '#fff' }} />;
    };

    // --- LAYOUTS UPDATED TO USE MIN-H-FULL INSTEAD OF H-FULL ---

    const LayoutSidebarLeft = () => {
        const isDarkSidebar = id === 'tech-lead-dark';
        const sbBg = isDarkSidebar ? '#0f172a' : colors.bg === '#ffffff' ? '#f8fafc' : colors.primary;
        const sbText = isDarkSidebar ? '#e2e8f0' : getContrastColor(sbBg);
        const mainBg = '#ffffff';
        return (
            <div className="flex min-h-full">
                <div className="w-[30%] p-6 flex flex-col print:print-color-adjust-exact" style={{ backgroundColor: sbBg, color: sbText }}>
                    <div className="mb-8 text-center">
                        {renderPhoto('w-32 h-32 mx-auto')}
                        {id !== 'modern-slate' && (<> <h2 className={`text-xl font-bold leading-tight mb-2 ${hFont}`}>{personalInfo.fullName}</h2> <p className={`text-sm opacity-80 ${bFont}`}>{personalInfo.jobTitle}</p> </>)}
                    </div>
                    <div className="space-y-6">
                        <div className="mb-6"><h3 className="text-xs font-bold uppercase tracking-widest mb-3 border-b pb-1 opacity-70" style={{ borderColor: sbText }}>Contato</h3><div className="flex flex-col gap-2 text-xs opacity-90"><ContactItem icon={Mail} text={personalInfo.email} /><ContactItem icon={Phone} text={personalInfo.phone} /><ContactItem icon={MapPin} text={personalInfo.address} /><ContactItem icon={Linkedin} text={personalInfo.linkedin} link={personalInfo.linkedin} /><ContactItem icon={Globe} text={personalInfo.website} link={personalInfo.website} /><ContactItem icon={Github} text={personalInfo.github} link={personalInfo.github} /></div></div>
                        {renderList('skills')}{renderList('languages')}{renderList('interests')}{renderList('awards')}
                    </div>
                </div>
                <div className="flex-1 p-8 bg-white" style={{ backgroundColor: mainBg }}>
                    {id === 'modern-slate' && (<div className="mb-8 border-b-2 border-slate-100 pb-6"><h1 className={`text-4xl font-bold mb-1 ${hFont}`} style={{ color: primary }}>{personalInfo.fullName}</h1><p className={`text-xl text-slate-500 font-medium ${bFont}`}>{personalInfo.jobTitle}</p></div>)}
                    {settings.visibleSections.summary && personalInfo.summary && (<div className="mb-8"><SectionTitle title="Resumo Profissional" theme={theme} settings={settings} /><MarkdownText text={personalInfo.summary} className={`text-sm leading-relaxed opacity-90 text-justify ${bFont}`} /></div>)}
                    {settings.sectionOrder.filter(s => !['skills', 'languages', 'interests', 'awards'].includes(s)).map(renderList)}
                </div>
            </div>
        );
    };

    const LayoutBanner = () => {
        return (
            <div className="min-h-full bg-white relative">
                <div className="relative p-10 pb-16 text-white print:print-color-adjust-exact overflow-hidden" style={{ background: theme.gradient || primary }}>
                    {id === 'creative-blob' && (<> <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div> <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div> </>)}
                    <div className="relative z-10 flex items-center gap-6">{renderPhoto('w-28 h-28 border-4 border-white/30')}<div><h1 className={`text-5xl font-black mb-2 tracking-tight ${hFont}`}>{personalInfo.fullName}</h1><p className={`text-2xl opacity-90 font-light ${bFont}`}>{personalInfo.jobTitle}</p></div></div>
                    <div className="absolute bottom-4 right-8 flex gap-4 text-xs font-bold opacity-80">{personalInfo.email && <span className="flex items-center gap-1"><Mail size={12} /> {personalInfo.email}</span>}{personalInfo.phone && <span className="flex items-center gap-1"><Phone size={12} /> {personalInfo.phone}</span>}{personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin size={12} /> LinkedIn</span>}</div>
                </div>
                <div className="p-10 -mt-8 grid grid-cols-12 gap-8 relative z-20">
                    <div className="col-span-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">{settings.visibleSections.summary && personalInfo.summary && (<div className="mb-8 p-4 bg-slate-50 rounded-lg border-l-4 border-l-[var(--primary)]" style={{ '--primary': primary } as any}><MarkdownText text={personalInfo.summary} className="text-sm italic opacity-80" /></div>)}{settings.sectionOrder.filter(s => !['skills', 'languages', 'interests', 'awards', 'education'].includes(s)).map(renderList)}</div>
                    <div className="col-span-4 space-y-6"><div className="bg-slate-50 p-5 rounded-xl border border-slate-100">{renderList('education')}{renderList('skills')}{renderList('languages')}{renderList('awards')}</div></div>
                </div>
            </div>
        );
    };

    const LayoutSingleColumn = () => {
        const isCEO = id === 'executive-gold';
        return (
            <div className="p-12 min-h-full bg-white max-w-4xl mx-auto">
                <div className={`text-center mb-10 ${isCEO ? 'border-b-2 border-black pb-8' : ''}`}>{renderPhoto('w-24 h-24 mx-auto mb-4')}<h1 className={`text-4xl sm:text-5xl font-bold mb-2 ${hFont} ${isCEO ? 'uppercase tracking-widest' : ''}`} style={{ color: isCEO ? '#000' : primary }}>{personalInfo.fullName}</h1><p className={`text-lg sm:text-xl text-slate-500 mb-4 ${bFont} ${isCEO ? 'font-serif italic' : ''}`}>{personalInfo.jobTitle}</p><div className="flex flex-wrap justify-center gap-4 text-sm opacity-80"><ContactItem icon={Mail} text={personalInfo.email} /><ContactItem icon={Phone} text={personalInfo.phone} /><ContactItem icon={Linkedin} text={personalInfo.linkedin} link={personalInfo.linkedin} /><ContactItem icon={Globe} text={personalInfo.website} link={personalInfo.website} /></div></div>
                {settings.visibleSections.summary && personalInfo.summary && (<div className={`mb-10 text-center mx-auto max-w-2xl ${isCEO ? 'text-base leading-loose font-serif' : 'text-sm opacity-80'}`}><MarkdownText text={personalInfo.summary} /></div>)}
                <div className="space-y-2">{settings.sectionOrder.map(renderList)}</div>
            </div>
        );
    };

    const LayoutGridComplex = () => {
        return (
            <div className="p-8 min-h-full bg-white font-sans">
                <div className="grid grid-cols-12 gap-6 h-full">
                    <div className="col-span-12 mb-8 border-b-8 border-black pb-6"><h1 className="text-7xl font-black tracking-tighter uppercase leading-none mb-2" style={{ color: primary }}>{personalInfo.fullName}</h1><div className="flex justify-between items-end"><p className="text-2xl font-bold uppercase tracking-wide bg-black text-white px-2 inline-block">{personalInfo.jobTitle}</p><div className="text-right text-xs font-mono"><p>{personalInfo.email}</p><p>{personalInfo.phone}</p><p>{personalInfo.address}</p></div></div></div>
                    <div className="col-span-4 pr-6 border-r-2 border-slate-100">{settings.visibleSections.summary && personalInfo.summary && (<div className="mb-10"><h3 className="font-black uppercase mb-2 text-sm">Bio</h3><MarkdownText text={personalInfo.summary} className="text-sm font-medium leading-snug" /></div>)}{renderList('skills')}{renderList('education')}{renderList('languages')}</div>
                    <div className="col-span-8">{settings.sectionOrder.filter(s => !['skills', 'education', 'languages', 'summary'].includes(s)).map(renderList)}</div>
                </div>
            </div>
        );
    };

    if (mode === 'cover') {
        return (
            <div className={`p-12 min-h-full bg-white max-w-3xl mx-auto flex flex-col ${bFont}`}>
                <div className="border-b-2 border-slate-800 pb-6 mb-10"><h1 className={`text-4xl font-bold uppercase tracking-wider mb-2 ${hFont}`} style={{ color: primary }}>{personalInfo.fullName}</h1><p className="text-lg opacity-80">{personalInfo.jobTitle}</p><div className="mt-4 flex flex-wrap gap-4 text-sm opacity-70"><ContactItem icon={Mail} text={personalInfo.email} /><ContactItem icon={Phone} text={personalInfo.phone} /></div></div>
                <div className="mb-10 text-sm"><p className="font-bold text-lg">{data.coverLetter.recipientName || 'Ao Gestor de Contratação'}</p><p className="text-slate-600">{data.coverLetter.companyName}</p><p className="text-slate-400 mt-1">{new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                <div className="whitespace-pre-wrap text-base leading-loose opacity-90 text-justify flex-1 break-words">{data.coverLetter.content || "Use a aba 'Carta' no editor para gerar seu conteúdo com IA..."}</div>
                {personalInfo.signature && (<div className="mt-12 pt-4 w-48"><p className="font-handwriting text-2xl text-slate-800" style={{ fontFamily: 'cursive' }}>{personalInfo.signature}</p></div>)}
            </div>
        );
    }

    let RenderLayout = LayoutSingleColumn;
    if (layout === 'sidebar-left' || layout === 'sidebar-right') RenderLayout = LayoutSidebarLeft;
    if (layout === 'banner') RenderLayout = LayoutBanner;
    if (layout === 'grid-complex') RenderLayout = LayoutGridComplex;
    if (layout === 'stacked' || id === 'ivy-league') RenderLayout = LayoutSingleColumn;

    const styleVars = { '--primary': primary, '--text': colors.text, '--bg': colors.bg, fontSize: `${settings.fontScale * 0.9}rem`, lineHeight: settings.lineHeight } as React.CSSProperties;
    const patternStyle = settings.backgroundPattern !== 'none' ? { backgroundImage: settings.backgroundPattern === 'dots' ? `radial-gradient(${colors.accent}20 1px, transparent 1px)` : settings.backgroundPattern === 'grid' ? `linear-gradient(${colors.accent}10 1px, transparent 1px), linear-gradient(90deg, ${colors.accent}10 1px, transparent 1px)` : undefined, backgroundSize: '24px 24px' } : {};

    return (
        <div className={`w-full min-h-full print:h-auto overflow-hidden print:overflow-visible relative bg-white shadow-2xl ${settings.grayscale ? 'grayscale' : ''}`} style={{ ...styleVars, ...patternStyle }}>
            <style>{`@media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .section-block { break-inside: avoid; } }`}</style>
            <RenderLayout />
            {settings.watermark && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0 overflow-hidden"><span className="text-[12rem] font-black -rotate-45 uppercase">Rascunho</span></div>)}
        </div>
    );
});
