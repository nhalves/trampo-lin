
import { GoogleGenAI, Type } from "@google/genai";
import { AIConfig, ResumeData, TailoredContent, GapAnalysis, PhotoAnalysis } from "../types";

// Configuração Padrão
const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview'; // Updated to flash preview for speed/cost
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-001'; 

export const getAIConfig = (): AIConfig => {
  const saved = localStorage.getItem('trampolin_ai_config');
  if (saved) {
    const parsed = JSON.parse(saved);
    return { ...parsed };
  }
  return {
    provider: 'gemini',
    apiKey: '', 
    model: DEFAULT_GEMINI_MODEL
  };
};

export const saveAIConfig = (config: AIConfig) => {
  localStorage.setItem('trampolin_ai_config', JSON.stringify(config));
};

// Helper to get the effective API Key
const getEffectiveApiKey = (config: AIConfig): string => {
    if (config.apiKey && config.apiKey.trim() !== '') {
        return config.apiKey;
    }
    if (process.env.API_KEY && process.env.API_KEY.trim() !== '') {
        return process.env.API_KEY;
    }
    return '';
};

export const validateConnection = async (config: AIConfig): Promise<boolean> => {
    const apiKey = getEffectiveApiKey(config);
    if (!apiKey) return false;

    try {
        if (config.provider === 'openrouter') {
             const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: config.model || DEFAULT_OPENROUTER_MODEL,
                    messages: [{ role: "user", content: "Ping" }]
                })
            });
            return response.ok;
        } else {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            await ai.models.generateContent({
                model: config.model || DEFAULT_GEMINI_MODEL,
                contents: { parts: [{ text: "Ping" }] }
            });
            return true;
        }
    } catch (e) {
        console.error("Validation Error", e);
        return false;
    }
};

// --- CORE LLM FUNCTION ---
const callLLM = async (
    prompt: string | any[], 
    systemInstruction?: string, 
    jsonMode: boolean = false, 
    responseSchema?: any
): Promise<string> => {
    const config = getAIConfig();
    const apiKey = getEffectiveApiKey(config);

    if (!apiKey) {
        throw new Error("API Key não encontrada. Por favor, configure sua chave nas configurações de IA (ícone de robô).");
    }

    if (config.provider === 'openrouter') {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin, 
                    "X-Title": "Trampo-lin Resume Builder",
                },
                body: JSON.stringify({
                    model: config.model || DEFAULT_OPENROUTER_MODEL,
                    messages: [
                        { role: "system", content: systemInstruction || "You are a helpful assistant." },
                        { role: "user", content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }
                    ],
                    response_format: jsonMode ? { type: "json_object" } : undefined
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || "Erro na API OpenRouter");
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (error) {
            console.error("OpenRouter Error:", error);
            throw error;
        }
    }
    else {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const modelName = config.model || DEFAULT_GEMINI_MODEL;

        let contents: any;
        if (typeof prompt === 'string') {
            contents = { parts: [{ text: prompt }] };
        } else if (Array.isArray(prompt)) {
             contents = { parts: prompt };
        } else {
             contents = prompt;
        }

        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: jsonMode ? "application/json" : "text/plain",
                    responseSchema: responseSchema,
                }
            });
            return response.text || "";
        } catch (error: any) {
            console.error("Gemini Error:", error);
            if (error.message?.includes('API key')) {
                throw new Error("Chave de API inválida. Verifique suas configurações.");
            }
            throw error;
        }
    }
};

const cleanJSON = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.replace(/```json\n?|```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
      if (firstBracket >= 0 && firstBracket < firstBrace && lastBracket > lastBrace) {
          return cleaned.substring(firstBracket, lastBracket + 1);
      }
      return cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  if (firstBracket >= 0 && lastBracket > firstBracket) {
      return cleaned.substring(firstBracket, lastBracket + 1);
  }
  
  return cleaned;
};

// ... (Rest of the services remain mostly the same, keeping existing exports)

export const improveText = async (text: string, context: string = 'resume', tone: string = 'professional', action?: 'grammar' | 'shorter' | 'longer'): Promise<string> => {
  if (!text) return text;
  try {
    const tonePrompts: Record<string, string> = {
        professional: "formal, direto, orientado a resultados e corporativo.",
        creative: "envolvente, original, com vocabulário inspirador e dinâmico.",
        academic: "erudito, estruturado, detalhado e focado em precisão técnica.",
        enthusiastic: "energético, apaixonado, confiante e motivador."
    };
    let specificInstruction = `Reescreva o texto do usuário para torná-lo mais impactante. ESTILO: ${tonePrompts[tone] || tonePrompts['professional']}`;
    if (action === 'grammar') specificInstruction = `Você é um corretor ortográfico estrito. Corrija APENAS erros gramaticais e de pontuação.`;
    else if (action === 'shorter') specificInstruction = `Resuma o texto mantendo os pontos-chave. Reduza o tamanho em cerca de 30%.`;
    else if (action === 'longer') specificInstruction = `Expanda o texto adicionando detalhes profissionais e contexto.`;

    const system = `${specificInstruction} IDIOMA: Português do Brasil. REGRAS: Retornar APENAS o texto resultante.`;
    return await callLLM(`Texto original (seção: ${context}): "${text}"`, system);
  } catch (error) { return text; }
};

export const generateBulletPoints = async (role: string, company: string): Promise<string> => {
  try {
    const system = `Gere 3 bullet points curtos (máx 15 palavras cada) para um currículo. Comece com verbos fortes. Retorne apenas o texto, um por linha.`;
    return await callLLM(`Cargo: "${role}", Empresa: "${company || 'Geral'}"`, system);
  } catch (error) { return ""; }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
   try {
    const system = `Traduza o conteúdo para ${targetLanguage}. Mantenha termos técnicos no original.`;
    return await callLLM(text, system);
  } catch (error) { return text; }
};

export const generateSummary = async (jobTitle: string, experience: any[]): Promise<string> => {
  try {
    const expStr = experience.slice(0, 3).map(e => `${e.role} em ${e.company}`).join(', ');
    const system = `Escreva um Resumo Profissional para currículo em 1ª pessoa. Máximo 4 frases. Foque em senioridade.`;
    return await callLLM(`Cargo Alvo: ${jobTitle}. Histórico: ${expStr}.`, system);
  } catch (error) { return ""; }
};

export const suggestSkills = async (jobTitle: string): Promise<string[]> => {
  try {
    const system = `Liste 8 habilidades (Hard/Soft Skills) essenciais para o cargo.`;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const response = await callLLM(`Cargo: "${jobTitle}"`, system, true, schema);
    return JSON.parse(cleanJSON(response));
  } catch (error) { return []; }
};

export const generateCoverLetter = async (resumeData: any, company: string, job: string): Promise<string> => {
  try {
    const context = `Candidato: ${resumeData.personalInfo.fullName}, Cargo: ${resumeData.personalInfo.jobTitle}.`;
    const system = `Escreva uma Carta de Apresentação para a empresa "${company}", vaga "${job}". Tom: Profissional e humano.`;
    return await callLLM(context, system);
  } catch (error) { return "Erro ao gerar carta."; }
};

export const generateInterviewQuestions = async (resumeData: any): Promise<{technical: string[], behavioral: string[]}> => {
    try {
        const context = `Cargo: ${resumeData.personalInfo.jobTitle}. Resumo: ${resumeData.personalInfo.summary}.`;
        const system = `Gere perguntas de entrevista. Retorne 3 TÉCNICAS e 2 COMPORTAMENTAIS.`;
        const schema = { type: Type.OBJECT, properties: { technical: { type: Type.ARRAY, items: { type: Type.STRING } }, behavioral: { type: Type.ARRAY, items: { type: Type.STRING } } } };
        const response = await callLLM(context, system, true, schema);
        return JSON.parse(cleanJSON(response));
    } catch (e) { return { technical: ["Erro"], behavioral: [] }; }
};

export const generateLinkedinHeadline = async (resumeData: any): Promise<string[]> => {
    try {
        const context = `Nome: ${resumeData.personalInfo.fullName}. Cargo: ${resumeData.personalInfo.jobTitle}. Skills: ${resumeData.skills.map((s:any) => s.name).join(', ')}`;
        const system = `Crie 4 opções de Headline para LinkedIn. Máximo 220 chars. Use barras (|) ou bullets.`;
        const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
        const response = await callLLM(context, system, true, schema);
        return JSON.parse(cleanJSON(response));
    } catch (e) { return []; }
};

export const generateLinkedinAbout = async (resumeData: any): Promise<string> => {
    try {
        const context = `Cargo: ${resumeData.personalInfo.jobTitle}. Resumo: ${resumeData.personalInfo.summary}.`;
        const system = `Escreva um "Sobre" para LinkedIn. Storytelling, 1ª pessoa, engajador.`;
        return await callLLM(context, system);
    } catch (e) { return "Erro ao gerar Sobre."; }
};

export const rewriteExperienceForLinkedin = async (experience: any): Promise<string> => {
    try {
        const context = `Cargo: ${experience.role}. Empresa: ${experience.company}. Descrição: ${experience.description}`;
        const system = `Reescreva para LinkedIn. Use bullet points com emojis. Foque em resultados.`;
        return await callLLM(context, system);
    } catch (e) { return experience.description; }
};

export const tailorResume = async (data: ResumeData, jobDescription: string): Promise<TailoredContent | null> => {
    try {
        const system = `Especialista em ATS. Reescreva Resumo e Experiências para dar match com a vaga.`;
        const schema = { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, experience: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, rewrittenDescription: { type: Type.STRING } } } } } };
        const prompt = `MEU CURRÍCULO:\n${JSON.stringify(data)}\n\nDESCRIÇÃO DA VAGA:\n${jobDescription}`;
        const response = await callLLM(prompt, system, true, schema);
        return JSON.parse(cleanJSON(response));
    } catch (e) { return null; }
};

export const analyzeGap = async (data: ResumeData, jobDescription: string): Promise<GapAnalysis | null> => {
    try {
        const system = `Analise o currículo em relação à vaga e identifique GAPS.`;
        const schema = { type: Type.OBJECT, properties: { missingHardSkills: { type: Type.ARRAY, items: { type: Type.STRING } }, missingSoftSkills: { type: Type.ARRAY, items: { type: Type.STRING } }, improvements: { type: Type.ARRAY, items: { type: Type.STRING } } } };
        const prompt = `PERFIL: ${data.personalInfo.jobTitle}. Skills: ${data.skills.map(s => s.name).join(', ')}.\n\nVAGA:\n${jobDescription}`;
        const response = await callLLM(prompt, system, true, schema);
        return JSON.parse(cleanJSON(response));
    } catch (e) { return null; }
};

export const estimateSalary = async (data: ResumeData): Promise<string> => {
    try {
        const system = `Aja como RH. Estime faixa salarial mensal (BRL) para o perfil. Retorne apenas string (ex: "R$ 5k - 7k").`;
        const prompt = `Cargo: ${data.personalInfo.jobTitle}. Exp: ${data.experience.length * 2} anos.`;
        return await callLLM(prompt, system);
    } catch (e) { return "R$ N/A"; }
};

export const analyzePhoto = async (base64Image: string): Promise<PhotoAnalysis | null> => {
    const config = getAIConfig();
    const apiKey = getEffectiveApiKey(config);
    if (!apiKey) return null;
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    try {
        if (config.provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const schema = { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.ARRAY, items: { type: Type.STRING } }, lighting: { type: Type.STRING, enum: ["good", "bad", "average"] }, professionalism: { type: Type.STRING, enum: ["high", "medium", "low"] } } };
            const response = await ai.models.generateContent({ model: config.model || "gemini-2.0-flash-001", contents: { parts: [ { text: "Analise foto perfil profissional." }, { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } } ] }, config: { responseMimeType: "application/json", responseSchema: schema } });
            return JSON.parse(cleanJSON(response.text || ""));
        } else { return null; }
    } catch (e) { return null; }
};

export const analyzeJobMatch = async (resumeInput: string | { mimeType: string, data: string }, jobDescription: string): Promise<any> => {
  const config = getAIConfig();
  const apiKey = getEffectiveApiKey(config);
  if (!apiKey) throw new Error("API Key ausente.");
  const schema = { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.ARRAY, items: { type: Type.STRING } }, missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } } } };
  
  if (config.provider === 'gemini' && typeof resumeInput !== 'string') {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      try {
        const response = await ai.models.generateContent({ model: config.model || DEFAULT_GEMINI_MODEL, contents: { parts: [ { inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } }, { text: `VAGA:\n${jobDescription}\nCompare.` } ] }, config: { responseMimeType: "application/json", responseSchema: schema } });
        return JSON.parse(cleanJSON(response.text || ""));
      } catch (e) { return null; }
  }
  // Fallback simplified
  try {
      const system = `Aja como ATS. Compare. Retorne JSON {score, feedback, missingKeywords}`;
      const response = await callLLM(`VAGA: ${jobDescription}`, system, true, schema);
      return JSON.parse(cleanJSON(response));
  } catch (error) { return { score: 0, feedback: ["Erro."], missingKeywords: [] }; }
};

export const extractResumeFromPdf = async (fileData: { mimeType: string, data: string }): Promise<any> => {
    const config = getAIConfig();
    const apiKey = getEffectiveApiKey(config);
    if (config.provider !== 'gemini') { alert("Requer Gemini nativo."); return null; }
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({ model: config.model || "gemini-2.0-flash-001", contents: { parts: [ { inlineData: { mimeType: fileData.mimeType, data: fileData.data } }, { text: "Extraia dados JSON PT-BR." } ] }, config: { responseMimeType: "application/json" } });
        return JSON.parse(cleanJSON(response.text || ""));
    } catch (e) { return null; }
};
