
import React, { useState, useRef, useEffect } from 'react';
import { JobApplication, JobStatus } from '../../types';
import { Plus, Trash2, Search, Clock, Ghost, Check, X, Briefcase, GripVertical, Sparkles, TrendingUp, CircleOff } from 'lucide-react';

interface JobTrackerProps {
    onClose: () => void;
}

const COLUMNS: {
    id: JobStatus;
    title: string;
    emoji: string;
    accent: string;
    cardBg: string;
    headerBg: string;
    badge: string;
    dot: string;
}[] = [
        {
            id: 'wishlist',
            title: 'Interesse',
            emoji: '🔖',
            accent: 'border-slate-300 dark:border-slate-700',
            cardBg: 'bg-slate-50 dark:bg-slate-800/40',
            headerBg: 'bg-white dark:bg-slate-900',
            badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
            dot: 'bg-slate-400',
        },
        {
            id: 'applied',
            title: 'Aplicado',
            emoji: '📤',
            accent: 'border-blue-200 dark:border-blue-900/50',
            cardBg: 'bg-blue-50/30 dark:bg-blue-900/10',
            headerBg: 'bg-blue-50 dark:bg-blue-900/20',
            badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
            dot: 'bg-blue-500',
        },
        {
            id: 'interview',
            title: 'Entrevista',
            emoji: '🎙️',
            accent: 'border-violet-200 dark:border-violet-900/50',
            cardBg: 'bg-violet-50/30 dark:bg-violet-900/10',
            headerBg: 'bg-violet-50 dark:bg-violet-900/20',
            badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
            dot: 'bg-violet-500',
        },
        {
            id: 'offer',
            title: '🎉 Oferta',
            emoji: '🏆',
            accent: 'border-emerald-200 dark:border-emerald-900/50',
            cardBg: 'bg-emerald-50/30 dark:bg-emerald-900/10',
            headerBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
            dot: 'bg-emerald-500',
        },
        {
            id: 'rejected',
            title: 'Recusado',
            emoji: '❌',
            accent: 'border-red-200 dark:border-red-900/50',
            cardBg: 'bg-red-50/20 dark:bg-red-900/10',
            headerBg: 'bg-red-50 dark:bg-red-900/20',
            badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            dot: 'bg-red-400',
        },
    ];

export const JobTracker: React.FC<JobTrackerProps> = ({ onClose }) => {
    const [jobs, setJobs] = useState<JobApplication[]>([]);
    const [isAdding, setIsAdding] = useState<JobStatus | null>(null);
    const [newJob, setNewJob] = useState({ company: '', role: '' });
    const [draggedJob, setDraggedJob] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<JobStatus | null>(null);
    const [search, setSearch] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('trampolin_jobs');
        if (saved) { try { setJobs(JSON.parse(saved)); } catch (e) { } }
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const saveJobs = (newJobs: JobApplication[]) => {
        setJobs(newJobs);
        localStorage.setItem('trampolin_jobs', JSON.stringify(newJobs));
    };

    const addJob = (status: JobStatus) => {
        if (!newJob.company || !newJob.role) return;
        const job: JobApplication = {
            id: crypto.randomUUID(),
            company: newJob.company,
            role: newJob.role,
            status,
            dateAdded: new Date().toISOString(),
        };
        saveJobs([...jobs, job]);
        setNewJob({ company: '', role: '' });
        setIsAdding(null);
    };

    const deleteJob = (id: string) => setConfirmDelete(id);
    const confirmDeleteJob = () => {
        if (confirmDelete) {
            saveJobs(jobs.filter(j => j.id !== confirmDelete));
            setConfirmDelete(null);
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedJob(id);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDrop = (e: React.DragEvent, status: JobStatus) => {
        e.preventDefault();
        if (!draggedJob) return;
        saveJobs(jobs.map(j => j.id === draggedJob ? { ...j, status } : j));
        setDraggedJob(null);
        setDragOverCol(null);
    };

    const getDaysAgo = (dateStr: string) => {
        try {
            const secs = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
            if (secs < 60) return 'agora';
            if (secs < 3600) return `${Math.floor(secs / 60)}min atrás`;
            if (secs < 86400) return `${Math.floor(secs / 3600)}h atrás`;
            if (secs < 2592000) return `${Math.floor(secs / 86400)}d atrás`;
            if (secs < 31536000) return `${Math.floor(secs / 2592000)}m atrás`;
            return `${Math.floor(secs / 31536000)}a atrás`;
        } catch { return ''; }
    };

    const totalJobs = jobs.length;
    const interviewCount = jobs.filter(j => j.status === 'interview').length;
    const offerCount = jobs.filter(j => j.status === 'offer').length;
    const q = search.toLowerCase();

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4 pt-8"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-slate-50 dark:bg-slate-950 flex flex-col w-full max-w-[1400px] h-[90vh] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
            >
                {/* ── Header ── */}
                <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Title + stats */}
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-trampo-500 to-trampo-700 rounded-xl flex items-center justify-center shadow-md shadow-trampo-500/30 flex-shrink-0">
                                <Briefcase size={18} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Gestão de Vagas</h2>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                    <span className="flex items-center gap-1"><TrendingUp size={10} /> {totalJobs} vagas</span>
                                    {interviewCount > 0 && <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400"><Sparkles size={10} /> {interviewCount} entrevista{interviewCount !== 1 ? 's' : ''}</span>}
                                    {offerCount > 0 && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">🎉 {offerCount} oferta{offerCount !== 1 ? 's' : ''}!</span>}
                                </div>
                            </div>
                        </div>

                        {/* Search + Close */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="relative hidden sm:block">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar cargo ou empresa..."
                                    className="pl-8 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700
                                               bg-slate-50 dark:bg-slate-800 dark:text-slate-200
                                               focus:outline-none focus:ring-2 focus:ring-trampo-500/30 focus:border-trampo-400
                                               w-52 transition-all"
                                />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-all active:scale-95"
                                aria-label="Fechar"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Kanban Board ── */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-6">
                    <div className="flex gap-3 h-full" style={{ minWidth: 'max-content' }}>
                        {COLUMNS.map(col => {
                            const colJobs = jobs.filter(j =>
                                j.status === col.id &&
                                (!q || j.role.toLowerCase().includes(q) || j.company.toLowerCase().includes(q))
                            );
                            const isDragTarget = dragOverCol === col.id;

                            return (
                                <div
                                    key={col.id}
                                    className={`w-72 flex flex-col rounded-2xl border-2 transition-all duration-200
                                        ${isDragTarget
                                            ? 'border-trampo-400 dark:border-trampo-500 shadow-lg shadow-trampo-500/10 scale-[1.02]'
                                            : col.accent
                                        }
                                        ${col.cardBg}`}
                                    onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
                                    onDragLeave={() => setDragOverCol(null)}
                                    onDrop={e => handleDrop(e, col.id)}
                                >
                                    {/* Column header */}
                                    <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${col.headerBg} border-b ${col.accent}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${col.dot} flex-shrink-0`} />
                                            <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                                                {col.title}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                                            {colJobs.length}
                                        </span>
                                    </div>

                                    {/* Cards */}
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-[80px]">
                                        {colJobs.length === 0 && isAdding !== col.id && (
                                            <div className="flex flex-col items-center justify-center h-24 text-slate-300 dark:text-slate-700">
                                                <Ghost size={22} className="mb-1.5 opacity-60" />
                                                <span className="text-[11px] opacity-60">Arraste cards aqui</span>
                                            </div>
                                        )}

                                        {colJobs.map(job => (
                                            <div
                                                key={job.id}
                                                draggable
                                                onDragStart={e => handleDragStart(e, job.id)}
                                                onDragEnd={() => setDraggedJob(null)}
                                                className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80
                                                           shadow-sm hover:shadow-md
                                                           cursor-grab active:cursor-grabbing
                                                           hover:-translate-y-0.5 transition-all duration-200
                                                           group relative p-3.5
                                                           ${draggedJob === job.id ? 'opacity-40 scale-95' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <GripVertical size={13} className="text-slate-300 dark:text-slate-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight truncate">{job.role}</h4>
                                                    </div>
                                                    {/* Confirm delete inline */}
                                                    {confirmDelete === job.id ? (
                                                        <div className="flex items-center gap-1 flex-shrink-0 animate-scale-in">
                                                            <button onClick={confirmDeleteJob} className="p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" title="Confirmar">
                                                                <Check size={11} />
                                                            </button>
                                                            <button onClick={() => setConfirmDelete(null)} className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors" title="Cancelar">
                                                                <X size={11} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => deleteJob(job.id)}
                                                            className="p-1 text-slate-200 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2 truncate pl-5">{job.company}</p>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 pl-5">
                                                    <Clock size={9} />
                                                    <span>{getDaysAgo(job.dateAdded)}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add card form */}
                                        {isAdding === col.id ? (
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-trampo-400 dark:border-trampo-600 shadow-lg shadow-trampo-500/10 p-3 animate-scale-in">
                                                <input
                                                    autoFocus
                                                    className="w-full text-sm font-semibold mb-2 bg-transparent outline-none
                                                               border-b border-slate-200 dark:border-slate-700
                                                               dark:text-white pb-1 placeholder:text-slate-300"
                                                    placeholder="Cargo (ex: Frontend Dev)"
                                                    value={newJob.role}
                                                    onChange={e => setNewJob({ ...newJob, role: e.target.value })}
                                                    onKeyDown={e => { if (e.key === 'Enter') addJob(col.id); if (e.key === 'Escape') setIsAdding(null); }}
                                                />
                                                <input
                                                    className="w-full text-xs mb-3 bg-transparent outline-none
                                                               dark:text-slate-300 placeholder:text-slate-300"
                                                    placeholder="Empresa"
                                                    value={newJob.company}
                                                    onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                                                    onKeyDown={e => { if (e.key === 'Enter') addJob(col.id); if (e.key === 'Escape') setIsAdding(null); }}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => addJob(col.id)}
                                                        className="flex-1 bg-trampo-600 hover:bg-trampo-700 text-white text-xs py-1.5 rounded-lg font-bold transition-colors active:scale-95"
                                                    >
                                                        Salvar
                                                    </button>
                                                    <button
                                                        onClick={() => setIsAdding(null)}
                                                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsAdding(col.id)}
                                                className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700
                                                           rounded-xl text-slate-400 dark:text-slate-600
                                                           hover:text-trampo-600 dark:hover:text-trampo-400
                                                           hover:border-trampo-300 dark:hover:border-trampo-700
                                                           hover:bg-white/60 dark:hover:bg-slate-800/40
                                                           transition-all flex items-center justify-center gap-1.5
                                                           text-xs font-medium active:scale-[0.98] group"
                                            >
                                                <Plus size={13} className="group-hover:scale-125 transition-transform" />
                                                Adicionar
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