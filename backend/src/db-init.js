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

        // 1. Čekamo konekciju (Retry logika ostaje ista)
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

        // 2. ISKLJUČI PROVJERU STRANIH KLJUČEVA
        // Ovo je nužno da MySQL ne prigovara dok Sequelize kreira kružne veze (poput parentId)
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('⏳ Privremeno onemogućena provjera stranih ključeva...');

        // 3. DINAMIČKI IMPORT MODELA
        // Jako bitno: uvozimo models/index.js kako bi se izvršile sve asocijacije (hasMany, belongsTo)
        await import('./models/index.js');
        console.log('📦 Modeli i asocijacije učitani.');

        // 4. SINKRONIZACIJA - POPRAVLJENO
        // NEMOJ pozivati User.sync() ili Tweet.sync() zasebno!
        // sequelize.sync() će sam odrediti najbolji redoslijed za cijelu bazu.
        await sequelize.sync({ force: force, alter: !force });
        
        // 5. VRATI PROVJERU STRANIH KLJUČEVA
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Tablice su uspješno sinkronizirane.');

        // 6. SEEDANJE
        try {
            await seedDatabase();
            console.log('✅ Seedanje završeno.');
        } catch (seedError) {
            console.warn('⚠️ Seedanje preskočeno ili podaci već postoje.');
        }

        return true;
    } catch (error) {
        // Uvijek pokušaj vratiti ključeve na 1, čak i ako padne
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
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