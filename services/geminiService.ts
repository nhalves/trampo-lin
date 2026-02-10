
import { GoogleGenAI, Type } from "@google/genai";

const MODEL = 'gemini-3-flash-preview';

const getAI = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const improveText = async (text: string, context: string = 'resume'): Promise<string> => {
  const ai = getAI();
  if (!ai) return text;

  try {
    const prompt = `Você é um especialista em currículos. Reescreva o texto abaixo para uma seção de "${context}".
    Objetivo: Mais profissional, orientado a ação e resultados. Português do Brasil.
    
    Texto: "${text}"
    
    Retorne APENAS o texto melhorado.`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Error improving text:", error);
    return text;
  }
};

export const generateBulletPoints = async (role: string, company: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "";

  try {
    const prompt = `Gere 3 bullet points curtos e impactantes para um currículo, descrevendo conquistas comuns para o cargo de "${role}" na área de "${company || 'Tecnologia/Geral'}".
    Formato: Apenas texto, um por linha, começando com verbos de ação. Português do Brasil. Sem marcadores no inicio.`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return text;

   try {
    const prompt = `Traduza o seguinte texto de currículo para ${targetLanguage}. Mantenha termos técnicos em inglês se for o padrão da indústria. Retorne apenas o texto traduzido.
    
    Texto: "${text}"`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Error translating text:", error);
    return text;
  }
};

export const generateSummary = async (jobTitle: string, experience: any[]): Promise<string> => {
  const ai = getAI();
  if (!ai) return "";

  try {
    const expStr = experience.map(e => `${e.role} na ${e.company}`).join(', ');
    const prompt = `Crie um resumo profissional (3-4 frases) para um currículo.
    Cargo alvo: ${jobTitle}. Histórico: ${expStr}.
    Foque em autoridade e soft skills. Português do Brasil.`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "";
  }
};

export const suggestSkills = async (jobTitle: string): Promise<string[]> => {
  const ai = getAI();
  if (!ai) return [];

  try {
    const prompt = `Liste 6 skills (técnicas e comportamentais) essenciais para "${jobTitle}". Retorne JSON array de strings.`;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error suggesting skills:", error);
    return [];
  }
};

export const generateCoverLetter = async (resumeData: any, company: string, job: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Erro: API Key não configurada no ambiente.";

  try {
    const context = `Nome: ${resumeData.personalInfo.fullName}, Atual: ${resumeData.personalInfo.jobTitle}. 
    Resumo: ${resumeData.personalInfo.summary}.
    Skills: ${resumeData.skills.map((s:any) => s.name).join(', ')}.`;

    const prompt = `Escreva uma carta de apresentação curta e persuasiva (3 parágrafos) para a empresa "${company}" na vaga de "${job}".
    Use os dados do candidato: ${context}.
    Tom: Profissional e entusiasmado. Português do Brasil. Formatação em texto corrido (com quebras de linha).`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    return "Erro ao gerar carta. Tente novamente.";
  }
};

export const analyzeJobMatch = async (resumeInput: string | { mimeType: string, data: string }, jobDescription: string): Promise<any> => {
  const ai = getAI();
  if (!ai) return null;

  try {
    const parts: any[] = [];
    
    // Adiciona o Currículo (Texto ou Arquivo)
    if (typeof resumeInput === 'string') {
        parts.push({ text: `Currículo (Dados):\n${resumeInput.substring(0, 15000)}` });
    } else {
        parts.push({ inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } });
        parts.push({ text: "Analise o arquivo de currículo PDF fornecido acima." });
    }

    // Adiciona a descrição da vaga e as instruções
    parts.push({ text: `
    Vaga (Descrição):\n${jobDescription.substring(0, 5000)}

    Atue como um recrutador sênior e sistema ATS. Analise a aderência do currículo à vaga.
    Seja crítico, mas construtivo.
    
    Retorne um JSON estrito com:
    - score: numero inteiro de 0 a 100
    - feedback: array de strings com 3 pontos principais de melhoria ou destaque positivo
    - missingKeywords: array de strings com palavras-chave técnicas/soft-skills importantes que faltam
    `});

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts },
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.OBJECT, 
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        } 
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error(error);
    return null;
  }
};
