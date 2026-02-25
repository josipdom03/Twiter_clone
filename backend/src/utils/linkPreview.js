import got from 'got';
import metascraperFactory from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperImage from 'metascraper-image';
import metascraperDescription from 'metascraper-description';

// Inicijalizacija scrapera s pravilima
const metascraper = metascraperFactory([
    metascraperTitle(),
    metascraperImage(),
    metascraperDescription()
]);

export const getLinkPreview = async (targetUrl) => {
    try {
        // 'got' automatski prati preusmjeravanja (npr. s http na https)
        const { body: html, url } = await got(targetUrl, {
            // Dodajemo timeout i headers da nas portali ne blokiraju odmah
            timeout: { request: 5000 },
            headers: {
                'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            }
        });

        const metadata = await metascraper({ html, url });
        return metadata; // Vraća { title, image, description }
    } catch (error) {
        console.error("Link preview error:", error.message);
        return null;
    }
};