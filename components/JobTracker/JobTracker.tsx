
import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus } from '../../types';
import { Plus, Trash2, Calendar, Building, Search, Clock, Ghost } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JobTrackerProps {
    onClose: () => void;
}

const COLUMNS: { id: JobStatus, title: string, color: string, badge: string }[] = [
    { id: 'wishlist', title: 'Interesse', color: 'bg-slate-50 dark:bg-slate-800/50', badge: 'bg-slate-200 text-slate-700' },
    { id: 'applied', title: 'Aplicado', color: 'bg-blue-50/50 dark:bg-blue-900/10', badge: 'bg-blue-100 text-blue-700' },
    { id: 'interview', title: 'Entrevista', color: 'bg-purple-50/50 dark:bg-purple-900/10', badge: 'bg-purple-100 text-purple-700' },
    { id: 'offer', title: 'Oferta', color: 'bg-green-50/50 dark:bg-green-900/10', badge: 'bg-green-100 text-green-700' },
    { id: 'rejected', title: 'Recusado', color: 'bg-red-50/50 dark:bg-red-900/10', badge: 'bg-red-100 text-red-700' }
];

export const JobTracker: React.FC<JobTrackerProps> = ({ onClose }) => {
    const [jobs, setJobs] = useState<JobApplication[]>([]);
    const [isAdding, setIsAdding] = useState<JobStatus | null>(null);
    const [newJob, setNewJob] = useState({ company: '', role: '' });
    const [draggedJob, setDraggedJob] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('trampolin_jobs');
        if (saved) { try { setJobs(JSON.parse(saved)); } catch(e) {} }
    }, []);

    const saveJobs = (newJobs: JobApplication[]) => {
        setJobs(newJobs);
        localStorage.setItem('trampolin_jobs', JSON.stringify(newJobs));
    };

    const addJob = (status: JobStatus) => {
        if (!newJob.company || !newJob.role) return;
        const job: JobApplication = { id: Date.now().toString(), company: newJob.company, role: newJob.role, status, dateAdded: new Date().toISOString() };
        saveJobs([...jobs, job]); setNewJob({ company: '', role: '' }); setIsAdding(null);
    };

    const deleteJob = (id: string) => { if(confirm('Remover esta vaga?')) { saveJobs(jobs.filter(j => j.id !== id)); } };
    const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedJob(id); };
    const handleDrop = (e: React.DragEvent, status: JobStatus) => { e.preventDefault(); if (!draggedJob) return; const updated = jobs.map(j => j.id === draggedJob ? { ...j, status } : j); saveJobs(updated); setDraggedJob(null); };

    const getDaysAgo = (dateStr: string) => {
        try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: ptBR }); } catch { return 'Recentemente'; }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex flex-col job-tracker-modal animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-950 flex flex-col h-[90vh] w-[95vw] max-w-7xl mx-auto mt-8 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
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
                        {COLUMNS.map(col => {
                            const colJobs = jobs.filter(j => j.status === col.id);
                            return (
                                <div key={col.id} className={`w-72 md:w-80 rounded-xl flex flex-col h-full ${col.color} border border-slate-200 dark:border-slate-800/50 transition-colors`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.id)}>
                                    <div className="p-3 font-bold text-sm uppercase text-slate-600 dark:text-slate-300 flex justify-between items-center">
                                        {col.title}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badge}`}>{colJobs.length}</span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
                                        {colJobs.length === 0 && isAdding !== col.id && (
                                            <div className="flex flex-col items-center justify-center h-32 text-slate-300 dark:text-slate-700 opacity-50">
                                                <Ghost size={24} className="mb-2"/>
                                                <span className="text-xs">Vazio</span>
                                            </div>
                                        )}
                                        {colJobs.map(job => (
                                            <div key={job.id} draggable onDragStart={(e) => handleDragStart(e, job.id)} className="bg-white dark:bg-slate-900 p-3.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-move hover:shadow-md hover:-translate-y-1 transition-all duration-200 group relative">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">{job.role}</h4>
                                                    <button onClick={() => deleteJob(job.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 size={14}/></button>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1"><Building size={10}/> {job.company}</p>
                                                <div className="flex gap-2 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 p-1.5 rounded w-fit">
                                                    <span className="flex items-center gap-1"><Clock size={10}/> {getDaysAgo(job.dateAdded)}</span>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {isAdding === col.id ? (
                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border-2 border-trampo-500 shadow-lg animate-scale-in">
                                                <input autoFocus className="w-full text-sm font-bold mb-2 bg-transparent outline-none border-b border-slate-200 dark:border-slate-700 dark:text-white" placeholder="Cargo (ex: Frontend)" value={newJob.role} onChange={e => setNewJob({...newJob, role: e.target.value})} />
                                                <input className="w-full text-xs mb-3 bg-transparent outline-none dark:text-slate-300" placeholder="Empresa" value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} />
                                                <div className="flex gap-2">
                                                    <button onClick={() => addJob(col.id)} className="flex-1 bg-trampo-600 text-white text-xs py-1.5 rounded font-bold hover:bg-trampo-700 active:scale-95 transition-transform">Salvar</button>
                                                    <button onClick={() => setIsAdding(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs py-1.5 rounded hover:bg-slate-200 active:scale-95 transition-transform">Cancelar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setIsAdding(col.id)} className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-400 hover:text-trampo-600 hover:border-trampo-300 hover:bg-white/50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1 text-xs font-medium active:scale-95 group">
                                                <Plus size={14} className="group-hover:scale-110 transition-transform"/> Adicionar Vaga
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
