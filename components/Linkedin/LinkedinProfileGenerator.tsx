
import React, { useState } from 'react';
import { ResumeData } from '../../types';
import { X, Sparkles, User, Copy, Briefcase, Wand2, Linkedin, Check, Globe, MapPin, Building, Palette } from 'lucide-react';
import { generateLinkedinHeadline, generateLinkedinAbout, rewriteExperienceForLinkedin } from '../../services/geminiService';

interface LinkedinGeneratorProps {
    data: ResumeData;
    onUpdate: (data: ResumeData) => void;
    onClose: () => void;
    onShowToast: (msg: string) => void;
}

const TONES = [
    { id: 'Professional', label: 'Executivo', desc: 'Formal, focado em resultados e liderança.' },
    { id: 'Storytelling', label: 'Narrativa', desc: 'Engajador, humano, conta uma história (Jornada do Herói).' },
    { id: 'Technical', label: 'Especialista', desc: 'Focado em hard skills, ferramentas e competência técnica.' },
    { id: 'Enthusiastic', label: 'Criativo', desc: 'Energético, inovador, usa emojis e tom vibrante.' },
];

export const LinkedinProfileGenerator: React.FC<LinkedinGeneratorProps> = ({ data, onUpdate, onClose, onShowToast }) => {
    const [loadingAI, setLoadingAI] = useState<string | null>(null);
    const [selectedTone, setSelectedTone] = useState('Professional');
    const [linkedinHeadlines, setLinkedinHeadlines] = useState<string[]>([]);
    const [linkedinAbout, setLinkedinAbout] = useState('');
    const [linkedinExps, setLinkedinExps] = useState<Record<string, string>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        onShowToast("Copiado para área de transferência!");
    };

    const handleAIHeadline = async () => {
        setLoadingAI('headline');
        const res = await generateLinkedinHeadline(data, selectedTone);
        setLinkedinHeadlines(res);
        setLoadingAI(null);
    };

    const handleGenerateLinkedinAbout = async () => {
        setLoadingAI('linkedin-about');
        const text = await generateLinkedinAbout(data, selectedTone);
        setLinkedinAbout(text);
        setLoadingAI(null);
    };

    const handleRewriteExpForLinkedin = async (exp: any) => {
        setLoadingAI(`exp-${exp.id}`);
        const text = await rewriteExperienceForLinkedin(exp, selectedTone);
        setLinkedinExps(prev => ({ ...prev, [exp.id]: text }));
        setLoadingAI(null);
    };

    const updateHeadline = (newHeadline: string) => {
        onUpdate({ ...data, personalInfo: { ...data.personalInfo, jobTitle: newHeadline } });
        onShowToast("Headline aplicado ao currículo!");
    };

    return (
        <div className="fixed inset-0 z-50 bg-white/95 dark:bg-black/90 backdrop-blur-md flex flex-col animate-fade-in">
            {/* Header */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-[#0077b5] p-1.5 rounded-lg text-white">
                        <Linkedin size={24} className="fill-current" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-none">Otimizador de Perfil</h2>
                        <p className="text-xs text-slate-500 font-medium">Torne seu perfil irresistível para recrutadores</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {TONES.map(tone => (
                            <button
                                key={tone.id}
                                onClick={() => setSelectedTone(tone.id)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedTone === tone.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                title={tone.desc}
                            >
                                {tone.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 custom-scrollbar p-4 md:p-8">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Generator Controls */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* 1. Header Section (Visual Preview) */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 relative group">
                            {/* Banner Mockup */}
                            <div className="h-32 bg-[#a0b4b7] relative overflow-hidden">
                                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-1.5 rounded-full hover:bg-white/30 cursor-pointer transition-colors" title="Editar Banner (Simulação)">
                                    <Palette size={16} className="text-white" />
                                </div>
                            </div>

                            <div className="px-6 pb-6 relative">
                                {/* Profile Pic */}
                                <div className="absolute -top-16 left-6 p-1 bg-white dark:bg-slate-900 rounded-full">
                                    <div className="w-32 h-32 rounded-full bg-slate-200 overflow-hidden border border-slate-100 dark:border-slate-800">
                                        {data.personalInfo.photoUrl ? (
                                            <img src={data.personalInfo.photoUrl} alt={`Foto de perfil de ${data.personalInfo.fullName || 'usuário'}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><User size={48} /></div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                {data.personalInfo.fullName || 'Seu Nome'}
                                            </h3>

                                            {/* Headline Editor */}
                                            <div className="mt-2 group/edit relative">
                                                <div className="text-base text-slate-900 dark:text-slate-200 font-medium">
                                                    {data.personalInfo.jobTitle || 'Seu título profissional'}
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                                    {data.personalInfo.address || 'Localização'} <span className="text-blue-600 font-bold hover:underline cursor-pointer">Informações de contato</span>
                                                </p>

                                                <button
                                                    onClick={handleAIHeadline}
                                                    disabled={!!loadingAI}
                                                    className="absolute right-0 top-0 opacity-0 group-hover/edit:opacity-100 transition-opacity bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1 hover:bg-blue-700 active:scale-95 z-10"
                                                >
                                                    {loadingAI === 'headline' ? '...' : <><Sparkles size={12} /> Gerar Headline</>}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block">
                                            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-md flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800/50">
                                                In
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Suggestions for Headline */}
                                    {linkedinHeadlines.length > 0 && (
                                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 animate-slide-in">
                                            <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1"><Sparkles size={10} /> Sugestões de IA ({selectedTone})</p>
                                            <div className="space-y-2">
                                                {linkedinHeadlines.map((h, i) => (
                                                    <div key={i} className="group/item flex gap-2">
                                                        <button onClick={() => updateHeadline(h)} className="flex-1 text-left text-sm p-2.5 bg-white dark:bg-slate-800 hover:ring-2 ring-blue-500/50 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                                                            {h}
                                                        </button>
                                                        <button onClick={() => handleCopy(h, `h-${i}`)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600">
                                                            {copiedId === `h-${i}` ? <Check size={16} /> : <Copy size={16} />}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-2">
                                        <button className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors">Tenho interesse em...</button>
                                        <button className="border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Adicionar seção</button>
                                        <button className="border border-slate-400 text-slate-600 dark:text-slate-300 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Mais</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. About Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sobre</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGenerateLinkedinAbout}
                                        disabled={!!loadingAI}
                                        className="text-sm flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-all active:scale-95"
                                    >
                                        {loadingAI === 'linkedin-about' ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div> Escrevendo...</> : <><Wand2 size={16} /> Reescrever ({selectedTone})</>}
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                {linkedinAbout ? (
                                    <textarea
                                        value={linkedinAbout}
                                        onChange={(e) => setLinkedinAbout(e.target.value)}
                                        className="w-full h-64 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed resize-none text-base font-sans"
                                    />
                                ) : (
                                    <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                                        <p className="text-sm font-medium mb-2">Seu "Sobre" ainda está vazio.</p>
                                        <button onClick={handleGenerateLinkedinAbout} className="text-blue-600 hover:underline text-sm font-bold">Gerar com IA</button>
                                    </div>
                                )}

                                {linkedinAbout && (
                                    <button onClick={() => handleCopy(linkedinAbout, 'about')} className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600 text-slate-500 hover:text-blue-600 transition-all active:scale-90" title="Copiar">
                                        {copiedId === 'about' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 3. Experience Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Experiência</h3>
                            <div className="space-y-6">
                                {data.experience.map((exp, index) => (
                                    <div key={exp.id} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 pb-6 last:pb-0">
                                        {/* Timeline dot */}
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-700"></div>

                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                            <div>
                                                <h4 className="font-bold text-base text-slate-900 dark:text-white">{exp.role}</h4>
                                                <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{exp.company}</div>
                                                <div className="text-xs text-slate-500 mt-1">{exp.startDate} - {exp.current ? 'Presente' : exp.endDate}</div>
                                            </div>
                                            <button
                                                onClick={() => handleRewriteExpForLinkedin(exp)}
                                                disabled={!!loadingAI}
                                                className="text-xs bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95 w-fit"
                                            >
                                                {loadingAI === `exp-${exp.id}` ? '...' : <><Sparkles size={12} /> Otimizar para LinkedIn</>}
                                            </button>
                                        </div>

                                        {linkedinExps[exp.id] ? (
                                            <div className="relative group/exp">
                                                <textarea
                                                    value={linkedinExps[exp.id]}
                                                    readOnly
                                                    className="w-full h-auto min-h-[140px] p-3 border border-blue-200 dark:border-blue-900 rounded-lg text-sm text-slate-800 dark:text-slate-200 bg-blue-50/30 dark:bg-blue-900/5 leading-relaxed resize-y font-sans"
                                                />
                                                <button onClick={() => handleCopy(linkedinExps[exp.id], exp.id)} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 rounded shadow-sm hover:text-blue-600 text-slate-400 transition-colors border border-slate-100 dark:border-slate-700">
                                                    {copiedId === exp.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                </button>
                                                <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1"><Sparkles size={10} /> Otimizado com método CAR (Contexto, Ação, Resultado)</div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                                {exp.description || 'Sem descrição.'}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Tips & Stats */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 sticky top-4">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Globe size={18} /> Idioma e URL</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Idioma do Perfil</span>
                                    <span className="font-medium dark:text-white">Português</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">URL Pública</span>
                                    <span className="font-medium text-blue-600 truncate max-w-[150px]">{data.personalInfo.linkedin || 'linkedin.com/in/...'}</span>
                                </div>
                                <hr className="border-slate-100 dark:border-slate-800" />
                                <div>
                                    <h5 className="text-xs font-bold uppercase text-slate-400 mb-3">Checklist de Otimização</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            {data.personalInfo.photoUrl ? <Check size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                                            Foto Profissional
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            {linkedinHeadlines.length > 0 ? <Check size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                                            Headline Otimizado
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            {linkedinAbout.length > 50 ? <Check size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                                            Sobre (Bio)
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            {Object.keys(linkedinExps).length > 0 ? <Check size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                                            Experiências com Resultados
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
                            <h4 className="font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-yellow-300" /> Dica Pro</h4>
                            <p className="text-xs opacity-90 leading-relaxed mb-3">
                                Recrutadores buscam por palavras-chave. Certifique-se de que as tecnologias e ferramentas listadas no seu CV também aparecem no seu "Sobre" e nas "Experiências" do LinkedIn.
                            </p>
                            <div className="text-xs font-bold bg-white/20 p-2 rounded inline-block">
                                Tone: {TONES.find(t => t.id === selectedTone)?.label}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
