
import React, { memo } from 'react';
import { Eraser, Eye, EyeOff, ChevronDown } from 'lucide-react';

export const SectionWrapper = memo(({ title, icon: Icon, children, isOpen, onToggle, isVisible, onVisibilityToggle, onClear, itemCount }: any) => (
  <div className={`group border border-transparent rounded-xl transition-all duration-300 mb-4 ${isOpen ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
    <div className={`flex items-center justify-between p-4 cursor-pointer select-none rounded-xl ${!isVisible && isVisible !== undefined ? 'opacity-50 grayscale' : ''}`} onClick={onToggle}>
      <div className="flex-1 flex items-center gap-3 text-left">
        <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-trampo-100 dark:bg-trampo-900/30 text-trampo-600 dark:text-trampo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
           {Icon && <Icon size={18} />}
        </div>
        <div>
            <span className="font-bold text-sm text-slate-700 dark:text-slate-200 block leading-tight">{title}</span>
            {itemCount !== undefined && <span className="text-[10px] text-slate-400 font-medium">{itemCount} itens</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onClear && (
          <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90" title="Limpar Seção">
            <Eraser size={16} />
          </button>
        )}
        {onVisibilityToggle && (
          <button onClick={(e) => { e.stopPropagation(); onVisibilityToggle(); }} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90" title={isVisible ? "Ocultar" : "Mostrar"}>
            {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
      </div>
      <div className={`p-2 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <ChevronDown size={20} />
      </div>
    </div>
    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden"><div className="p-4 pt-0">{children}</div></div>
    </div>
  </div>
));
