# Trampo-lin 🚀

**O Trampo-lin, um salto na carreira.**

Um criador de currículos moderno, gratuito e open-source, construído com React e impulsionado pela Inteligência Artificial do Google Gemini.

## ✨ Funcionalidades

- **Edição em Tempo Real:** Veja as alterações no currículo instantaneamente enquanto edita.
- **Inteligência Artificial (Gemini):**
  - ✨ **Melhoria de Texto:** Reescreve frases para soarem mais profissionais.
  - 📝 **Resumo Automático:** Gera um perfil profissional com base na sua experiência.
  - 🌐 **Tradução:** Traduz todo o currículo para Inglês ou Espanhol com um clique.
  - 🎯 **Sugestão de Skills:** Sugere habilidades baseadas no seu cargo.
  - 🔍 **Analisador ATS:** Compara seu currículo com uma descrição de vaga e dá dicas.
  - ✉️ **Gerador de Carta de Apresentação:** Cria cartas personalizadas para vagas específicas.
- **Múltiplos Temas:** Diversos layouts (Moderno, Clássico, Criativo, ATS-Friendly, etc.).
- **Privacidade Total:** Seus dados são salvos apenas no navegador (LocalStorage). Nada vai para servidores externos (exceto o texto enviado para a IA processar).
- **Exportação:** PDF (via impressão do navegador) e TXT.
- **Modo Escuro:** Suporte a Dark Mode.

## 🛠️ Tecnologias

- **Frontend:** React, TypeScript, Vite
- **Estilização:** Tailwind CSS, Lucide React (Ícones)
- **IA:** Google Gemini API (`@google/genai`)
- **Utilitários:** `date-fns` (Datas)

## 🚀 Como fazer Deploy (Netlify)

A maneira mais fácil de publicar este projeto é usando o **Netlify**.

1. Faça um **Fork** ou clone este repositório para o seu GitHub.
2. Acesse [Netlify](https://www.netlify.com/) e faça login.
3. Clique em **"Add new site"** > **"Import from an existing project"**.
4. Selecione **GitHub** e escolha o repositório do `trampo-lin`.
5. As configurações de build devem ser preenchidas automaticamente:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. **IMPORTANTE:** Clique em **"Site settings"** > **"Environment variables"** e adicione:
   - Key: `API_KEY`
   - Value: `Sua_Chave_Google_Gemini`
   - [Obter chave gratuita aqui](https://aistudio.google.com/app/apikey)
7. Clique em **Deploy site**.

## 💻 Como rodar localmente

Se quiser editar o código na sua máquina:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USUARIO/trampo-lin.git
   cd trampo-lin
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure a API Key:**
   - Crie um arquivo `.env` na raiz do projeto.
   - Adicione sua chave:
     ```env
     API_KEY=Sua_Chave_Gemini_Aqui
     ```

4. **Rode o projeto:**
   ```bash
   npm run dev
   ```

## 📄 Licença

Este projeto é de uso livre para fins pessoais e educacionais.