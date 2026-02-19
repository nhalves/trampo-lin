
import React from 'react';
import { Trash2, Plus, Sparkles, Loader2 } from 'lucide-react';
import { ResumeData } from '../../../types';
import { suggestSkills } from '../../../services/geminiService';
import { generateId } from '../../../utils/resumeUtils';

interface SkillsSectionProps {
    data: ResumeData;
    onChange: (newData: ResumeData) => void;
    onShowToast: (msg: string) => void;
    onRequestConfirm: (title: string, msg: string, onConfirm: () => void, type?: 'danger' | 'info') => void;
    loadingAI: string | null;
    setLoadingAI: (state: string | null) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ data, onChange, onShowToast, onRequestConfirm, loadingAI, setLoadingAI }) => {
    
    const handleListChange = (index: number, field: string, value: any) => {
        const newList = [...data.skills];
        newList[index] = { ...newList[index], [field]: value };
        onChange({ ...data, skills: newList });
    };

    const addItem = () => {
        onChange({ ...data, skills: [...data.skills, { id: generateId(), name: 'Nova Skill', level: 3 }] });
    };

    const removeItem = (index: number) => {
        onRequestConfirm("Remover?", "Deseja remover esta skill?", () => {
            const newList = [...data.skills];
            newList.splice(index, 1);
            onChange({ ...data, skills: newList });
        }, 'danger');
    };

    const handleSuggestSkills = async () => {
        setLoadingAI('skills');
        try {
            const s = await suggestSkills(data.personalInfo.jobTitle);
            if (s.length) {
                const newSkills = s.map(name => ({ id: generateId(), name: name, level: 3 }));
                onChange({ ...data, skills: [...data.skills, ...newSkills] });
                onShowToast(`${s.length} skills sugeridas!`);
            } else {
                onShowToast("Preencha o cargo primeiro.");
            }
        } catch (e) {
            onShowToast("Erro ao sugerir skills.");
        } finally {
            setLoadingAI(null);
        }
    };

    return (
        <>
            <div className="flex flex-wrap gap-2 mb-4">
                {data.skills.map((skill, index) => (
                    <div key={skill.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg flex flex-col gap-2 shadow-sm min-w-[140px] animate-scale-in">
                        <div className="flex justify-between items-center w-full">
                            <input value={skill.name} onChange={(e) => handleListChange(index, 'name', e.target.value)} className="bg-transparent text-sm font-medium w-full outline-none dark:text-slate-200 placeholder:text-slate-300" placeholder="Skill" />
                            <button onClick={() => removeItem(index)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                        </div>
                        {data.settings.skillStyle !== 'hidden' && data.settings.skillStyle !== 'tags' && (
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(level => (
                                    <button key={level} onClick={() => handleListChange(index, 'level', level)} className={`w-4 h-1.5 rounded-full transition-colors ${level <= skill.level ? 'bg-trampo-500' : 'bg-slate-200 dark:bg-slate-800'}`} title={`Nível ${level}/5`} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <button onClick={addItem} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 flex items-center gap-2 transition-all shadow-sm active:scale-95"><Plus size={16} /> Add Skill</button>
                <button
                    onClick={handleSuggestSkills}
                    disabled={!data.personalInfo.jobTitle || !!loadingAI}
                    className="px-4 py-2 border border-purple-100 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                    {loadingAI === 'skills' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Sugerir IA
                </button>
            </div>
        </>
    );
};
