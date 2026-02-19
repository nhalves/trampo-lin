
import React, { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  const modalRef = useFocusTrap(isOpen, onCancel) as React.RefObject<HTMLDivElement>;

  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900
                   border border-slate-200/80 dark:border-slate-700/80
                   rounded-2xl
                   shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.5)]
                   w-full max-w-sm overflow-hidden
                   animate-scale-in"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Top accent bar */}
        <div className={`h-1 w-full ${isDanger ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-blue-400 to-trampo-500'}`} />

        {/* Content */}
        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDanger
                ? 'bg-red-100 dark:bg-red-900/20'
                : 'bg-blue-100 dark:bg-blue-900/20'
              }`}>
              {isDanger
                ? <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                : <Info size={20} className="text-blue-600 dark:text-blue-400" />
              }
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 leading-tight pr-6">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl
                       text-slate-600 dark:text-slate-300
                       bg-slate-100 dark:bg-slate-800
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-bold text-white rounded-xl
                       shadow-sm transition-all active:scale-95
                       ${isDanger
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                : 'bg-trampo-600 hover:bg-trampo-700 shadow-trampo-500/25'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
