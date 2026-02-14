
import { GoogleGenAI, Type } from "@google/genai";
import { AIConfig, ResumeData, TailoredContent, GapAnalysis, PhotoAnalysis } from "../types";

// Configuração Padrão
const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview'; // Updated to flash preview for speed/cost
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-001'; 

export const getAIConfig = (): AIConfig => {
  const saved = localStorage.getItem('trampolin_ai_config');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Ensure we don't have partial invalid state
    return {
        ...parsed,
        // If provider is gemini and no user key, fallback logic happens in callLLM
    };
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
    // 1. User provided key in Settings
    if (config.apiKey && config.apiKey.trim() !== '') {
        return config.apiKey;
    }
    // 2. Environment variable injected at build time
    if (process.env.API_KEY && process.env.API_KEY.trim() !== '') {
        return process.env.API_KEY;
    }
    return '';
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

    // 1. OPENROUTER HANDLER
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
                    // OpenRouter simple JSON mode
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
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const modelName = config.model || DEFAULT_GEMINI_MODEL;

        let contents: any;
        if (typeof prompt === 'string') {
            contents = { parts: [{ text: prompt }] };
        } else if (Array.isArray(prompt)) {
             // Handle array of parts (multimodal)
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
            // Improve error message for users
            if (error.message?.includes('API key')) {
                throw new Error("Chave de API inválida. Verifique suas configurações.");
            }
            throw error;
        }
    }
};

const cleanJSON = (text: string): string => {
  if (!text) return "{}";
  // Remove Markdown code blocks
  let cleaned = text.replace(/```json\n?|```/g, '').trim();
  // Find valid JSON bounds
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
      // It's likely an object
      // Check if array is outer (sometimes models wrap objects in arrays)
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
    console.error(error);
    return text; // Fallback to original
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
    const system = `Liste 8 habilidades (Hard/Soft Skills) essenciais para o cargo.`;
    
    const schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };
    
    const response = await callLLM(`Cargo: "${jobTitle}"`, system, true, schema);
    const clean = cleanJSON(response);
    return JSON.parse(clean);
  } catch (error) {
    console.error("Suggest Skills Error", error);
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

export const generateInterviewQuestions = async (resumeData: any): Promise<{technical: string[], behavioral: string[]}> => {
    try {
        const context = `Cargo Alvo: ${resumeData.personalInfo.jobTitle}. Resumo: ${resumeData.personalInfo.summary}. Exp: ${JSON.stringify(resumeData.experience.slice(0,2))}`;
        const system = `Você é um recrutador técnico exigente. Com base no perfil do candidato, gere perguntas de entrevista.
        Retorne 3 perguntas TÉCNICAS (hard skills) e 2 COMPORTAMENTAIS (soft skills).`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                technical: { type: Type.ARRAY, items: { type: Type.STRING } },
                behavioral: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        };

        const response = await callLLM(context, system, true, schema);
        return JSON.parse(cleanJSON(response));
    } catch (e) { 
        return { technical: ["Erro ao gerar"], behavioral: [] }; 
    }
};

export const generateLinkedinHeadline = async (resumeData: any): Promise<string[]> => {
    try {
        const context = `Nome: ${resumeData.personalInfo.fullName}. Cargo: ${resumeData.personalInfo.jobTitle}. Skills: ${resumeData.skills.map((s:any) => s.name).join(', ')}`;
        const system = `Crie 4 opções de Headline para LinkedIn altamente otimizadas para recrutadores.
        
        REGRAS RÍGIDAS:
        1. Máximo 220 caracteres.
        2. Use palavras-chave separadas por barras (|) ou bullets (•).
        3. SEM hashtags (#).
        4. SEM frases motivacionais clichês.
        5. Foco em Cargo + Especialidade + Valor Gerado.`;
        
        const schema = {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        };

        const response = await callLLM(context, system, true, schema);
        return JSON.parse(cleanJSON(response));
    } catch (e) { 
        return []; 
    }
};

export const generateLinkedinAbout = async (resumeData: any): Promise<string> => {
    try {
        const context = `Cargo: ${resumeData.personalInfo.jobTitle}. Resumo CV: ${resumeData.personalInfo.summary}. Exp: ${JSON.stringify(resumeData.experience.slice(0,2))}`;
        const system = `Escreva uma seção "Sobre" (About) para o LinkedIn.
        ESTILO: Storytelling, primeira pessoa, conversacional mas profissional.
        ESTRUTURA:
        1. Gancho (Hook): Comece com o que te move.
        2. Experiência: Resumo da trajetória.
        3. Conquistas: 1 ou 2 destaques.
        4. Call to Action: Convite para conexão.
        Use emojis moderadamente. Português do Brasil.`;
        
        return await callLLM(context, system);
    } catch (e) { return "Erro ao gerar Sobre."; }
};

export const rewriteExperienceForLinkedin = async (experience: any): Promise<string> => {
    try {
        const context = `Cargo: ${experience.role}. Empresa: ${experience.company}. Descrição Original: ${experience.description}`;
        const system = `Reescreva esta experiência para o LinkedIn.
        Use bullet points com emojis.
        Foque em "Eu fiz", "Eu liderei", "Resultados".
        Torne o texto mais engajador para uma rede social, menos formal que um CV tradicional.`;
        
        return await callLLM(context, system);
    } catch (e) { return experience.description; }
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
        `;

        const schema = {
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

        const prompt = `MEU CURRÍCULO:\nResumo: ${data.personalInfo.summary}\nExperiências: ${JSON.stringify(data.experience.map(e => ({id: e.id, role: e.role, company: e.company, desc: e.description})))}\n\nDESCRIÇÃO DA VAGA:\n${jobDescription}`;

        const response = await callLLM(prompt, system, true, schema);
        return JSON.parse(cleanJSON(response));
    } catch (e) {
        console.error("Tailor Error", e);
        return null;
    }
};

export const analyzeGap = async (data: ResumeData, jobDescription: string): Promise<GapAnalysis | null> => {
    try {
        const system = `Analise o currículo do candidato em relação à vaga e identifique GAPS (lacunas).
        Seja rigoroso mas construtivo.`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                missingHardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingSoftSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        };

        const prompt = `MEU PERFIL: ${data.personalInfo.jobTitle}. Skills: ${data.skills.map(s => s.name).join(', ')}. Resumo: ${data.personalInfo.summary}.\n\nVAGA ALVO:\n${jobDescription}`;
        
        const response = await callLLM(prompt, system, true, schema);
        return JSON.parse(cleanJSON(response));
    } catch (e) {
        return null;
    }
};

export const estimateSalary = async (data: ResumeData): Promise<string> => {
    try {
        const system = `Aja como um especialista em compensação salarial (RH). Analise o perfil.
        Retorne uma estimativa de faixa salarial mensal (em BRL - Reais) para o mercado brasileiro.
        Considere a senioridade implícita e localização.
        Retorne apenas a string: ex: "R$ 5.000 - R$ 7.000 (Junior)" ou "R$ 15k - R$ 20k (Senior)". Seja direto.`;

        const prompt = `Cargo: ${data.personalInfo.jobTitle}. Local: ${data.personalInfo.address}. Skills: ${data.skills.map(s => s.name).join(', ')}. Exp (anos): ${data.experience.length * 2} (aprox)`;
        return await callLLM(prompt, system);
    } catch (e) { return "R$ N/A"; }
};

export const analyzePhoto = async (base64Image: string): Promise<PhotoAnalysis | null> => {
    const config = getAIConfig();
    const apiKey = getEffectiveApiKey(config);
    if (!apiKey) return null;

    // Remove header data if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    try {
        // Only Gemini supports vision natively in this setup for now
        if (config.provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lighting: { type: Type.STRING, enum: ["good", "bad", "average"] },
                    professionalism: { type: Type.STRING, enum: ["high", "medium", "low"] }
                }
            };

            const prompt = `Aja como um recrutador profissional. Analise esta foto de perfil para um currículo (LinkedIn/CV).
            Critérios: Iluminação, Fundo, Expressão, Vestimenta.`;
            
            const response = await ai.models.generateContent({
                model: config.model || "gemini-2.0-flash-001",
                contents: {
                    parts: [
                        { text: prompt },
                        { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
            
            return JSON.parse(cleanJSON(response.text || ""));
        } else {
             // Fallback text if using OpenRouter without vision capabilities configured
             return null;
        }
    } catch (e) {
        console.error("Photo Analysis Error", e);
        return null;
    }
};

// --- MULTIMODAL ---

export const analyzeJobMatch = async (resumeInput: string | { mimeType: string, data: string }, jobDescription: string): Promise<any> => {
  const config = getAIConfig();
  const apiKey = getEffectiveApiKey(config);
  
  if (!apiKey) throw new Error("API Key ausente.");

  const schema = {
      type: Type.OBJECT,
      properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
  };
  
  if (config.provider === 'gemini' && typeof resumeInput !== 'string') {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      try {
        const response = await ai.models.generateContent({
            model: config.model || DEFAULT_GEMINI_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } },
                    { text: `DESCRIÇÃO DA VAGA:\n${jobDescription}\n\nAja como um ATS. Compare o currículo com a vaga.` }
                ]
            },
            config: { 
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        return JSON.parse(cleanJSON(response.text || ""));
      } catch (e) { console.error(e); return null; }
  }

  // Fallback para OpenRouter ou Gemini Texto
  let resumeTextContent = "";
  if (typeof resumeInput === 'string') {
      resumeTextContent = resumeInput;
  } else {
      // Basic logic to handle image if we fell here
      const prompt = [
          { type: "text", text: `VAGA:\n${jobDescription.substring(0, 5000)}` },
          {
              type: "image_url",
              image_url: {
                  url: `data:${resumeInput.mimeType};base64,${resumeInput.data}`
              }
          }
      ];
      // Note: callLLM handles OpenRouter structure for image_url
      // We pass plain text instructions for schema in non-native schema providers
      const system = `Aja como um sistema ATS. Compare o currículo (anexo) com a vaga.
      Retorne APENAS JSON: { "score": (0-100), "feedback": ["..."], "missingKeywords": ["..."] }`;

      try {
          const response = await callLLM(prompt, system, true);
          return JSON.parse(cleanJSON(response));
      } catch (error) {
          return { score: 0, feedback: ["Erro de visão computacional."], missingKeywords: [] };
      }
  }

  try {
      const system = `Aja como um sistema ATS. Compare o currículo com a vaga.`;
      const prompt = `CURRÍCULO:\n${resumeTextContent.substring(0, 20000)}\n\nVAGA:\n${jobDescription.substring(0, 5000)}`;
      
      const response = await callLLM(prompt, system, true, schema);
      return JSON.parse(cleanJSON(response));
  } catch (error) {
      return { score: 0, feedback: ["Erro na análise."], missingKeywords: [] };
  }
};

export const extractResumeFromPdf = async (fileData: { mimeType: string, data: string }): Promise<any> => {
    const config = getAIConfig();
    const apiKey = getEffectiveApiKey(config);

    if (config.provider !== 'gemini') {
        alert("A extração de PDF requer o provedor Google Gemini nativo.");
        return null;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const prompt = `Extraia os dados do currículo para JSON. Traduza para PT-BR.`;
        
        // Complex schema for Resume Data extraction is recommended but large. 
        // We will stick to prompt engineering with MIME type for this complex nested object 
        // or define a simplified schema if needed. 
        // For now, prompt + responseMimeType is often sufficient for PDF extraction.
        
        const response = await ai.models.generateContent({
            model: config.model || "gemini-2.0-flash-001",
            contents: {
                parts: [
                    { inlineData: { mimeType: fileData.mimeType, data: fileData.data } },
                    { text: prompt }
                ]
            },
            config: { 
                responseMimeType: "application/json",
                // Defining full schema for ResumeData is verbose, letting model infer structure from prompt context often works well for large docs
            }
        });
        return JSON.parse(cleanJSON(response.text || ""));
    } catch (e) {
        console.error(e);
        return null;
    }
};
