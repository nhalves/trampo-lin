
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIConfig, ResumeData, TailoredContent, GapAnalysis, PhotoAnalysis } from "../types";

// Configuração Padrão — atualize aqui se o modelo for descontinuado
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-001';

// Instruções de Sistema Base
const SYSTEM_INSTRUCTION = "You are an expert Resume AI Assistant helping users create professional resumes and LinkedIn profiles. Be professional, direct, and helpful.";

// --- SCHEMAS REUTILIZÁVEIS ---

const STRING_ARRAY_SCHEMA: Schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
};

// #20 — RESUME_SCHEMA sincronizado com ResumeData: cobre todas as seções para extração de PDF
const RESUME_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        personalInfo: {
            type: Type.OBJECT,
            properties: {
                fullName: { type: Type.STRING },
                jobTitle: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                address: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                github: { type: Type.STRING },
                website: { type: Type.STRING },
                summary: { type: Type.STRING },
            }
        },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    company: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    description: { type: Type.STRING },
                    current: { type: Type.BOOLEAN }
                }
            }
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    school: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    location: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            }
        },
        skills: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    level: { type: Type.NUMBER }
                }
            }
        },
        languages: { type: Type.ARRAY, items: { type: Type.STRING } },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    url: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING }
                }
            }
        },
        certifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    date: { type: Type.STRING }
                }
            }
        },
        volunteer: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    organization: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            }
        },
        awards: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    date: { type: Type.STRING }
                }
            }
        },
        publications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    publisher: { type: Type.STRING },
                    date: { type: Type.STRING },
                    url: { type: Type.STRING }
                }
            }
        }
    }
};

// #8 — Cache em memória para evitar leitura de localStorage a cada chamada de IA
let _cachedAIConfig: AIConfig | null = null;

// #1 — try/catch no parse; #8 — cache em memória; #18 — API Key obfuscada com btoa
export const getAIConfig = (): AIConfig => {
    if (_cachedAIConfig) return _cachedAIConfig;
    const saved = localStorage.getItem('trampolin_ai_config');
    if (saved) {
        try {
            // Tenta decodificar btoa (formato novo), com fallback para JSON puro (formato legado)
            let parsed: AIConfig;
            try {
                parsed = JSON.parse(atob(saved));
            } catch {
                parsed = JSON.parse(saved); // fallback legado
            }
            _cachedAIConfig = parsed;
            return _cachedAIConfig;
        } catch {
            console.warn('trampolin_ai_config corrompido — usando padrão.');
        }
    }
    _cachedAIConfig = { provider: 'gemini', apiKey: '', model: DEFAULT_GEMINI_MODEL };
    return _cachedAIConfig;
};

// #8 — Invalida cache ao salvar; #18 — salva obfuscado com btoa
export const saveAIConfig = (config: AIConfig) => {
    _cachedAIConfig = config;
    try {
        localStorage.setItem('trampolin_ai_config', btoa(JSON.stringify(config)));
    } catch {
        localStorage.setItem('trampolin_ai_config', JSON.stringify(config));
    }
};

const getEffectiveApiKey = (config: AIConfig): string => {
    if (config.apiKey?.trim()) return config.apiKey;
    if (process.env.API_KEY?.trim()) return process.env.API_KEY;
    return '';
};

const getMimeTypeFromBase64 = (base64String: string): string => {
    const match = base64String.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    return match && match.length > 1 ? match[1] : 'image/jpeg';
};

// Remove artefatos comuns de LLMs (aspas, markdown, preâmbulos)
const cleanTextResponse = (text: string): string => {
    if (!text) return "";
    let cleaned = text;

    // Remove blocos de código markdown
    cleaned = cleaned.replace(/```(?:json|markdown|text)?\n?([\s\S]*?)```/g, '$1');

    // Remove aspas envolventes se o modelo retornou "Texto"
    cleaned = cleaned.replace(/^["']|["']$/g, '');

    // Remove prefixos conversacionais comuns
    cleaned = cleaned.replace(/^(Here is|Sure,|Certainly,|I have generated|Below is).*?:\s*/i, '');

    return cleaned.trim();
};

// #21 — Função interna; use callLLM (com retry) externamente
const _callLLM = async (
    prompt: string | any[],
    schema?: Schema
): Promise<string> => {
    const config = getAIConfig();
    const apiKey = getEffectiveApiKey(config);

    if (!apiKey) throw new Error("API Key não configurada.");

    // Adapta a instrução do sistema baseada na presença de Schema
    let systemInstruction = SYSTEM_INSTRUCTION;
    if (schema) {
        systemInstruction += " You effectively act as a middleware between raw user data and a structured JSON frontend. Your output must be strictly valid JSON conforming to the provided schema. Do not output Markdown blocks.";
    } else {
        systemInstruction += " Return only the requested text content. Do not output conversational filler. Do not use Markdown formatting (like **bold**) unless specifically requested.";
    }

    if (config.provider === 'openrouter') {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "Trampo-lin",
                },
                body: JSON.stringify({
                    model: config.model || DEFAULT_OPENROUTER_MODEL,
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }
                    ],
                    response_format: schema ? { type: "json_object" } : undefined
                })
            });
            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                const msg = errBody?.error?.message || response.statusText;
                if (response.status === 401) throw new Error(`API Key inválida ou sem permissão. (${msg})`);
                if (response.status === 429) throw new Error(`Limite de requisições atingido. Aguarde e tente novamente. (${msg})`);
                throw new Error(`Erro na API OpenRouter (${response.status}): ${msg}`);
            }
            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (error) {
            console.error("OpenRouter Error:", error);
            throw error;
        }
    } else {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const modelName = config.model || DEFAULT_GEMINI_MODEL;

        let contents: any = typeof prompt === 'string' ? { parts: [{ text: prompt }] } : (Array.isArray(prompt) ? { parts: prompt } : prompt);

        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: schema ? "application/json" : "text/plain",
                    responseSchema: schema,
                }
            });
            return response.text || "";
        } catch (error: any) {
            console.error("Gemini Error:", error);
            const msg: string = error?.message || '';
            if (msg.includes('API_KEY_INVALID') || msg.includes('401')) throw new Error('API Key inválida. Verifique suas configurações de IA.');
            if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) throw new Error('Limite de requisições atingido. Aguarde alguns instantes.');
            if (msg.includes('SAFETY')) throw new Error('Conteúdo bloqueado por filtros de segurança da IA.');
            if (!navigator.onLine) throw new Error('Sem conexão com a internet.');
            throw error;
        }
    }
};

const parseResponse = (text: string): any => {
    if (!text) return null;
    try {
        const cleaned = text.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parse Error", e, text);
        return null;
    }
};

// #21 — Retry automático com backoff para erros transitórios de rede
// NÃO faz retry em erros de autenticação, limite de quota ou filtros de segurança
const withRetry = async <T>(fn: () => Promise<T>, retries = 1): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries <= 0) throw error;
        const msg: string = error?.message || '';
        const isNonRetryable =
            msg.includes('API Key') ||
            msg.includes('inválida') ||
            msg.includes('401') ||
            msg.includes('403') ||
            msg.includes('Limite') ||
            msg.includes('SAFETY') ||
            msg.includes('segurança');
        if (isNonRetryable) throw error;
        await new Promise<void>(r => setTimeout(r, 1000));
        return withRetry(fn, retries - 1);
    }
};

const callLLM = (prompt: string | any[], schema?: Schema): Promise<string> =>
    withRetry(() => _callLLM(prompt, schema));

// --- FEATURE IMPLEMENTATIONS ---

export const improveText = async (text: string, context: string, tone: string, action?: 'grammar' | 'shorter' | 'longer'): Promise<string> => {
    if (!text) return "";
    const instructions: Record<string, string> = {
        grammar: "Fix grammar, punctuation, and cohesion only. Keep original tone.",
        shorter: "Summarize the text, keeping key achievements. Make it 30% shorter.",
        longer: "Expand the text with professional context and detail.",
        default: `Rewrite to be more impactful. Tone: ${tone}. Language: PT-BR.`
    };

    const prompt = `Context: ${context}. Instruction: ${instructions[action || 'default'] || instructions.default}. Text: "${text}". Return ONLY the improved text.`;
    return cleanTextResponse(await callLLM(prompt));
};

export const generateBulletPoints = async (role: string, company: string): Promise<string> => {
    const prompt = `Generate 3 strong, action-oriented resume bullet points for the role of "${role}" at "${company || 'Company'}". Language: PT-BR.`;
    const response = await callLLM(prompt, STRING_ARRAY_SCHEMA);
    const items = parseResponse(response);

    if (Array.isArray(items)) {
        return items.map(i => `• ${i}`).join('\n');
    }
    return "";
};

export const generateSummary = async (jobTitle: string, experience: any[]): Promise<string> => {
    const expContext = experience.slice(0, 3).map(e => `${e.role} at ${e.company}`).join(', ');
    const prompt = `Write a professional resume summary (1st person) for a "${jobTitle}". Highlights: ${expContext}. Max 4 sentences. Tone: Senior & Result-oriented. Language: PT-BR. Return ONLY the text.`;
    return cleanTextResponse(await callLLM(prompt));
};

export const suggestSkills = async (jobTitle: string): Promise<string[]> => {
    const prompt = `List 8 essential hard/soft skills for a "${jobTitle}". Language: PT-BR.`;
    const response = await callLLM(prompt, STRING_ARRAY_SCHEMA);
    return parseResponse(response) || [];
};

export const generateCoverLetter = async (resumeData: any, company: string, job: string): Promise<string> => {
    const prompt = `Write a cover letter for "${company}", role "${job}". Candidate: ${resumeData.personalInfo.fullName}, current role: ${resumeData.personalInfo.jobTitle}. Structure: Hook, Why Me, Why Company, Call to Action. Language: PT-BR. Return ONLY the body content, no headers or addresses.`;
    return cleanTextResponse(await callLLM(prompt));
};

export const generateInterviewQuestions = async (resumeData: any): Promise<{ technical: string[], behavioral: string[] }> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            technical: { type: Type.ARRAY, items: { type: Type.STRING } },
            behavioral: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };
    const prompt = `Generate interview questions for a ${resumeData.personalInfo.jobTitle}. 3 Technical, 2 Behavioral. Language: PT-BR.`;
    const response = await callLLM(prompt, schema);
    return parseResponse(response) || { technical: [], behavioral: [] };
};

export const tailorResume = async (data: ResumeData, jobDescription: string): Promise<TailoredContent | null> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            experience: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        rewrittenDescription: { type: Type.STRING }
                    }
                }
            }
        }
    };
    // #9 — Skills incluídas no prompt para melhor match de keywords ATS
    const prompt = `Act as an ATS Expert. Tailor this resume to match the Job Description. Rewrite the summary and experience descriptions to include keywords from the JD without lying.
    RESUME: ${JSON.stringify(data.personalInfo)}
    CANDIDATE SKILLS: ${data.skills.map(s => s.name).join(', ')}
    Experience IDs: ${data.experience.map(e => e.id).join(', ')}
    JOB DESCRIPTION: ${jobDescription}`;

    const response = await callLLM(prompt, schema);
    return parseResponse(response);
};

export const analyzeGap = async (data: ResumeData, jobDescription: string): Promise<GapAnalysis | null> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            missingHardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSoftSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };
    const prompt = `Compare Candidate vs Job. Identify Gaps.
    Candidate Skills: ${data.skills.map(s => s.name).join(', ')}
    Job: ${jobDescription}`;

    const response = await callLLM(prompt, schema);
    return parseResponse(response);
};

export const analyzeJobMatch = async (resumeInput: string | { mimeType: string, data: string }, jobDescription: string): Promise<any> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER, description: "0-100 score" },
            feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };

    if (typeof resumeInput !== 'string') {
        // #17 — Upload de PDF com inlineData só funciona com Gemini (API nativa)
        // OpenRouter não suporta o formato inlineData — lança erro explícito
        const config = getAIConfig();
        if (config.provider === 'openrouter') {
            throw new Error('O upload de PDF para análise de currículo não é compatível com o provedor OpenRouter. Mude para Google Gemini nas configurações de IA, ou cole o texto do currículo manualmente.');
        }
        const promptParts = [
            { inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } },
            { text: `Analyze this resume against the Job Description: "${jobDescription}". Provide match score, feedback, and missing keywords.` }
        ];
        return parseResponse(await callLLM(promptParts, schema));
    } else {
        const prompt = `Analyze resume vs Job. Job: ${jobDescription}. Resume JSON: ${resumeInput}`;
        return parseResponse(await callLLM(prompt, schema));
    }
};

export const analyzePhoto = async (base64Image: string): Promise<PhotoAnalysis | null> => {
    const mimeType = getMimeTypeFromBase64(base64Image);
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
            lighting: { type: Type.STRING, enum: ["good", "bad", "average"] },
            professionalism: { type: Type.STRING, enum: ["high", "medium", "low"] }
        }
    };

    try {
        const promptParts = [
            { text: "Analyze this profile photo for a CV/LinkedIn. Score it 0-100 on professionalism, lighting, and framing." },
            { inlineData: { mimeType: mimeType, data: cleanBase64 } }
        ];
        return parseResponse(await callLLM(promptParts, schema));
    } catch (e) {
        return null;
    }
};

export const extractResumeFromPdf = async (fileData: { mimeType: string, data: string }): Promise<any> => {
    try {
        const promptParts = [
            { inlineData: { mimeType: fileData.mimeType, data: fileData.data } },
            { text: "Extract all resume data into the specified JSON structure. Be precise with dates and names." }
        ];
        return parseResponse(await callLLM(promptParts, RESUME_SCHEMA));
    } catch (e) {
        console.error("Extraction failed", e);
        return null;
    }
};

// #6 — Calcula anos reais de experiência somando durações (datas no formato MM/YYYY ou YYYY)
const calcTotalYearsExp = (experience: ResumeData['experience']): number => {
    return experience.reduce((total, e) => {
        const parseDate = (s: string): Date | null => {
            if (!s) return null;
            const parts = s.split('/');
            if (parts.length === 2) return new Date(parseInt(parts[1]), parseInt(parts[0]) - 1);
            if (parts.length === 1 && /^\d{4}$/.test(s)) return new Date(parseInt(s), 0);
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d;
        };
        const start = parseDate(e.startDate);
        const end = e.current ? new Date() : parseDate(e.endDate);
        if (!start || !end) return total;
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return total + Math.max(0, years);
    }, 0);
};

export const estimateSalary = async (data: ResumeData): Promise<string> => {
    const yearsExp = Math.round(calcTotalYearsExp(data.experience));
    const prompt = `Act as a Brazilian Tech Recruiter. Estimate monthly salary range (BRL) for: ${data.personalInfo.jobTitle}, ~${yearsExp} years of real experience (${data.experience.length} position(s)). Return ONLY the range string (e.g. "R$ 8.000 - R$ 12.000").`;
    return cleanTextResponse(await callLLM(prompt));
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const prompt = `Translate to ${targetLanguage}. Keep technical terms original. Text: "${text}". Return ONLY the translated text.`;
    return cleanTextResponse(await callLLM(prompt));
};

// Batch translation: translates all resume text in a SINGLE API call
export const translateResumeData = async (data: ResumeData, targetLanguage: string): Promise<ResumeData> => {
    // Build a flat map of all translatable strings with unique keys
    const textMap: Record<string, string> = {
        summary: data.personalInfo.summary || '',
        jobTitle: data.personalInfo.jobTitle || '',
    };
    data.experience.forEach((e, i) => {
        textMap[`exp_${i}_role`] = e.role || '';
        textMap[`exp_${i}_company`] = e.company || '';
        textMap[`exp_${i}_description`] = e.description || '';
    });
    data.education.forEach((e, i) => {
        textMap[`edu_${i}_school`] = e.school || '';
        textMap[`edu_${i}_degree`] = e.degree || '';
        if (e.description) textMap[`edu_${i}_description`] = e.description;
    });
    data.projects.forEach((p, i) => {
        textMap[`proj_${i}_name`] = p.name || '';
        textMap[`proj_${i}_description`] = p.description || '';
    });
    // #9 — also translate volunteer, awards, publications
    data.volunteer?.forEach((v, i) => {
        textMap[`vol_${i}_role`] = v.role || '';
        textMap[`vol_${i}_organization`] = v.organization || '';
        textMap[`vol_${i}_description`] = v.description || '';
    });
    data.awards?.forEach((a, i) => {
        textMap[`award_${i}_title`] = a.title || '';
        textMap[`award_${i}_issuer`] = a.issuer || '';
    });
    data.publications?.forEach((p, i) => {
        textMap[`pub_${i}_title`] = p.title || '';
        textMap[`pub_${i}_publisher`] = p.publisher || '';
    });
    if (data.coverLetter?.content) textMap['coverLetter'] = data.coverLetter.content;

    const schema: Schema = { type: Type.OBJECT, properties: Object.fromEntries(Object.keys(textMap).map(k => [k, { type: Type.STRING }])) };
    const prompt = `Translate the following JSON values to ${targetLanguage}. Keep technical terms, proper nouns, and company names in their original form. Return a JSON object with the same keys.\n${JSON.stringify(textMap)}`;

    try {
        const response = await callLLM(prompt, schema);
        const translated: Record<string, string> = parseResponse(response) || {};

        const result: ResumeData = JSON.parse(JSON.stringify(data)); // deep clone
        result.personalInfo.summary = translated['summary'] ?? data.personalInfo.summary;
        result.personalInfo.jobTitle = translated['jobTitle'] ?? data.personalInfo.jobTitle;
        result.experience = data.experience.map((e, i) => ({
            ...e,
            role: translated[`exp_${i}_role`] ?? e.role,
            company: translated[`exp_${i}_company`] ?? e.company,
            description: translated[`exp_${i}_description`] ?? e.description,
        }));
        result.education = data.education.map((e, i) => ({
            ...e,
            school: translated[`edu_${i}_school`] ?? e.school,
            degree: translated[`edu_${i}_degree`] ?? e.degree,
            description: translated[`edu_${i}_description`] ?? e.description,
        }));
        result.projects = data.projects.map((p, i) => ({
            ...p,
            name: translated[`proj_${i}_name`] ?? p.name,
            description: translated[`proj_${i}_description`] ?? p.description,
        }));
        if (result.volunteer) {
            result.volunteer = data.volunteer.map((v, i) => ({
                ...v,
                role: translated[`vol_${i}_role`] ?? v.role,
                organization: translated[`vol_${i}_organization`] ?? v.organization,
                description: translated[`vol_${i}_description`] ?? v.description,
            }));
        }
        if (result.awards) {
            result.awards = data.awards.map((a, i) => ({
                ...a,
                title: translated[`award_${i}_title`] ?? a.title,
                issuer: translated[`award_${i}_issuer`] ?? a.issuer,
            }));
        }
        if (result.publications) {
            result.publications = data.publications.map((p, i) => ({
                ...p,
                title: translated[`pub_${i}_title`] ?? p.title,
                publisher: translated[`pub_${i}_publisher`] ?? p.publisher,
            }));
        }
        if (result.coverLetter && translated['coverLetter']) {
            result.coverLetter = { ...result.coverLetter, content: translated['coverLetter'] };
        }
        return result;
    } catch (e) {
        console.error('Batch translation failed, returning original', e);
        return data;
    }
};

// --- LINKEDIN SPECIFIC ---

export const generateLinkedinHeadline = async (data: ResumeData, tone: string = 'Professional'): Promise<string[]> => {
    const topSkills = data.skills.slice(0, 5).map(s => s.name).join(', ');
    const prompt = `Generate 4 LinkedIn Headlines for: Role: ${data.personalInfo.jobTitle}. Skills: ${topSkills}. 
    Tone: ${tone}.
    Rules: 
    1. Use separators like | or • 
    2. Include a "Helping X do Y" statement in at least 2 options.
    3. Max 220 chars.
    4. Return ONLY a JSON array of strings.`;

    return parseResponse(await callLLM(prompt, STRING_ARRAY_SCHEMA)) || [];
};

export const generateLinkedinAbout = async (data: ResumeData, tone: string = 'Storytelling'): Promise<string> => {
    const skills = data.skills.map(s => s.name).join(', ');
    const lastExp = data.experience[0];
    const expSummary = lastExp ? `Currently ${lastExp.role} at ${lastExp.company}` : '';

    const prompt = `Write an engaging LinkedIn 'About' section (Bio).
    Candidate: ${data.personalInfo.fullName}, ${data.personalInfo.jobTitle}.
    Context: ${data.personalInfo.summary}. ${expSummary}.
    Skills: ${skills}.
    
    Tone: ${tone} (First person, conversational, professional but authentic).
    Structure:
    1. Hook (catchy opening).
    2. My Journey (briefly connects past to present).
    3. What I do / My Expertise.
    4. Call to Action / Contact.
    
    Rules:
    - Use paragraphs for readability.
    - Language: PT-BR.
    - Return ONLY the text content.
    - Do NOT wrap in JSON.
    - Do NOT use Markdown formatting (bold, italics, headers) as LinkedIn does not support it directly.
    - Use Emoji moderately if tone permits.`;

    return cleanTextResponse(await callLLM(prompt));
};

export const rewriteExperienceForLinkedin = async (experience: any, tone: string = 'Professional'): Promise<string> => {
    const prompt = `Rewrite this job experience for a LinkedIn Profile.
    Role: ${experience.role} at ${experience.company}.
    Original Desc: ${experience.description}.
    
    Tone: ${tone}.
    Format:
    - Use a short intro sentence.
    - Use bullet points with emojis for key achievements.
    - Focus on Results and Impact (CAR method - Challenge, Action, Result).
    - Since LinkedIn doesn't support Markdown, use Unicode Bold text (like 𝗧𝗵𝗶𝘀) for key metrics or headers if needed. Do NOT use standard markdown (**bold**).
    
    Language: PT-BR.
    Return ONLY the text content.`;

    return cleanTextResponse(await callLLM(prompt));
};

export const validateConnection = async (config: AIConfig): Promise<boolean> => {
    const apiKey = getEffectiveApiKey(config);
    if (!apiKey) return false;
    try {
        if (config.provider === 'openrouter') {
            // #2 — Verificar response.ok; uma API Key inválida retorna 401 mas fetch não lança
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: config.model || DEFAULT_OPENROUTER_MODEL, messages: [{ role: "user", content: "hi" }] })
            });
            return response.ok;
        } else {
            const ai = new GoogleGenAI({ apiKey });
            await ai.models.generateContent({ model: config.model || DEFAULT_GEMINI_MODEL, contents: { parts: [{ text: "hi" }] } });
            return true;
        }
    } catch (e) { return false; }
};
