import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Učitaj .env varijable
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, 
    define: {
      timestamps: true, 
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Testiranje konekcije
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Konekcija s MySQL bazom je uspješno uspostavljena.');
  } catch (error) {
    console.error(' Nije moguće povezati se s bazom podataka:', error);
  }
};

export default sequelize;