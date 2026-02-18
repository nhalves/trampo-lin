
import React, { useRef } from 'react';
import { User, Mail, Phone, MapPin, Linkedin, Globe, FileJson, Upload, X, Camera, Sparkles } from 'lucide-react';
import { ResumeData } from '../../../types';
import { DebouncedInput, DebouncedTextarea } from '../components/Debounced';
import { compressImage } from '../../../utils/resumeUtils';
import { analyzePhoto, generateSummary, improveText } from '../../../services/geminiService';
import { extractDominantColor } from '../../../services/integrationService';

interface PersonalInfoProps {
    data: ResumeData;
    onChange: (newData: ResumeData) => void;
    onShowToast: (msg: string) => void;
    onRequestConfirm: (title: string, msg: string, onConfirm: () => void, type?: 'danger' | 'info') => void;
    loadingAI: string | null;
    setLoadingAI: (state: string | null) => void;
}

export const PersonalInfoSection: React.FC<PersonalInfoProps> = ({ data, onChange, onShowToast, onRequestConfirm, loadingAI, setLoadingAI }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 300, 0.8);
                try {
                    const dominantColor = await extractDominantColor(compressedBase64);
                    if (dominantColor) {
                        onRequestConfirm("Cor Detectada", "Aplicar cor predominante da foto?", () => {
                            onChange({ ...data, personalInfo: { ...data.personalInfo, photoUrl: compressedBase64 }, settings: { ...data.settings, primaryColor: dominantColor } });
                        }, 'info');
                    } else {
                        onChange({ ...data, personalInfo: { ...data.personalInfo, photoUrl: compressedBase64 } });
                    }
                } catch (e) {
                    onChange({ ...data, personalInfo: { ...data.personalInfo, photoUrl: compressedBase64 } });
                }
                onShowToast("Foto carregada e otimizada!");
            } catch (err) {
                onShowToast("Erro ao processar imagem.");
            }
        }
    };

    const handlePhotoAnalysis = async () => {
        if (!data.personalInfo.photoUrl) return;
        setLoadingAI('photo');
        try {
            const analysis = await analyzePhoto(data.personalInfo.photoUrl);
            if (analysis) {
                const msg = `Nota: ${analysis.score}/100\nFeedback: ${analysis.feedback.join('. ')}`;
                onRequestConfirm("Análise da Foto", msg, () => { }, 'info');
            } else {
                onShowToast("Erro na análise.");
            }
        } catch (e) {
            onShowToast("Erro de conexão com IA.");
        } finally {
            setLoadingAI(null);
        }
    };

    const handleAIGenerateSummary = async () => {
        setLoadingAI('gen-summary');
        try {
            const summary = await generateSummary(data.personalInfo.jobTitle, data.experience);
            onChange({ ...data, personalInfo: { ...data.personalInfo, summary } });
            onShowToast("✨ Resumo criado!");
        } catch (e) {
            onShowToast("Erro ao gerar resumo.");
        } finally {
            setLoadingAI(null);
        }
    };

    const handleImproveSummary = async (action: 'shorter' | 'grammar') => {
        setLoadingAI('improving-summary');
        try {
            const improved = await improveText(data.personalInfo.summary, 'resume', data.settings.aiTone, action);
            onChange({ ...data, personalInfo: { ...data.personalInfo, summary: improved } });
            onShowToast("✨ Texto aprimorado!");
        } catch(e) {
            onShowToast("Erro ao processar texto.");
        } finally {
            setLoadingAI(null);
        }
    };

    return (
        <>
            <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative group transition-all hover:border-trampo-400">
                    {data.personalInfo.photoUrl ? (
                        <img src={data.personalInfo.photoUrl} alt={`Foto de ${data.personalInfo.fullName}`} className="w-full h-full object-cover" />
                    ) : (
                        <User size={32} className="text-slate-300" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity backdrop-blur-sm">
                        <button onClick={() => fileInputRef.current?.click()} className="text-white hover:text-blue-200 p-1"><Upload size={16} /></button>
                        {data.personalInfo.photoUrl && <button onClick={() => onChange({ ...data, personalInfo: { ...data.personalInfo, photoUrl: '' } })} className="text-white hover:text-red-200 p-1"><X size={16} /></button>}
                    </div>
                </div>
                <div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors shadow-sm active:scale-95">Carregar Foto</button>
                        {data.personalInfo.photoUrl && <button onClick={handlePhotoAnalysis} disabled={!!loadingAI} className="text-xs flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 px-3 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-bold transition-colors shadow-sm active:scale-95">{loadingAI === 'photo' ? '...' : <><Camera size={14} /> Avaliar IA</>}</button>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Recomendado: 1:1, máx 2MB</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DebouncedInput label="Nome Completo" value={data.personalInfo.fullName} onChange={(v: string) => onChange({ ...data, personalInfo: { ...data.personalInfo, fullName: v } })} placeholder="Seu Nome" />
                <DebouncedInput label="Cargo Alvo" value={data.personalInfo.jobTitle} onChange={(v: string) => onChange({ ...data, personalInfo: { ...data.personalInfo, jobTitle: v } })} placeholder="Ex: Desenvolvedor Frontend" />
                <DebouncedInput label="Email" value={data.personalInfo.email} onChange={(v: string) => onChange({ ...data, personalInfo: { ...data.personalInfo, email: v } })} placeholder="nome@email.com" icon={Mail} />
                <DebouncedInput label="Telefone" value={data.personalInfo.phone} onChange={(v: string) => onChange({ ...data, personalInfo: { ...data.personalInfo, phone: v } })} placeholder="(11) 99999-9999" icon={Phone} />
                <DebouncedInput label="Endereço" value={data.personalInfo.address} onChange={(v: string) => onChange({ ...data, personalInfo: { ...data.personalInfo, address: v } })} placeholder="Cidade, Estado" icon={MapPin} />
                <DebouncedInput label="LinkedIn" value={data.personalInfo.linkedin} onChange={(v: string) => onChange({ ...data, personalInfo: { ...data.personalInfo, linkedin: v } })} placeholder="linkedin.com/in/voce" icon={Linkedin} />
                <DebouncedInput label="Site / Portfólio" value={data.personalInfo.website} onChange={(v: string) => onChange({ ...data, personalInfo: { ...data.personalInfo, website: v } })} placeholder="seusite.com" icon={Globe} />
                <DebouncedInput label="GitHub" value={data.personalInfo.github} onChange={(v: string) => onChange({ ...data, personalInfo: { ...data.personalInfo, github: v } })} placeholder="github.com/voce" icon={FileJson} />
            </div>
            <div className="mt-5">
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Resumo Profissional</label>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <select value={data.settings.aiTone} onChange={(e) => onChange({...data, settings: {...data.settings, aiTone: e.target.value as any}})} className="text-[10px] bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"><option value="professional">Profissional</option><option value="creative">Criativo</option></select>
                            <button onClick={handleAIGenerateSummary} disabled={!!loadingAI} className="text-xs px-2 py-1 bg-white dark:bg-slate-700 rounded text-trampo-600 dark:text-trampo-400 font-medium hover:shadow-sm active:scale-95"><Sparkles size={12} /></button>
                        </div>
                    </div>
                </div>
                <div className="relative group">
                    <DebouncedTextarea id="summary-input" showCounter={true} maxLength={600} className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500/20 focus:border-trampo-500 outline-none transition-all duration-200 ring-offset-1 dark:ring-offset-slate-900" value={data.personalInfo.summary} onChange={(e: any) => onChange({ ...data, personalInfo: { ...data.personalInfo, summary: e.target.value } })} placeholder="Breve descrição sobre sua experiência..." />
                    <div className="absolute bottom-6 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleImproveSummary('shorter')} className="text-slate-500 hover:text-trampo-600 bg-white dark:bg-slate-800 rounded-md p-1.5 shadow border text-[10px] font-bold active:scale-95" title="Encurtar">CURTO</button>
                        <button onClick={() => handleImproveSummary('grammar')} className="text-slate-500 hover:text-green-600 bg-white dark:bg-slate-800 rounded-md p-1.5 shadow border text-[10px] font-bold active:scale-95" title="Corrigir">ABC✓</button>
                    </div>
                </div>
            </div>
        </>
    );
};
