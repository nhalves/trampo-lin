
import React, { useState } from 'react';
import { ResumeData } from '../../types';
import { X, Sparkles, User, Copy, Briefcase, Wand2, Linkedin, Check } from 'lucide-react';
import { generateLinkedinHeadline, generateLinkedinAbout, rewriteExperienceForLinkedin } from '../../services/geminiService';

interface LinkedinGeneratorProps {
    data: ResumeData;
    onUpdate: (data: ResumeData) => void;
    onClose: () => void;
    onShowToast: (msg: string) => void;
}

export const LinkedinProfileGenerator: React.FC<LinkedinGeneratorProps> = ({ data, onUpdate, onClose, onShowToast }) => {
    const [loadingAI, setLoadingAI] = useState<string | null>(null);
    const [linkedinHeadlines, setLinkedinHeadlines] = useState<string[]>([]);
    const [linkedinAbout, setLinkedinAbout] = useState('');
    const [linkedinExps, setLinkedinExps] = useState<Record<string, string>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        onShowToast("Copiado!");
    };

    const handleAIHeadline = async () => { setLoadingAI('headline'); const res = await generateLinkedinHeadline(data); setLinkedinHeadlines(res); setLoadingAI(null); };
    const handleGenerateLinkedinAbout = async () => { setLoadingAI('linkedin-about'); const text = await generateLinkedinAbout(data); setLinkedinAbout(text); setLoadingAI(null); };
    const handleRewriteExpForLinkedin = async (exp: any) => { setLoadingAI(`exp-${exp.id}`); const text = await rewriteExperienceForLinkedin(exp); setLinkedinExps(prev => ({...prev, [exp.id]: text})); setLoadingAI(null); };
    const updateHeadline = (newHeadline: string) => { onUpdate({ ...data, personalInfo: { ...data.personalInfo, jobTitle: newHeadline } }); onShowToast("Headline aplicado!"); };

    return (
        <div className="fixed inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md flex flex-col animate-fade-in">
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/90 dark:bg-slate-900/90 shadow-sm z-10">
                <div>
                    <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2"><Linkedin className="fill-current" /> Gerador de Perfil LinkedIn</h2>
                    <p className="text-xs text-slate-500">Transforme seu currículo em um perfil social engajador.</p>
                </div>
                <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-95">Fechar</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-scale-in">
                    
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                        <div className="h-32 bg-slate-200 dark:bg-slate-800 relative bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700"></div>
                        <div className="px-6 pb-6 relative">
                            <div className="absolute -top-16 left-6 w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 overflow-hidden shadow-md">
                                {data.personalInfo.photoUrl ? <img src={data.personalInfo.photoUrl} className="w-full h-full object-cover"/> : <User className="w-full h-full p-4 text-slate-300"/>}
                            </div>
                            <div className="mt-20 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{data.personalInfo.fullName || 'Seu Nome'}</h3>
                                    
                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">Headline (Título)</label>
                                            <button onClick={handleAIHeadline} disabled={!!loadingAI} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95">
                                                {loadingAI === 'headline' ? 'Criando...' : <><Sparkles size={12}/> Sugerir c/ IA</>}
                                            </button>
                                        </div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 relative pr-12">
                                            {data.personalInfo.jobTitle || 'Seu cargo aparecerá aqui...'}
                                            <span className={`absolute right-0 top-0 text-[10px] font-bold ${(data.personalInfo.jobTitle?.length || 0) > 220 ? 'text-red-500' : 'text-slate-400'}`}>
                                                {(data.personalInfo.jobTitle?.length || 0)}/220
                                            </span>
                                        </div>
                                        
                                        {linkedinHeadlines.length > 0 && (
                                            <div className="mt-3 space-y-2 animate-slide-in">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Sugestões (Clique para aplicar):</p>
                                                {linkedinHeadlines.map((h, i) => (
                                                    <button key={i} onClick={() => updateHeadline(h)} className="w-full text-left text-xs p-2.5 bg-white dark:bg-slate-800 hover:ring-2 ring-blue-500 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                                                        {h}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <div><h4 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><User size={20} className="text-blue-600"/> Sobre (About)</h4></div>
                            <button onClick={handleGenerateLinkedinAbout} disabled={!!loadingAI} className="text-sm flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl hover:opacity-90 font-bold transition-all shadow-sm active:scale-95">{loadingAI === 'linkedin-about' ? 'Escrevendo...' : <><Wand2 size={16}/> Gerar Texto</>}</button>
                        </div>
                        <div className="relative group">
                            <textarea value={linkedinAbout} onChange={(e) => setLinkedinAbout(e.target.value)} className="w-full h-48 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed resize-none text-base" placeholder="Clique em 'Gerar Texto' para criar uma apresentação..."/>
                            {linkedinAbout && (
                                <button onClick={() => handleCopy(linkedinAbout, 'about')} className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600 text-slate-500 hover:text-blue-600 transition-all active:scale-90" title="Copiar">
                                    {copiedId === 'about' ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                                </button>
                            )}
                        </div>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="mb-6"><h4 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Briefcase size={20} className="text-blue-600"/> Experiência</h4></div>
                        <div className="space-y-6">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div><div className="font-bold text-slate-800 dark:text-white">{exp.role}</div><div className="text-sm text-slate-500">{exp.company}</div></div>
                                        <button onClick={() => handleRewriteExpForLinkedin(exp)} disabled={!!loadingAI} className="whitespace-nowrap text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 px-4 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 justify-center active:scale-95">{loadingAI === `exp-${exp.id}` ? 'Otimizando...' : <><Sparkles size={14}/> Otimizar Descrição</>}</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative"><label className="block mb-2 text-[10px] font-bold text-slate-400 uppercase">CV Original</label><div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 h-full min-h-[80px]">{exp.description || 'Sem descrição.'}</div></div>
                                        <div className="relative">
                                            <label className="block mb-2 text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1"><Linkedin size={10}/> Versão LinkedIn</label>
                                            {linkedinExps[exp.id] ? (
                                                <div className="relative h-full">
                                                    <textarea readOnly value={linkedinExps[exp.id]} className="w-full h-full p-3 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-slate-700 dark:text-slate-200 bg-blue-50 dark:bg-blue-900/10 min-h-[120px] outline-none resize-none text-base leading-relaxed"/>
                                                    <button onClick={() => handleCopy(linkedinExps[exp.id], exp.id)} className="absolute bottom-2 right-2 p-1.5 bg-white dark:bg-slate-800 rounded shadow-sm hover:text-blue-600 text-slate-400 transition-colors border border-slate-100 dark:border-slate-700 active:scale-90">
                                                        {copiedId === exp.id ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                                                    </button>
                                                </div>
                                            ) : <div className="h-full min-h-[120px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 p-4 text-center">Clique em "Otimizar" para gerar.</div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
