
import { GoogleGenAI, Type } from "@google/genai";

const MODEL = 'gemini-3-flash-preview';

const getAI = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// Helper: Limpa blocos de markdown do JSON (```json ... ```)
const cleanJSON = (text: string): string => {
  if (!text) return "{}";
  return text.replace(/```json\n?|```/g, '').trim();
};

export const improveText = async (text: string, context: string = 'resume'): Promise<string> => {
  const ai = getAI();
  if (!ai) return text;

  try {
    const prompt = `Você é um especialista em currículos e RH. Reescreva o texto abaixo (seção: "${context}").
    Objetivo: Tornar mais profissional, usar verbos de ação e focar em resultados quantificáveis. 
    Idioma: Português do Brasil.
    Manter o tamanho aproximado, sem inventar fatos.
    
    Texto Original: "${text}"
    
    Retorne APENAS o texto melhorado, sem aspas ou introduções.`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Error improving text:", error);
    return text; // Fallback to original
  }
};

export const generateBulletPoints = async (role: string, company: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "";

  try {
    const prompt = `Gere 3 bullet points curtos (máx 15 palavras cada) e impactantes para um currículo.
    Cargo: "${role}", Área/Empresa: "${company || 'Geral'}".
    Formato: Apenas texto, um por linha. Comece com verbos fortes (Liderou, Criou, Otimizou). Português do Brasil.`;

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
    const prompt = `Traduza o seguinte conteúdo de currículo para ${targetLanguage}.
    Regra: Mantenha termos técnicos (Frameworks, Softwares, Metodologias) no original se for padrão de mercado.
    Retorne apenas a tradução.
    
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
    const expStr = experience.slice(0, 3).map(e => `${e.role} em ${e.company}`).join(', ');
    const prompt = `Escreva um Resumo Profissional (Profile) para currículo em 1ª pessoa.
    Cargo Alvo: ${jobTitle}.
    Histórico Recente: ${expStr}.
    
    Regras:
    - Máximo 3 ou 4 frases.
    - Foque em senioridade, paixão e soft skills principais.
    - Português do Brasil. Sem títulos.`;

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
    const prompt = `Liste 8 habilidades (Hard Skills e Soft Skills misturadas) essenciais para o cargo de "${jobTitle}" hoje no mercado.
    Retorne APENAS um Array JSON de strings. Exemplo: ["Java", "Liderança"]`;
    
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const clean = cleanJSON(response.text || "");
    return JSON.parse(clean);
  } catch (error) {
    console.error("Error suggesting skills:", error);
    return [];
  }
};

export const generateCoverLetter = async (resumeData: any, company: string, job: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Erro: API Key não configurada.";

  try {
    const context = `Candidato: ${resumeData.personalInfo.fullName}, Cargo Atual: ${resumeData.personalInfo.jobTitle}. 
    Destaques: ${resumeData.personalInfo.summary}.`;

    const prompt = `Escreva uma Carta de Apresentação personalizada para a empresa "${company}", vaga "${job}".
    Use os dados: ${context}.
    Estrutura:
    1. Saudação profissional.
    2. Por que estou interessado na ${company}.
    3. Como minhas skills (cite 2 relevantes do resumo) ajudam.
    4. Encerramento com "call to action" para entrevista.
    
    Tom: Profissional, confiante, mas humano. Português do Brasil.`;

    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    return "Não foi possível gerar a carta no momento. Tente novamente.";
  }
};

export const analyzeJobMatch = async (resumeInput: string | { mimeType: string, data: string }, jobDescription: string): Promise<any> => {
  const ai = getAI();
  if (!ai) return null;

  try {
    const parts: any[] = [];
    
    if (typeof resumeInput === 'string') {
        parts.push({ text: `MEU CURRÍCULO (JSON):\n${resumeInput.substring(0, 15000)}` });
    } else {
        parts.push({ inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } });
        parts.push({ text: "Analise o arquivo PDF do currículo anexado." });
    }

    parts.push({ text: `
    DESCRIÇÃO DA VAGA:\n${jobDescription.substring(0, 5000)}

    TAREFA: Aja como um sistema ATS (Applicant Tracking System) rigoroso.
    Compare o currículo com a vaga.

    RETORNE APENAS JSON:
    {
      "score": (número 0-100),
      "feedback": ["Ponto positivo 1", "Ponto negativo 1", "Dica de melhoria"],
      "missingKeywords": ["Skill A", "Ferramenta B", "Certificação C"]
    }
    `});

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts },
      config: { responseMimeType: "application/json" }
    });

    const clean = cleanJSON(response.text || "");
    return JSON.parse(clean);
  } catch (error) {
    console.error("ATS Error:", error);
    return { score: 0, feedback: ["Erro ao analisar. Tente novamente."], missingKeywords: [] };
  }
};

export const extractResumeFromPdf = async (fileData: { mimeType: string, data: string }): Promise<any> => {
  const ai = getAI();
  if (!ai) return null;

  try {
    const prompt = `
    ATUE COMO UM PARSER DE DADOS. 
    Analise o documento de currículo fornecido.
    Extraia TODOS os dados possíveis e mapeie para a estrutura JSON abaixo.
    Traduza/Normalize para Português do Brasil onde apropriado.
    
    ESTRUTURA ALVO (JSON):
    {
      "personalInfo": {
        "fullName": "Nome completo ou Título principal",
        "jobTitle": "Cargo atual ou pretendido",
        "email": "",
        "phone": "",
        "address": "Cidade, Estado",
        "linkedin": "url ou usuario",
        "summary": "Resumo profissional (perfil)"
      },
      "experience": [
        { "id": "gerar_id_unico", "role": "Cargo", "company": "Empresa", "startDate": "MM/YYYY ou YYYY", "endDate": "MM/YYYY ou 'Atual'", "current": boolean, "description": "Resumo das atividades" }
      ],
      "education": [
        { "id": "gerar_id_unico", "school": "Instituição", "degree": "Curso/Grau", "startDate": "Ano", "endDate": "Ano" }
      ],
      "skills": [
        { "id": "gerar_id_unico", "name": "Nome da Skill", "level": 3 } 
      ],
      "languages": ["Inglês Avançado", "Espanhol Básico"]
    }

    REGRAS:
    1. Se não encontrar algo, deixe string vazia ou array vazio.
    2. Skills: infira o nível (1-5) se possível, senão use 3.
    3. Datas: tente normalizar para MM/AAAA.
    `;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: fileData.mimeType, data: fileData.data } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });

    const clean = cleanJSON(response.text || "");
    return JSON.parse(clean);
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    return null;
  }
};
