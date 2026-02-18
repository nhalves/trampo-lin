
import React, { useState, useEffect, useRef, memo } from 'react';
import { Mic, MicOff, Bold, Italic, List } from 'lucide-react';

const handleDateInput = (value: string) => {
    let v = value.replace(/\D/g, '').slice(0, 6);
    if (v.length >= 3) { return `${v.slice(0, 2)}/${v.slice(2)}`; }
    return v;
};

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const DebouncedInput = memo(({ label, value, onChange, type = "text", placeholder = "", step, disabled, icon: Icon, isDate, className }: any) => {
    const [localValue, setLocalValue] = useState(value);
    
    useEffect(() => { setLocalValue(value); }, [value]);
    
    useEffect(() => {
        const handler = setTimeout(() => { if (localValue !== value) onChange(localValue); }, 400);
        return () => clearTimeout(handler);
    }, [localValue, onChange, value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = isDate ? handleDateInput(e.target.value) : e.target.value;
        setLocalValue(val);
    };
    
    const inputId = `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className={`mb-1 w-full relative ${className}`}>
            <label htmlFor={inputId} className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
            <div className="relative">
                <input 
                    id={inputId}
                    type={type} step={step} disabled={disabled} placeholder={placeholder} 
                    className={`w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-trampo-500/20 focus:border-trampo-500 outline-none transition-all duration-200 ease-in-out ring-offset-1 dark:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-100 placeholder:text-slate-400 ${Icon ? 'pl-9' : ''}`} 
                    value={localValue} onChange={handleChange} 
                />
                {Icon && <Icon className="absolute left-3 top-2.5 text-slate-400" size={16} />}
            </div>
        </div>
    );
});

export const DebouncedTextarea = memo(({ value, onChange, placeholder, className, id, showCounter = false, maxLength }: any) => {
    const [localValue, setLocalValue] = useState(value);
    const [isListening, setIsListening] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => { setLocalValue(value); adjustHeight(); }, [value]);
    
    const adjustHeight = () => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; } };
    
    useEffect(() => {
        const handler = setTimeout(() => { if (localValue !== value) onChange({ target: { value: localValue } }); }, 500);
        return () => clearTimeout(handler);
    }, [localValue, onChange, value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setLocalValue(e.target.value); adjustHeight(); };
    
    const handleMarkdown = (char: string, wrap: boolean) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = localValue || "";
        let newText = wrap ? text.substring(0, start) + char + text.substring(start, end) + char + text.substring(end) : text.substring(0, start) + char + text.substring(end);
        setLocalValue(newText);
        onChange({ target: { value: newText } });
        setTimeout(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(start + char.length, wrap ? end + char.length : start + char.length); adjustHeight(); }, 0);
    };

    const toggleListening = () => {
        if (!SpeechRecognition) { alert("Seu navegador não suporta reconhecimento de voz."); return; }
        if (isListening) { recognitionRef.current?.stop(); setIsListening(false); } else {
            const recognition = new SpeechRecognition(); recognition.lang = 'pt-BR'; recognition.continuous = true; recognition.interimResults = true;
            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript; }
                if (finalTranscript) { const newValue = (localValue ? localValue + ' ' : '') + finalTranscript; setLocalValue(newValue); onChange({ target: { value: newValue } }); }
            };
            recognition.onerror = (e:any) => setIsListening(false); recognition.onend = () => setIsListening(false);
            recognition.start(); recognitionRef.current = recognition; setIsListening(true);
        }
    };

    return (
        <div className="relative group">
             <div className="opacity-0 group-focus-within:opacity-100 transition-opacity absolute -top-8 right-0 z-10 flex items-center gap-2">
                <button onClick={toggleListening} className={`p-1.5 rounded-lg border shadow-sm transition-colors flex items-center gap-1 text-[10px] font-bold uppercase active:scale-95 ${isListening ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-500 hover:text-trampo-600'}`} title="Ditar texto">
                    {isListening ? <MicOff size={12}/> : <Mic size={12}/>} {isListening ? 'Gravando...' : 'Ditar'}
                </button>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit shadow-sm border border-slate-200 dark:border-slate-700">
                    <button onClick={() => handleMarkdown('**', true)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 active:scale-95 transition-transform" title="Negrito"><Bold size={12}/></button>
                    <button onClick={() => handleMarkdown('*', true)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 active:scale-95 transition-transform" title="Itálico"><Italic size={12}/></button>
                    <button onClick={() => handleMarkdown('\n• ', false)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 active:scale-95 transition-transform" title="Lista"><List size={12}/></button>
                </div>
            </div>
            <textarea id={id} ref={textareaRef} className={`${className} resize-none overflow-hidden ${isListening ? 'ring-2 ring-red-200 border-red-300' : ''}`} value={localValue} onChange={handleChange} placeholder={placeholder} rows={1}/>
            {showCounter && maxLength && (
                <div className={`text-[10px] text-right mt-1 font-medium transition-colors ${localValue?.length > maxLength ? 'text-red-500' : localValue?.length > maxLength * 0.9 ? 'text-amber-500' : 'text-slate-300'}`}>{localValue?.length || 0} / {maxLength}</div>
            )}
        </div>
    );
});
