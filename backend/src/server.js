import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';

import './models/index.js'; 

// Uvoz ruta
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tweetRoutes from './routes/tweetRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// --- MIDDLEWARES ---

app.use(cors({
  origin: 'http://localhost:5173', // Adresa tvog Vite frontenda
  credentials: true
}));


//Profile image

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// --- RUTE ---

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/comments',commentRoutes);
app.use('/api/likes',likeRoutes);
app.use('/api/message',messageRoutes);

app.get('/', (req, res) => {
  res.send('Twitter Clone API is running...');
});

// --- SERVER START & DB SYNC ---

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('MySQL tablice su sinkronizirane.');
    app.listen(PORT, () => {
      console.log(`Server radi na portu ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Greška pri sinkronizaciji baze:', err);
  });


