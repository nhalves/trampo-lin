
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente locais (.env)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // No Netlify, usamos o caminho absoluto padrão, então removemos o base: './'
    define: {
      // Garante que a API_KEY seja injetada, priorizando o ambiente do sistema (Netlify) e depois o .env local
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || "")
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});
