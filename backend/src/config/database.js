import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// 1. OVO MORA BITI PRVO - prije bilo kakve upotrebe process.env
const isTest = process.env.NODE_ENV === 'test';
const envPath = isTest ? '.env.test' : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envPath) });

if (isTest) {
  console.log('--- TEST MODE DETECTED ---');
  console.log('Loading from:', envPath);
  console.log('DB User:', process.env.DB_USER); 
}

const dbPassword = String(process.env.DB_PASSWORD || ''); 

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  dbPassword, 
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
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

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    if (!isTest) console.log('✅ Konekcija s MySQL bazom uspješna.');
  } catch (error) {
    console.error('❌ Greška pri spajanju:', error.message);
  }
};

export default sequelize;