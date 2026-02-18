
import { ResumeData } from '../types';

export const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const calculateWordCount = (data: ResumeData): number => {
    const textFields = [
        data.personalInfo.summary,
        data.personalInfo.fullName,
        data.personalInfo.jobTitle,
        ...data.experience.map(e => `${e.role} ${e.company} ${e.description}`),
        ...data.education.map(e => `${e.school} ${e.degree}`),
        ...data.projects.map(p => `${p.name} ${p.description}`),
        ...data.skills.map(s => s.name)
    ].join(' ');
    
    return textFields.split(/\s+/).filter(w => w.length > 0).length;
};

// Optimized for WebP
export const compressImage = (file: File, maxWidth = 300, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                const mimeType = 'image/webp';
                const dataUrl = canvas.toDataURL(mimeType, quality);
                
                if (dataUrl.indexOf('image/webp') === -1 || dataUrl.length > 500000) {
                     resolve(canvas.toDataURL('image/jpeg', quality));
                } else {
                     resolve(dataUrl);
                }
            };
        };
    });
};

export const safeMergeResume = (current: ResumeData, imported: any): ResumeData => {
    return {
        ...current,
        ...imported,
        personalInfo: { ...current.personalInfo, ...(imported.personalInfo || {}) },
        settings: { ...current.settings, ...(imported.settings || {}) },
        experience: imported.experience || current.experience || [],
        education: imported.education || current.education || [],
        projects: imported.projects || current.projects || [],
        certifications: imported.certifications || current.certifications || [],
        volunteer: imported.volunteer || current.volunteer || [],
        awards: imported.awards || current.awards || [],
        publications: imported.publications || current.publications || [],
        interests: imported.interests || current.interests || [],
        references: imported.references || current.references || [],
        customSections: imported.customSections || current.customSections || [],
        skills: imported.skills || current.skills || [],
        languages: imported.languages || current.languages || [],
    };
};

// Item 22: Check LocalStorage Quota
export const checkStorageQuota = (key: string, data: any): boolean => {
    try {
        const serialized = JSON.stringify(data);
        const size = new Blob([serialized]).size;
        
        // Browser generic limit ~5MB
        const limit = 5 * 1024 * 1024; 
        
        // Estimate current usage
        let total = 0;
        for (let x in localStorage) {
            if (localStorage.hasOwnProperty(x)) {
                total += (localStorage[x].length * 2);
            }
        }
        
        // Warn if over 80%
        if (total + size > limit * 0.8) {
            console.warn("LocalStorage is nearing capacity.");
        }
        
        if (total + size > limit) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
};

// Item 23: Basic HTML Sanitization for Export
export const sanitizeHtml = (html: string): string => {
    const temp = document.createElement('div');
    temp.textContent = html;
    // Decode text content back to HTML but remove dangerous tags
    // Since our export takes innerHTML of a rendered React component, it is mostly safe,
    // but we want to strip script tags or event handlers just in case.
    // However, innerHTML from the DOM is already parsed.
    // The main risk is if we re-inject this HTML somewhere.
    // For DOCX export, we just want to ensure no <script> tags.
    return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
               .replace(/on\w+="[^"]*"/g, "");
};
