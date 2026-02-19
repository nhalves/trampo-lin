
import React from 'react';
import { FileType, FileText, ZoomOut, ZoomIn, Maximize, RotateCcw, Printer } from 'lucide-react';

interface FloatingControlsProps {
    onTxtExport: () => void;
    onDocxExport: () => void;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    onAutoFit: () => void;
    onPrint: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({ onTxtExport, onDocxExport, zoom, setZoom, onAutoFit, onPrint }) => {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 dark:border-slate-700/50 print:hidden z-40 preview-controls transition-all hover:scale-[1.02]">
            <button aria-label="Export TXT" onClick={onTxtExport} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Exportar TXT"><FileType size={18}/></button>
            <button aria-label="Export Word" onClick={onDocxExport} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Exportar Word"><FileText size={18}/></button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button aria-label="Zoom Out" onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Diminuir Zoom"><ZoomOut size={18}/></button>
            <span className="text-xs font-bold w-12 text-center tabular-nums text-slate-600 dark:text-slate-300 select-none">{Math.round(zoom * 100)}%</span>
            <button aria-label="Zoom In" onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Aumentar Zoom"><ZoomIn size={18}/></button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button aria-label="Fit to Screen" onClick={onAutoFit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Ajustar à Tela (Fit)"><Maximize size={16}/></button>
            <button aria-label="Reset View" onClick={() => setZoom(window.innerWidth < 768 ? 0.45 : 0.8)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors active:scale-95" title="Resetar"><RotateCcw size={16}/></button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 md:hidden"></div>
            <button aria-label="Print" onClick={onPrint} className="md:hidden p-2 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95"><Printer size={18}/></button>
        </div>
    );
};
