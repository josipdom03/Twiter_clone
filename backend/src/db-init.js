import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js'; 
import { seedDatabase } from './seeders/demo-data.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const initializeDatabase = async (force = false) => {
    try {
        const isDocker = process.env.DB_HOST === 'db';
        console.log(`--- Provjera baze podataka (${isDocker ? 'Docker' : 'Local'}) ---`);

        // 1. Uvozimo modele
        await import('./models/index.js');

        // 2. Čekamo konekciju (Retry logika)
        let authenticated = false;
        let attempts = 0;
        while (!authenticated && attempts < 10) {
            try {
                await sequelize.authenticate();
                authenticated = true;
            } catch (err) {
                attempts++;
                console.log(`Pokušaj ${attempts}/10: MySQL nije spreman, čekam 3s...`);
                await new Promise(res => setTimeout(res, 3000));
            }
        }

        if (!authenticated) throw new Error("MySQL server nije dostupan.");
        console.log('✅ Konekcija uspješna.');

        // 3. SINKRONIZACIJA - Ključno za ER_NO_SUCH_TABLE
        // Force briše sve, alter samo nadograđuje
        await sequelize.sync({ force: force, alter: !force });
        console.log('✅ Tablice su sinkronizirane.');

        // 4. SEEDANJE - Pokreće se samo ako tablice postoje
        await seedDatabase();

        return true;
    } catch (error) {
        console.error('❌ Greška pri inicijalizaciji baze:', error.message);
        return false;
    }
};

// Ručno pokretanje iz terminala
const isMainModule = import.meta.url === `file:///${fileURLToPath(import.meta.url).replace(/\\/g, '/')}`;
if (isMainModule) {
    initializeDatabase(true).then(success => {
        process.exit(success ? 0 : 1);
    });
}