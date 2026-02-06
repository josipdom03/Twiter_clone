import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';

// --- NOVI IMPORTI ZA SOCKET.IO ---
import { createServer } from 'http';
import { Server } from 'socket.io';

import './models/index.js'; 

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

// --- 1. KREIRANJE HTTP SERVERA I SOCKET.IO INSTANCE ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// --- 2. SOCKET LOGIKA ---
io.on('connection', (socket) => {
  console.log('Korisnik spojen na socket:', socket.id);

  // Soba za svakog korisnika (npr. user_5)
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Korisnik ${userId} se pridružio svojoj sobi.`);
  });

  socket.on('disconnect', () => {
    console.log('Korisnik se odspojio.');
  });
});

// --- MIDDLEWARES ---

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Prosljeđujemo io u svaki request kako bi kontroleri mogli emitirati evente
app.use((req, res, next) => {
  req.io = io;
  next();
});

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
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/message', messageRoutes);

app.get('/', (req, res) => {
  res.send('Twitter Clone API is running...');
});

// --- 3. START SERVERA (KORISTIMO httpServer) ---

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('MySQL tablice su sinkronizirane.');
    // VAŽNO: httpServer.listen umjesto app.listen
    httpServer.listen(PORT, () => {
      console.log(`Server radi na portu ${PORT} s WebSocket podrškom`);
    });
  })
  .catch(err => {
    console.error('Greška pri sinkronizaciji baze:', err);
  });