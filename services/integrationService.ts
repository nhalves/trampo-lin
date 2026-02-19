
// Service for External Integrations (GitHub, LinkedIn Scraper mock, etc)

export interface GithubRepo {
    name: string;
    description: string;
    html_url: string;
    language: string;
    stargazers_count: number;
    updated_at: string;
}

export const fetchGithubRepos = async (username: string): Promise<GithubRepo[] | null> => {
    try {
        // Remove @ if present
        const cleanUser = username.replace('@', '').trim();
        if (!cleanUser) return null;

        // Fetch more to compensate for filtering out forks/archived
        const response = await fetch(`https://api.github.com/users/${cleanUser}/repos?sort=updated&per_page=30&type=owner`);

        if (!response.ok) {
            // #11 — Diferenciar 404 (usuário não encontrado) de 403/429 (rate limit)
            if (response.status === 404) {
                throw new Error(`Usuário "${cleanUser}" não encontrado no GitHub.`);
            }
            if (response.status === 403 || response.status === 429) {
                throw new Error('Limite de requisições da API do GitHub atingido. Aguarde alguns minutos e tente novamente.');
            }
            throw new Error(`Erro da API do GitHub (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        return data
            .filter((repo: any) => !repo.fork && !repo.archived)
            .slice(0, 10)
            .map((repo: any) => ({
                name: repo.name,
                description: repo.description,
                html_url: repo.html_url,
                language: repo.language,
                stargazers_count: repo.stargazers_count,
                updated_at: repo.updated_at
            }));
    } catch (error) {
        console.error("Fetch Github Error", error);
        return null;
    }
};

// Helper to extract dominant color from an image URL (Base64)
// Samples a 10x10 grid and returns the median channel values for accuracy
export const extractDominantColor = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            const SAMPLE_SIZE = 10;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(''); return; }

            canvas.width = SAMPLE_SIZE;
            canvas.height = SAMPLE_SIZE;

            // Draw image scaled to 10x10 to sample a grid of pixels
            ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

            const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
            const reds: number[] = [], greens: number[] = [], blues: number[] = [];

            for (let i = 0; i < imageData.length; i += 4) {
                // Skip near-white and near-black pixels (likely background/shadow)
                const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
                const brightness = (r + g + b) / 3;
                if (brightness > 240 || brightness < 15) continue;
                reds.push(r); greens.push(g); blues.push(b);
            }

            if (reds.length === 0) { resolve(''); return; }

            // Use median for robustness against outliers
            const median = (arr: number[]) => {
                const sorted = [...arr].sort((a, b) => a - b);
                return sorted[Math.floor(sorted.length / 2)];
            };

            const r = median(reds), g = median(greens), b = median(blues);
            const hex = "#" + ("000000" + ((r << 16) | (g << 8) | b).toString(16)).slice(-6);
            resolve(hex);
        };

        img.onerror = () => resolve('');
    });
};
