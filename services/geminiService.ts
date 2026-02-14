
import { GoogleGenAI } from "@google/genai";
import { AIConfig, ResumeData, TailoredContent, GapAnalysis } from "../types";

// Configuração Padrão
const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-001'; 

export const getAIConfig = (): AIConfig => {
  const saved = localStorage.getItem('trampolin_ai_config');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    provider: 'gemini',
    apiKey: '', // Se vazio, usa process.env no caso do Gemini
    model: DEFAULT_GEMINI_MODEL
  };
};

export const saveAIConfig = (config: AIConfig) => {
  localStorage.setItem('trampolin_ai_config', JSON.stringify(config));
};

// --- CORE LLM FUNCTION ---
const callLLM = async (prompt: string | any[], systemInstruction?: string, jsonMode: boolean = false): Promise<string> => {
    const config = getAIConfig();

    // 1. OPENROUTER HANDLER
    if (config.provider === 'openrouter') {
        if (!config.apiKey) throw new Error("API Key do OpenRouter não configurada.");
        
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${config.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin, 
                    "X-Title": "Trampo-lin Resume Builder",
                },
                body: JSON.stringify({
                    model: config.model || DEFAULT_OPENROUTER_MODEL,
                    messages: [
                        { role: "system", content: systemInstruction || "You are a helpful assistant." },
                        { role: "user", content: prompt }
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

    // 2. GEMINI HANDLER (DEFAULT)
    else {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const modelName = config.model || DEFAULT_GEMINI_MODEL;

        let contents: any = prompt;
        if (typeof prompt === 'string') {
            contents = prompt;
        } else {
             contents = { parts: prompt.map((p: any) => p.text ? { text: p.text } : { text: JSON.stringify(p) }) };
        }

        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: jsonMode ? "application/json" : "text/plain"
                }
            });
            return response.text || "";
        } catch (error) {
            console.error("Gemini Error:", error);
            throw error;
        }
    }
};

const cleanJSON = (text: string): string => {
  if (!text) return "{}";
  const cleaned = text.replace(/```json\n?|```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
      return cleaned.substring(firstBrace, lastBrace + 1);
  }
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
      return cleaned.substring(firstBracket, lastBracket + 1);
  }
  return cleaned;
};

// --- PUBLIC SERVICES ---

export const improveText = async (text: string, context: string = 'resume', tone: string = 'professional', action?: 'grammar' | 'shorter' | 'longer'): Promise<string> => {
  if (!text) return text;
  
  try {
    const tonePrompts: Record<string, string> = {
        professional: "formal, direto, orientado a resultados e corporativo.",
        creative: "envolvente, original, com vocabulário inspirador e dinâmico.",
        academic: "erudito, estruturado, detalhado e focado em precisão técnica.",
        enthusiastic: "energético, apaixonado, confiante e motivador."
    };

    let specificInstruction = `Reescreva o texto do usuário para torná-lo mais impactante.
    ESTILO: ${tonePrompts[tone] || tonePrompts['professional']}`;

    if (action === 'grammar') {
        specificInstruction = `Você é um corretor ortográfico estrito. Corrija APENAS erros gramaticais e de pontuação. Mantenha o estilo e palavras originais o máximo possível.`;
    } else if (action === 'shorter') {
        specificInstruction = `Resuma o texto mantendo os pontos-chave. Reduza o tamanho em cerca de 30%. Seja conciso.`;
    } else if (action === 'longer') {
        specificInstruction = `Expanda o texto adicionando detalhes profissionais e contexto, sem inventar mentiras. Aumente o tamanho em cerca de 30%.`;
    }

    const system = `${specificInstruction}
    IDIOMA: Português do Brasil.
    REGRAS: Retornar APENAS o texto resultante, sem aspas ou explicações.`;

    return await callLLM(`Texto original (seção: ${context}): "${text}"`, system);
  } catch (error) {
    return text;
  }
};

export const generateBulletPoints = async (role: string, company: string): Promise<string> => {
  try {
    const system = `Gere 3 bullet points curtos (máx 15 palavras cada) para um currículo.
    Comece com verbos fortes (Liderou, Criou, Otimizou). Português do Brasil.
    Retorne apenas o texto, um por linha.`;
    
    const prompt = `Cargo: "${role}", Empresa: "${company || 'Geral'}"`;
    return await callLLM(prompt, system);
  } catch (error) {
    return "";
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
   try {
    const system = `Traduza o conteúdo para ${targetLanguage}.
    Mantenha termos técnicos no original. Retorne apenas a tradução.`;
    return await callLLM(text, system);
  } catch (error) {
    return text;
  }
};

export const generateSummary = async (jobTitle: string, experience: any[]): Promise<string> => {
  try {
    const expStr = experience.slice(0, 3).map(e => `${e.role} em ${e.company}`).join(', ');
    const system = `Escreva um Resumo Profissional (Profile) para currículo em 1ª pessoa.
    Máximo 3 ou 4 frases. Foque em senioridade e soft skills. Português do Brasil. Sem títulos.`;
    
    const prompt = `Cargo Alvo: ${jobTitle}. Histórico: ${expStr}.`;
    return await callLLM(prompt, system);
  } catch (error) {
    return "";
  }
};

export const suggestSkills = async (jobTitle: string): Promise<string[]> => {
  try {
    const system = `Liste 8 habilidades (Hard/Soft Skills) essenciais para o cargo.
    Retorne APENAS um Array JSON de strings. Exemplo: ["Java", "Liderança"]`;
    
    const response = await callLLM(`Cargo: "${jobTitle}"`, system, true);
    const clean = cleanJSON(response);
    return JSON.parse(clean);
  } catch (error) {
    return [];
  }
};

export const generateCoverLetter = async (resumeData: any, company: string, job: string): Promise<string> => {
  try {
    const context = `Candidato: ${resumeData.personalInfo.fullName}, Cargo Atual: ${resumeData.personalInfo.jobTitle}. 
    Destaques: ${resumeData.personalInfo.summary}.`;

    const system = `Escreva uma Carta de Apresentação para a empresa "${company}", vaga "${job}".
    Estrutura: Saudação, Interesse na empresa, Relacionar 2 skills do candidato, Call to action.
    Tom: Profissional e humano. Português do Brasil.`;

    return await callLLM(context, system);
  } catch (error) {
    return "Não foi possível gerar a carta no momento. Verifique sua configuração de IA.";
  }
};

export const generateInterviewQuestions = async (resumeData: any): Promise<string> => {
    try {
        const context = `Cargo Alvo: ${resumeData.personalInfo.jobTitle}. Resumo: ${resumeData.personalInfo.summary}. Exp: ${JSON.stringify(resumeData.experience.slice(0,2))}`;
        const system = `Você é um recrutador técnico exigente. Com base no perfil do candidato, gere 5 perguntas de entrevista desafiadoras (3 técnicas, 2 comportamentais). Retorne apenas as perguntas em formato de lista Markdown.`;
        return await callLLM(context, system);
    } catch (e) { return "Erro ao gerar perguntas."; }
};

export const generateLinkedinHeadline = async (resumeData: any): Promise<string> => {
    try {
        const context = `Nome: ${resumeData.personalInfo.fullName}. Cargo: ${resumeData.personalInfo.jobTitle}. Skills: ${resumeData.skills.map((s:any) => s.name).join(', ')}`;
        const system = `Crie 3 opções de Headline para LinkedIn (máx 220 chars) que sejam atraentes e usem palavras-chave. Retorne apenas as 3 opções separadas por quebra de linha. Use ícones/emojis moderadamente.`;
        return await callLLM(context, system);
    } catch (e) { return "Erro ao gerar headline."; }
};

// --- NEW FEATURES ---

export const tailorResume = async (data: ResumeData, jobDescription: string): Promise<TailoredContent | null> => {
    try {
        const system = `Você é um especialista em ATS e carreira. Sua missão é reescrever o Resumo e as Experiências do candidato para dar "Match" com a descrição da vaga fornecida.
        
        REGRAS:
        1. NÃO minta sobre skills que o candidato não tem.
        2. Use palavras-chave da vaga para refrasear as experiências existentes.
        3. Destaque resultados que conectam com a vaga.
        4. O Resumo deve ser direto e usar a nomenclatura da vaga.
        5. Retorne APENAS JSON no formato: { "summary": "novo resumo...", "experience": [{ "id": "id_da_experiencia_original", "rewrittenDescription": "nova descrição..." }] }
        `;

        const prompt = `MEU CURRÍCULO:\nResumo: ${data.personalInfo.summary}\nExperiências: ${JSON.stringify(data.experience.map(e => ({id: e.id, role: e.role, company: e.company, desc: e.description})))}\n\nDESCRIÇÃO DA VAGA:\n${jobDescription}`;

        const response = await callLLM(prompt, system, true);
        return JSON.parse(cleanJSON(response));
    } catch (e) {
        console.error("Tailor Error", e);
        return null;
    }
};

export const analyzeGap = async (data: ResumeData, jobDescription: string): Promise<GapAnalysis | null> => {
    try {
        const system = `Analise o currículo do candidato em relação à vaga e identifique GAPS (lacunas).
        Retorne APENAS JSON: { "missingHardSkills": ["..."], "missingSoftSkills": ["..."], "improvements": ["dica 1", "dica 2"] }
        Seja rigoroso mas construtivo.`;

        const prompt = `MEU PERFIL: ${data.personalInfo.jobTitle}. Skills: ${data.skills.map(s => s.name).join(', ')}. Resumo: ${data.personalInfo.summary}.\n\nVAGA ALVO:\n${jobDescription}`;
        
        const response = await callLLM(prompt, system, true);
        return JSON.parse(cleanJSON(response));
    } catch (e) {
        return null;
    }
};

// --- MULTIMODAL ---

export const analyzeJobMatch = async (resumeInput: string | { mimeType: string, data: string }, jobDescription: string): Promise<any> => {
  const config = getAIConfig();
  
  if (config.provider === 'gemini' && typeof resumeInput !== 'string') {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      try {
        const response = await ai.models.generateContent({
            model: config.model || DEFAULT_GEMINI_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } },
                    { text: `DESCRIÇÃO DA VAGA:\n${jobDescription}\n\nAja como um ATS. Compare o currículo com a vaga. Retorne JSON: { "score": 0-100, "feedback": [], "missingKeywords": [] }` }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(cleanJSON(response.text || ""));
      } catch (e) { console.error(e); return null; }
  }

  // Fallback para OpenRouter ou Gemini Texto
  
  let resumeTextContent = "";
  if (typeof resumeInput === 'string') {
      resumeTextContent = resumeInput;
  } else {
      const system = `Aja como um sistema ATS. Compare o currículo (anexo) com a vaga.
      Retorne APENAS JSON: { "score": (0-100), "feedback": ["..."], "missingKeywords": ["..."] }`;

      const prompt = [
          { type: "text", text: `VAGA:\n${jobDescription.substring(0, 5000)}` },
          {
              type: "image_url",
              image_url: {
                  url: `data:${resumeInput.mimeType};base64,${resumeInput.data}`
              }
          }
      ];

      try {
          const response = await callLLM(prompt, system, true);
          return JSON.parse(cleanJSON(response));
      } catch (error) {
          return { score: 0, feedback: ["Erro de visão computacional. Tente copiar o texto."], missingKeywords: [] };
      }
  }

  try {
      const system = `Aja como um sistema ATS. Compare o currículo com a vaga.
      Retorne APENAS JSON: { "score": (0-100), "feedback": ["..."], "missingKeywords": ["..."] }`;
      
      const prompt = `CURRÍCULO:\n${resumeTextContent.substring(0, 20000)}\n\nVAGA:\n${jobDescription.substring(0, 5000)}`;
      
      const response = await callLLM(prompt, system, true);
      return JSON.parse(cleanJSON(response));
  } catch (error) {
      return { score: 0, feedback: ["Erro na análise."], missingKeywords: [] };
  }
};

export const extractResumeFromPdf = async (fileData: { mimeType: string, data: string }): Promise<any> => {
    const config = getAIConfig();

    if (config.provider !== 'gemini') {
        alert("A extração de PDF requer o provedor Google Gemini nativo.");
        return null;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Extraia os dados do currículo para JSON: { personalInfo: {fullName, jobTitle, email, phone, address, linkedin, summary}, experience: [{role, company, startDate, endDate, description}], skills: [{name, level}] }. Traduza para PT-BR.`;
        
        const response = await ai.models.generateContent({
            model: config.model || DEFAULT_GEMINI_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: fileData.mimeType, data: fileData.data } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(cleanJSON(response.text || ""));
    } catch (e) {
        console.error(e);
        return null;
    }
};
