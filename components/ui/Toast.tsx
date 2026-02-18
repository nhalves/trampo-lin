
import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-sm font-medium z-[150] animate-slide-in flex items-center gap-2 border border-slate-700/50 transform transition-all hover:scale-105 cursor-default">{message}</div>;
};
