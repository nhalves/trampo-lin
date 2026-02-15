
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIConfig, ResumeData, TailoredContent, GapAnalysis, PhotoAnalysis } from "../types";

// Configuração Padrão
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'; 
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-001'; 

// Instruções de Sistema Otimizadas
const SYSTEM_INSTRUCTION = "You are an expert Resume AI Assistant. You effectively act as a middleware between raw user data and a structured JSON frontend. Your output must be strictly valid JSON conforming to the provided schema. Do not output Markdown blocks. Do not be conversational.";

// --- SCHEMAS REUTILIZÁVEIS ---
// Definir schemas estritos elimina a necessidade de "adivinhar" o JSON e reduz latência/tokens.

const STRING_ARRAY_SCHEMA: Schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
};

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
                    location: { type: Type.STRING }
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
        languages: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};

export const getAIConfig = (): AIConfig => {
  const saved = localStorage.getItem('trampolin_ai_config');
  if (saved) return JSON.parse(saved);
  return { provider: 'gemini', apiKey: '', model: DEFAULT_GEMINI_MODEL };
};

export const saveAIConfig = (config: AIConfig) => {
  localStorage.setItem('trampolin_ai_config', JSON.stringify(config));
};

const getEffectiveApiKey = (config: AIConfig): string => {
    if (config.apiKey?.trim()) return config.apiKey;
    if (process.env.API_KEY?.trim()) return process.env.API_KEY;
    return '';
};

// Robust Mime Type Detection
const getMimeTypeFromBase64 = (base64String: string): string => {
    const match = base64String.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    return match && match.length > 1 ? match[1] : 'image/jpeg';
};

// --- GENERIC LLM CALLER ---
// Agora aceita um Schema opcional para forçar JSON estruturado no Gemini
const callLLM = async (
    prompt: string | any[], 
    schema?: Schema
): Promise<string> => {
    const config = getAIConfig();
    const apiKey = getEffectiveApiKey(config);

    if (!apiKey) throw new Error("API Key não configurada.");

    if (config.provider === 'openrouter') {
        // OpenRouter fallback (menos robusto com schemas complexos, usamos JSON mode genérico)
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
                        { role: "system", content: SYSTEM_INSTRUCTION },
                        { role: "user", content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }
                    ],
                    response_format: schema ? { type: "json_object" } : undefined
                })
            });
            if (!response.ok) throw new Error("OpenRouter API Error");
            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (error) {
            console.error("OpenRouter Error:", error);
            throw error;
        }
    } else {
        // Native Gemini Implementation
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const modelName = config.model || DEFAULT_GEMINI_MODEL;
        
        let contents: any = typeof prompt === 'string' ? { parts: [{ text: prompt }] } : (Array.isArray(prompt) ? { parts: prompt } : prompt);

        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    // Se tiver schema, força MIME JSON e passa o schema
                    responseMimeType: schema ? "application/json" : "text/plain",
                    responseSchema: schema,
                }
            });
            return response.text || "";
        } catch (error: any) {
            console.error("Gemini Error:", error);
            throw error;
        }
    }
};

// Helper: Garante que o JSON retornado esteja limpo, mesmo se o modelo adicionar ```json
const parseResponse = (text: string): any => {
    if (!text) return null;
    try {
        // Remove markdown wrappers se existirem
        const cleaned = text.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parse Error", e, text);
        return null; // Fail gracefully
    }
};

// --- FEATURE IMPLEMENTATIONS ---

export const improveText = async (text: string, context: string, tone: string, action?: 'grammar' | 'shorter' | 'longer'): Promise<string> => {
    if (!text) return "";
    const instructions: Record<string, string> = {
        grammar: "Fix grammar, punctuation, and cohesion only. Keep original tone.",
        shorter: "Summarize the text, keeping key achievements. Make it 30% shorter.",
        longer: "Expand the text with professional context and detail.",
        default: `Rewrite to be more impactful. Tone: ${tone}. Language: PT-BR.`
    };
    
    // Para texto simples, não usamos schema, pois queremos liberdade criativa, mas instruímos o modelo
    const prompt = `Context: ${context}. Instruction: ${instructions[action || 'default'] || instructions.default}. Text: "${text}"`;
    return await callLLM(prompt);
};

export const generateBulletPoints = async (role: string, company: string): Promise<string> => {
    // Usamos Schema de Array para garantir que volta uma lista limpa, depois formatamos
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
    const prompt = `Write a professional resume summary (1st person) for a "${jobTitle}". Highlights: ${expContext}. Max 4 sentences. Tone: Senior & Result-oriented. Language: PT-BR.`;
    return await callLLM(prompt);
};

export const suggestSkills = async (jobTitle: string): Promise<string[]> => {
    const prompt = `List 8 essential hard/soft skills for a "${jobTitle}". Language: PT-BR.`;
    const response = await callLLM(prompt, STRING_ARRAY_SCHEMA); // Force Array<String>
    return parseResponse(response) || [];
};

export const generateCoverLetter = async (resumeData: any, company: string, job: string): Promise<string> => {
    const prompt = `Write a cover letter for "${company}", role "${job}". Candidate: ${resumeData.personalInfo.fullName}, current role: ${resumeData.personalInfo.jobTitle}. Structure: Hook, Why Me, Why Company, Call to Action. Language: PT-BR.`;
    return await callLLM(prompt);
};

export const generateInterviewQuestions = async (resumeData: any): Promise<{technical: string[], behavioral: string[]}> => {
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
    const prompt = `Act as an ATS Expert. Tailor this resume to match the Job Description. Rewrite the summary and experience descriptions to include keywords from the JD without lying.
    RESUME: ${JSON.stringify(data.personalInfo)} & Experience IDs: ${data.experience.map(e => e.id).join(', ')}
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
        // Multimodal call
        const promptParts = [
            { inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } },
            { text: `Analyze this resume against the Job Description: "${jobDescription}". Provide match score, feedback, and missing keywords.` }
        ];
        return parseResponse(await callLLM(promptParts, schema));
    } else {
        // Text call
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
    // RESUME_SCHEMA já está definido no topo
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

// --- Non-Schema Helper ---
export const estimateSalary = async (data: ResumeData): Promise<string> => {
    // Retorna string simples
    const prompt = `Act as a Brazilian Tech Recruiter. Estimate monthly salary range (BRL) for: ${data.personalInfo.jobTitle}, ${data.experience.length * 2} years exp approximate. Return ONLY the range string (e.g. "R$ 8.000 - R$ 12.000").`;
    return await callLLM(prompt);
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const prompt = `Translate to ${targetLanguage}. Keep technical terms original. Text: "${text}"`;
    return await callLLM(prompt);
};

export const generateLinkedinHeadline = async (data: ResumeData): Promise<string[]> => {
    const prompt = `Generate 4 catchy LinkedIn Headlines for: ${data.personalInfo.fullName}, ${data.personalInfo.jobTitle}. Keywords: ${data.skills.map(s => s.name).join(', ')}. Max 220 chars.`;
    return parseResponse(await callLLM(prompt, STRING_ARRAY_SCHEMA)) || [];
};

export const generateLinkedinAbout = async (data: ResumeData): Promise<string> => {
    const prompt = `Write an engaging LinkedIn 'About' section for ${data.personalInfo.jobTitle}. Use storytelling. 1st Person.`;
    return await callLLM(prompt);
};

export const rewriteExperienceForLinkedin = async (experience: any): Promise<string> => {
    const prompt = `Rewrite this job experience as a LinkedIn post/achievement block. Use appropriate emojis. Role: ${experience.role}. Desc: ${experience.description}`;
    return await callLLM(prompt);
};

export const validateConnection = async (config: AIConfig): Promise<boolean> => {
    const apiKey = getEffectiveApiKey(config);
    if (!apiKey) return false;
    try {
        // Simple ping
        if (config.provider === 'openrouter') {
             await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: config.model || DEFAULT_OPENROUTER_MODEL, messages: [{ role: "user", content: "hi" }] })
            });
            return true;
        } else {
            const ai = new GoogleGenAI({ apiKey });
            await ai.models.generateContent({ model: config.model || DEFAULT_GEMINI_MODEL, contents: { parts: [{ text: "hi" }] } });
            return true;
        }
    } catch (e) { return false; }
};
