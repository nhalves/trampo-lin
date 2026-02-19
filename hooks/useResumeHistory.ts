
import { useState, useRef, useEffect, useCallback } from 'react';
import { ResumeData } from '../types';

export const useResumeHistory = (initialData: ResumeData, onChange: (data: ResumeData) => void) => {
    const [history, setHistory] = useState<ResumeData[]>([initialData]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const isUndoRedoAction = useRef(false);

    // Quando o histórico muda internamente (por undo/redo), notificamos o componente pai
    useEffect(() => {
        if (history.length > 0 && isUndoRedoAction.current) {
            onChange(history[historyIndex]);
            isUndoRedoAction.current = false;
        }
    }, [historyIndex, history, onChange]);

    const handleChangeWithHistory = useCallback((newData: ResumeData) => {
        // Se estamos no meio de uma ação de undo/redo, não adicionamos ao histórico, 
        // mas precisamos atualizar o estado pai imediatamente (handled by effect above usually, but direct calls need this)
        if (isUndoRedoAction.current) {
            onChange(newData);
            isUndoRedoAction.current = false;
            return;
        }

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newData);
        
        // Limite de 50 itens no histórico para memória
        if (newHistory.length > 50) newHistory.shift();
        
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        onChange(newData);
    }, [history, historyIndex, onChange]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            isUndoRedoAction.current = true;
            setHistoryIndex(prev => prev - 1);
        }
    }, [historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            isUndoRedoAction.current = true;
            setHistoryIndex(prev => prev + 1);
        }
    }, [historyIndex, history.length]);

    // Atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return {
        history,
        historyIndex,
        handleChangeWithHistory,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1
    };
};
