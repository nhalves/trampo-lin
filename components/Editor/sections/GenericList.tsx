
import React from 'react';
import { GripVertical, Copy, Trash2, Type, Wand2, Plus, Download, Github, Loader2 } from 'lucide-react';
import { ResumeData } from '../../../types';
import { DebouncedInput, DebouncedTextarea } from '../components/Debounced';
import { generateBulletPoints, improveText } from '../../../services/geminiService';
import { fetchGithubRepos } from '../../../services/integrationService';
import { generateId } from '../../../utils/resumeUtils';

interface GenericListProps {
    sectionKey: string;
    data: ResumeData;
    onChange: (newData: ResumeData) => void;
    onShowToast: (msg: string) => void;
    onRequestConfirm: (title: string, msg: string, onConfirm: () => void, type?: 'danger' | 'info') => void;
    newItemTemplate: any;
    fields: { key: string; label: string; type?: string; placeholder?: string; full?: boolean }[];
    titleField?: string;
    subtitleField?: string;
    loadingAI: string | null;
    setLoadingAI: (state: string | null) => void;
    githubUsername?: string;
    setGithubUsername?: (v: string) => void;
}

export const GenericList: React.FC<GenericListProps> = ({ 
    sectionKey, data, onChange, onShowToast, onRequestConfirm, newItemTemplate, fields, loadingAI, setLoadingAI, githubUsername, setGithubUsername 
}) => {
    const listData = (data as any)[sectionKey] || [];

    const handleListChange = (index: number, field: string, value: any) => {
        const newList = [...listData];
        newList[index] = { ...newList[index], [field]: value };
        onChange({ ...data, [sectionKey]: newList });
    };

    const addItem = () => {
        onChange({ ...data, [sectionKey]: [{ ...newItemTemplate, id: generateId() }, ...listData] });
        onShowToast("Item adicionado.");
    };

    const removeItem = (index: number) => {
        onRequestConfirm("Remover?", "Deseja remover este item?", () => {
            const newList = [...listData];
            newList.splice(index, 1);
            onChange({ ...data, [sectionKey]: newList });
        }, 'danger');
    };

    const duplicateItem = (index: number) => {
        const newList = [...listData];
        const item = { ...newList[index], id: generateId() };
        newList.splice(index + 1, 0, item);
        onChange({ ...data, [sectionKey]: newList });
        onShowToast("Duplicado.");
    };

    // Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("listName", sectionKey);
        e.dataTransfer.setData("index", index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragListName = e.dataTransfer.getData("listName");
        const dragIndex = parseInt(e.dataTransfer.getData("index"));
        if (dragListName !== sectionKey || dragIndex === dropIndex || isNaN(dragIndex)) return;
        
        const list = [...listData];
        const [movedItem] = list.splice(dragIndex, 1);
        list.splice(dropIndex, 0, movedItem);
        onChange({ ...data, [sectionKey]: list });
        onShowToast("Item reordenado.");
    };

    // AI Handlers
    const handleGenerateBullets = async (index: number) => {
        const item = listData[index];
        if (!item.role) { onShowToast("Preencha o cargo."); return; }
        setLoadingAI(`bullets-${index}`);
        try {
            const bullets = await generateBulletPoints(item.role, item.company);
            const newText = item.description ? item.description + '\n' + bullets : bullets;
            handleListChange(index, 'description', newText);
            onShowToast("✨ Bullets gerados!");
        } catch (e) {
            onShowToast("Erro ao gerar bullets.");
        } finally {
            setLoadingAI(null);
        }
    };

    const handleImproveText = async (index: number) => {
        const item = listData[index];
        if (!item.description || item.description.length < 5) { onShowToast("Texto muito curto."); return; }
        setLoadingAI(`improving-${index}`);
        try {
            const improved = await improveText(item.description, 'resume', data.settings.aiTone);
            handleListChange(index, 'description', improved);
            onShowToast("✨ Texto aprimorado!");
        } catch(e) {
            onShowToast("Erro ao processar texto.");
        } finally {
            setLoadingAI(null);
        }
    };

    const handleGithubImport = async () => { 
        if (!githubUsername || !setGithubUsername) return;
        if (!githubUsername) { onShowToast("Digite o usuário."); return; } 
        setLoadingAI('github'); 
        try {
            const repos = await fetchGithubRepos(githubUsername); 
            if (repos && repos.length > 0) { 
                const newProjects = repos.map((repo: any) => ({ 
                    id: generateId(), 
                    name: repo.name, 
                    description: repo.description || 'Sem descrição', 
                    url: repo.html_url, 
                    startDate: repo.updated_at.split('T')[0].substring(0, 7), 
                    endDate: '' 
                })); 
                onChange({ ...data, projects: [...data.projects, ...newProjects] }); 
                onShowToast(`${newProjects.length} repos importados!`); 
            } else { onShowToast("Nenhum repositório relevante encontrado."); } 
        } catch (e) {
            onShowToast("Erro ao importar GitHub.");
        } finally {
            setLoadingAI(null); 
        }
    };

    return (
        <div className="space-y-4">
            {sectionKey === 'projects' && setGithubUsername && (
                 <div className="flex gap-2 mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 items-end">
                     <div className="flex-1">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GitHub Username</label>
                         <div className="relative">
                            <input value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="ex: facebook" className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-trampo-500" />
                            <Github size={14} className="absolute left-2.5 top-2.5 text-slate-400"/>
                         </div>
                     </div>
                     <button onClick={handleGithubImport} disabled={!!loadingAI} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-700 transition-all flex items-center gap-2">
                         {loadingAI === 'github' ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>} Importar
                     </button>
                 </div>
            )}

            {listData.length === 0 && (
                <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm italic">
                    Nenhum item adicionado ainda.
                </div>
            )}

            {listData.map((item: any, index: number) => (
                <div 
                    key={item.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, index)} 
                    onDragOver={handleDragOver} 
                    onDrop={(e) => handleDrop(e, index)}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 relative group transition-all duration-200 hover:shadow-md hover:border-trampo-200 dark:hover:border-slate-600 animate-scale-in"
                >
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="p-1.5 text-slate-400 cursor-move hover:text-slate-600" title="Arrastar"><GripVertical size={14}/></div>
                        <button onClick={() => duplicateItem(index)} className="p-1.5 hover:text-blue-500 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Duplicar"><Copy size={14}/></button>
                        <button onClick={() => removeItem(index)} className="p-1.5 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remover"><Trash2 size={14}/></button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 pr-8">
                        {fields.map(f => {
                            if (f.key === 'startDate' || f.key === 'endDate') {
                                return (
                                    <div key={f.key}>
                                        <DebouncedInput label={f.label} value={item[f.key]} onChange={(v: string) => handleListChange(index, f.key, v)} type="text" placeholder="MM/AAAA" isDate={true} disabled={f.key === 'endDate' && item.current} />
                                        {f.key === 'endDate' && sectionKey === 'experience' && (
                                            <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                                                <input type="checkbox" className="rounded text-trampo-600 focus:ring-trampo-500 w-3 h-3" checked={item.current || false} onChange={(e) => handleListChange(index, 'current', e.target.checked)} />
                                                <span className="text-[10px] font-bold text-trampo-600 uppercase">Trabalho Atual</span>
                                            </label>
                                        )}
                                    </div>
                                )
                            }
                            return <div key={f.key} className={f.full ? "col-span-2" : ""}><DebouncedInput label={f.label} value={item[f.key]} onChange={(v: string) => handleListChange(index, f.key, v)} type={f.type || 'text'} placeholder={f.placeholder} /></div>;
                        })}
                    </div>

                    {item.description !== undefined && (
                        <div className="relative mt-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Descrição</label>
                                <div className="flex gap-2">
                                    {sectionKey === 'experience' && (
                                        <button onClick={() => handleGenerateBullets(index)} className="text-xs flex items-center gap-1 text-trampo-600 hover:text-trampo-700 bg-white dark:bg-slate-800 rounded px-2 py-0.5 border border-slate-200 dark:border-slate-600 transition-all hover:shadow-sm active:scale-95">
                                            {loadingAI === `bullets-${index}` ? <Loader2 size={12} className="animate-spin"/> : <Type size={12} />} Bullets
                                        </button>
                                    )}
                                    <button onClick={() => handleImproveText(index)} className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 bg-white dark:bg-slate-800 rounded px-2 py-0.5 border border-slate-200 dark:border-slate-600 transition-all hover:shadow-sm active:scale-95 group/ai">
                                        {loadingAI === `improving-${index}` ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} className="group-hover/ai:animate-spin" />} Melhorar
                                    </button>
                                </div>
                            </div>
                            <DebouncedTextarea id={`desc-${sectionKey}-${index}`} className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-trampo-500/20 focus:border-trampo-500 outline-none transition-all duration-200 ring-offset-1 dark:ring-offset-slate-900 leading-relaxed" value={item.description} onChange={(e: any) => handleListChange(index, 'description', e.target.value)} placeholder="• Descreva suas responsabilidades..." />
                        </div>
                    )}
                </div>
            ))}
            
            <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-trampo-600 hover:border-trampo-300 hover:bg-trampo-50 dark:hover:bg-slate-800/50 flex justify-center items-center gap-2 transition-all font-medium active:scale-95"><Plus size={18}/> Adicionar Item</button>
        </div>
    );
};
