
import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus } from '../../types';
import { Plus, Trash2, ExternalLink, MoreVertical, Edit2, Calendar, DollarSign, Building, GripVertical, Search } from 'lucide-react';

interface JobTrackerProps {
    onClose: () => void;
}

const COLUMNS: { id: JobStatus, title: string, color: string }[] = [
    { id: 'wishlist', title: 'Interesse', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'applied', title: 'Aplicado', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'interview', title: 'Entrevista', color: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'offer', title: 'Oferta', color: 'bg-green-50 dark:bg-green-900/20' },
    { id: 'rejected', title: 'Recusado', color: 'bg-red-50 dark:bg-red-900/20' }
];

export const JobTracker: React.FC<JobTrackerProps> = ({ onClose }) => {
    const [jobs, setJobs] = useState<JobApplication[]>([]);
    const [isAdding, setIsAdding] = useState<JobStatus | null>(null);
    const [newJob, setNewJob] = useState({ company: '', role: '' });
    const [draggedJob, setDraggedJob] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('trampolin_jobs');
        if (saved) {
            try { setJobs(JSON.parse(saved)); } catch(e) {}
        }
    }, []);

    const saveJobs = (newJobs: JobApplication[]) => {
        setJobs(newJobs);
        localStorage.setItem('trampolin_jobs', JSON.stringify(newJobs));
    };

    const addJob = (status: JobStatus) => {
        if (!newJob.company || !newJob.role) return;
        const job: JobApplication = {
            id: Date.now().toString(),
            company: newJob.company,
            role: newJob.role,
            status,
            dateAdded: new Date().toISOString().split('T')[0]
        };
        saveJobs([...jobs, job]);
        setNewJob({ company: '', role: '' });
        setIsAdding(null);
    };

    const deleteJob = (id: string) => {
        if(confirm('Remover esta vaga?')) {
            saveJobs(jobs.filter(j => j.id !== id));
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedJob(id);
    };

    const handleDrop = (e: React.DragEvent, status: JobStatus) => {
        e.preventDefault();
        if (!draggedJob) return;
        const updated = jobs.map(j => j.id === draggedJob ? { ...j, status } : j);
        saveJobs(updated);
        setDraggedJob(null);
    };

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col job-tracker-modal animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900">
                <div>
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><Building className="text-trampo-600"/> Gestão de Vagas</h2>
                    <p className="text-xs text-slate-500">Organize suas candidaturas em um quadro Kanban.</p>
                </div>
                <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">Fechar</button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-slate-50 dark:bg-slate-950">
                <div className="flex gap-4 h-full min-w-max">
                    {COLUMNS.map(col => (
                        <div 
                            key={col.id} 
                            className={`w-72 md:w-80 rounded-xl flex flex-col h-full ${col.color} border border-slate-200 dark:border-slate-800/50`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="p-3 font-bold text-sm uppercase text-slate-600 dark:text-slate-300 flex justify-between items-center">
                                {col.title}
                                <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full text-xs">{jobs.filter(j => j.status === col.id).length}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
                                {jobs.filter(j => j.status === col.id).map(job => (
                                    <div 
                                        key={job.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, job.id)}
                                        className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-move hover:shadow-md transition-shadow group relative"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{job.role}</h4>
                                            <button onClick={() => deleteJob(job.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mb-2">{job.company}</p>
                                        <div className="flex gap-2 text-[10px] text-slate-400">
                                            <span className="flex items-center gap-1"><Calendar size={10}/> {job.dateAdded}</span>
                                        </div>
                                    </div>
                                ))}
                                
                                {isAdding === col.id ? (
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-trampo-200 dark:border-slate-700 shadow-lg animate-in zoom-in-95 duration-200">
                                        <input autoFocus className="w-full text-sm font-bold mb-2 bg-transparent outline-none border-b border-slate-200 dark:border-slate-700 dark:text-white" placeholder="Cargo (ex: Frontend)" value={newJob.role} onChange={e => setNewJob({...newJob, role: e.target.value})} />
                                        <input className="w-full text-xs mb-3 bg-transparent outline-none dark:text-slate-300" placeholder="Empresa" value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} />
                                        <div className="flex gap-2">
                                            <button onClick={() => addJob(col.id)} className="flex-1 bg-trampo-600 text-white text-xs py-1.5 rounded font-bold hover:bg-trampo-700">Adicionar</button>
                                            <button onClick={() => setIsAdding(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs py-1.5 rounded hover:bg-slate-200">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsAdding(col.id)} className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-400 hover:text-trampo-600 hover:border-trampo-300 hover:bg-white/50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 text-xs font-medium">
                                        <Plus size={14}/> Adicionar Vaga
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
