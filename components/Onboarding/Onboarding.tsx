
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check, Sparkles, FileText, Search, Zap, Rocket } from 'lucide-react';

interface OnboardingProps {
    onComplete: () => void;
}

const STEPS = [
    {
        icon: Rocket,
        emoji: '🚀',
        color: 'from-trampo-400 to-trampo-600',
        bg: 'bg-trampo-50 dark:bg-trampo-900/20',
        title: 'Bem-vindo ao Trampo-lin!',
        content: 'Seu gerador de currículos profissional com IA. Leva menos de 5 minutos para criar um currículo que impressiona recrutadores.',
    },
    {
        icon: FileText,
        emoji: '✍️',
        color: 'from-blue-400 to-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        title: 'Editor Poderoso',
        content: 'Preencha seus dados na esquerda. Use os botões ✨ com IA para melhorar textos, gerar resumos e traduzir automaticamente.',
    },
    {
        icon: Sparkles,
        emoji: '🤖',
        color: 'from-violet-400 to-violet-600',
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        title: 'Ferramentas de IA',
        content: 'Na aba "Ferramentas" acesse: Análise de Gaps, Simulador de Entrevista, Estimativa Salarial e Adaptação de CV para vagas específicas.',
    },
    {
        icon: Search,
        emoji: '🎯',
        color: 'from-emerald-400 to-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        title: 'Análise ATS',
        content: 'Cole a descrição de uma vaga e descubra o quanto seu currículo combina com ela. Aumente suas chances de passar nos filtros automáticos.',
    },
    {
        icon: Check,
        emoji: '🎉',
        color: 'from-amber-400 to-orange-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        title: 'Tudo pronto!',
        content: 'Seus dados ficam salvos automaticamente no navegador. Configure sua chave de IA nas ⚙️ configurações e bora turbinar esse currículo!',
    },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [animating, setAnimating] = useState(false);
    const step = STEPS[currentStep];
    const StepIcon = step.icon;
    const isLast = currentStep === STEPS.length - 1;

    const handleNext = () => {
        if (animating) return;
        if (isLast) { onComplete(); return; }
        setAnimating(true);
        setTimeout(() => {
            setCurrentStep(s => s + 1);
            setAnimating(false);
        }, 200);
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onComplete();
            if (e.key === 'Enter' || e.key === ' ') handleNext();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [currentStep, animating]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
            <div className={`relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-slate-200/80 dark:border-slate-800 animate-scale-in transition-all`}>

                {/* Top gradient bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${step.color} transition-all duration-500`} />

                {/* Step progress dots */}
                <div className="flex items-center justify-center gap-1.5 pt-4 pb-1">
                    {STEPS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => !animating && i < currentStep && setCurrentStep(i)}
                            className={`rounded-full transition-all duration-300 ${i === currentStep
                                    ? `w-6 h-2 bg-gradient-to-r ${step.color}`
                                    : i < currentStep
                                        ? 'w-2 h-2 bg-trampo-300 dark:bg-trampo-700 cursor-pointer hover:bg-trampo-400'
                                        : 'w-2 h-2 bg-slate-200 dark:bg-slate-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className={`p-8 transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>

                    {/* Icon badge */}
                    <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center mb-5 text-2xl`}>
                        {step.emoji}
                    </div>

                    <div className="mb-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Passo {currentStep + 1} de {STEPS.length}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
                        {step.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {step.content}
                    </p>
                </div>

                {/* Footer actions */}
                <div className="px-8 pb-6 flex items-center justify-between">
                    <button
                        onClick={onComplete}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        Pular tutorial
                    </button>
                    <button
                        onClick={handleNext}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white
                                   bg-gradient-to-r ${step.color}
                                   shadow-md hover:shadow-lg transition-all active:scale-95`}
                    >
                        {isLast ? 'Começar agora' : 'Próximo'}
                        {isLast ? <Rocket size={15} /> : <ChevronRight size={15} />}
                    </button>
                </div>

                {/* Close button */}
                <button
                    onClick={onComplete}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                    <X size={15} />
                </button>
            </div>
        </div>
    );
};
