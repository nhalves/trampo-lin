/// <reference types="vite/client" />

// Declarações de tipos para variáveis injetadas pelo Vite via `define`
declare const process: {
    env: {
        API_KEY: string;
        NODE_ENV: string;
        [key: string]: string | undefined;
    };
    cwd(): string;
};
