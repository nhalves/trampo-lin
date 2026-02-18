
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

        // Fetches up to 30 recent repos to filter forks locally
        const response = await fetch(`https://api.github.com/users/${cleanUser}/repos?sort=updated&per_page=30&type=owner`);
        
        if (!response.ok) {
            console.error("GitHub API Error:", response.statusText);
            return null;
        }

        const data = await response.json();
        
        // Filter out forks and archived repos, then slice to top 10
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
export const extractDominantColor = (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(''); return; }

            // Increased sample size from 1x1 to 10x10 for better average
            const size = 10;
            canvas.width = size;
            canvas.height = size;
            
            // Draw the image resized to 10x10
            ctx.drawImage(img, 0, 0, size, size);
            
            try {
                const data = ctx.getImageData(0, 0, size, size).data;
                let r = 0, g = 0, b = 0;
                const totalPixels = size * size;

                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i+1];
                    b += data[i+2];
                }

                r = Math.floor(r / totalPixels);
                g = Math.floor(g / totalPixels);
                b = Math.floor(b / totalPixels);

                // Convert to Hex
                const hex = "#" + ("000000" + ((r << 16) | (g << 8) | b).toString(16)).slice(-6);
                resolve(hex);
            } catch (e) {
                resolve('');
            }
        };
        
        img.onerror = () => resolve('');
    });
};
