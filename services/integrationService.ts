
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

        const response = await fetch(`https://api.github.com/users/${cleanUser}/repos?sort=updated&per_page=10&type=owner`);
        
        if (!response.ok) {
            console.error("GitHub API Error:", response.statusText);
            return null;
        }

        const data = await response.json();
        return data.map((repo: any) => ({
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

            canvas.width = 1;
            canvas.height = 1;
            
            // Draw the image resized to 1x1 to get average color
            ctx.drawImage(img, 0, 0, 1, 1);
            
            const p = ctx.getImageData(0, 0, 1, 1).data;
            // Convert to Hex
            const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6);
            resolve(hex);
        };
        
        img.onerror = () => resolve('');
    });
};
