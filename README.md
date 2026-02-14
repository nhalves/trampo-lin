
# Trampo-lin 🚀

**O Trampo-lin: Um salto na sua carreira.**

O Trampo-lin é uma plataforma completa e moderna para construção de currículos e gestão de candidaturas, construída com React e potencializada pela IA do Google Gemini.

Desenvolvido para ser intuitivo, bonito e poderoso, ele vai muito além de um simples editor de PDF.

![Preview](https://i.imgur.com/example-preview.png)

## ✨ Funcionalidades Principais

### 📝 Editor de Currículos Inteligente
*   **Edição em Tempo Real:** Veja as alterações instantaneamente.
*   **Assistente de IA (Gemini):**
    *   ✨ Melhora textos e descrições.
    *   🎯 Gera resumos profissionais de alto impacto.
    *   📋 Cria bullet points orientados a resultados.
    *   🔄 Traduz o currículo inteiro para Inglês ou Espanhol.
    *   🕵️‍♂️ Analisa sua foto de perfil com visão computacional.
*   **Múltiplos Temas:** Layouts modernos, clássicos, criativos e ATS-Friendly.
*   **Customização Total:** Fontes, cores, espaçamento e ordem das seções.

### 💼 Gestão de Vagas (Job Tracker)
*   **Quadro Kanban:** Organize suas candidaturas por colunas (Interesse, Aplicado, Entrevista, Oferta, Recusado).
*   **Arrastar e Soltar:** Mova cards facilmente entre as etapas.
*   **Histórico:** Veja há quanto tempo você aplicou para cada vaga.

### 🔗 Gerador de Perfil LinkedIn
*   **Headlines Otimizadas:** A IA cria títulos chamativos para seu perfil.
*   **Bio Narrativa (About):** Gera textos engajadores em formato de storytelling.
*   **Experiência Social:** Converte descrições técnicas de CV em posts de conquistas.

### 🛠️ Ferramentas Extras
*   **Simulador de Entrevista:** Gera perguntas técnicas e comportamentais baseadas no seu perfil.
*   **Estimativa Salarial:** Analisa seu cargo e experiência para estimar uma faixa salarial.
*   **Análise de Gaps:** Compara seu CV com uma vaga real e diz o que falta.
*   **Gerador de Carta de Apresentação:** Cria cartas personalizadas para cada aplicação.

## 🚀 Tecnologias

*   **Frontend:** React 18, TypeScript, Vite
*   **Estilização:** Tailwind CSS (com plugins de animação e tipografia)
*   **Ícones:** Lucide React
*   **IA:** Google Generative AI SDK (Gemini)
*   **Data:** date-fns

## 📦 Instalação e Uso Local

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/SEU_USUARIO/trampo-lin.git
    cd trampo-lin
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configuração da API Key (Opcional para Dev):**
    *   Você pode criar um arquivo `.env` na raiz: `API_KEY=Sua_Chave_Gemini`
    *   Ou inserir a chave diretamente nas configurações do app (ícone de robô).

4.  **Rode o projeto:**
    ```bash
    npm run dev
    ```

## ☁️ Deploy (Netlify/Vercel)

Este projeto está pronto para deploy.

1.  Importe o repositório na sua plataforma preferida.
2.  Configure a variável de ambiente `API_KEY` com sua chave do Google AI Studio (opcional, pois o usuário pode inserir a dele).
3.  Comando de build: `npm run build`.
4.  Diretório de saída: `dist`.

## 🔒 Privacidade

O Trampo-lin funciona **100% no navegador (Client-side)**.
*   Seus dados pessoais e currículos são salvos no `LocalStorage`.
*   Nenhum dado é enviado para servidores externos, exceto o texto estritamente necessário para o processamento da IA do Google Gemini quando você clica nos botões de gerar.

## 📄 Licença

Este projeto é open-source e gratuito para uso pessoal.
