
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { OnboardingStep } from '../../types';

interface OnboardingProps {
    onComplete: () => void;
}

const STEPS: OnboardingStep[] = [
    {
        target: 'center',
        title: 'Bem-vindo ao Trampo-lin! 🚀',
        content: 'Vamos dar um upgrade na sua carreira? Fizemos um tour rápido para você conhecer as ferramentas.',
        position: 'center'
    },
    {
        target: '#editor-sidebar',
        title: 'Editor Poderoso',
        content: 'Aqui você preenche seus dados. Use os botões de IA (✨) para melhorar textos, traduzir e gerar resumos.',
        position: 'right'
    },
    {
        target: '#preview-area',
        title: 'Preview em Tempo Real',
        content: 'Veja como seu currículo fica instantaneamente. Arraste, dê zoom e teste diferentes temas.',
        position: 'left'
    },
    {
        target: '.ai-settings-modal', // Virtual target, pointing to tools generally
        title: 'Ferramentas de IA',
        content: 'Na aba "Ferramentas", acesse a Análise de Gaps, Simulador de Entrevista e Estimativa Salarial.',
        position: 'center'
    },
    {
        target: 'center',
        title: 'Tudo pronto!',
        content: 'Seus dados ficam salvos no navegador. Boa sorte na sua jornada!',
        position: 'center'
    }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const step = STEPS[currentStep];

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
            {/* Backdrop with hole implementation is complex, using simple overlay for now */}
            <div className="absolute inset-0 bg-black/50 pointer-events-auto transition-opacity" onClick={onComplete}></div>
            
            <div className={`relative pointer-events-auto bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 slide-in-from-bottom-4`}>
                <button onClick={onComplete} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={16}/>
                </button>
                
                <div className="mb-4">
                    <span className="text-xs font-bold text-trampo-600 uppercase tracking-wider">Passo {currentStep + 1} de {STEPS.length}</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{step.title}</h3>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {step.content}
                </p>
                
                <div className="flex justify-end gap-2">
                    <button onClick={handleNext} className="bg-trampo-600 hover:bg-trampo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-trampo-500/20 flex items-center gap-2 transition-all">
                        {currentStep === STEPS.length - 1 ? 'Começar' : 'Próximo'}
                        {currentStep === STEPS.length - 1 ? <Check size={16}/> : <ChevronRight size={16}/>}
                    </button>
                </div>
            </div>
        </div>
    );
};
