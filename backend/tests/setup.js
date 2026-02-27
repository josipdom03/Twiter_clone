import { sequelize } from '../src/models/index.js'; // Putanja do tvoje Sequelize instance

/**
 * beforeAll se pokreće jednom prije nego što krene bilo koji test u datoteci.
 * Ovdje uspostavljamo vezu s testnom bazom definiranom u .env.test.
 */
beforeAll(async () => {
  try {
    // Provjera konekcije
    await sequelize.authenticate();
    
    // sync({ force: true }) briše sve postojeće tablice i kreira ih ponovo.
    // Ovo osigurava da svaki put kreneš od "nule" bez starih podataka.
    await sequelize.sync({ force: true });
    
    console.log('✅ Uspješno spojen na testnu bazu: twitter_clone_test');
  } catch (error) {
    console.error('❌ Greška pri inicijalizaciji testne baze:', error);
    process.exit(1); // Prekida testove ako baza nije dostupna
  }
});

/**
 * afterAll se pokreće nakon što svi testovi u datoteci završe.
 * Ključno je zatvoriti konekciju kako Jest ne bi ostao "visiti".
 */
afterAll(async () => {
  try {
    await sequelize.close();
    // console.log('🔒 Konekcija s bazom zatvorena.');
  } catch (error) {
    console.error('❌ Greška pri zatvaranju baze:', error);
  }
});