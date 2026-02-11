import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Importi ruta
import './models/index.js'; 
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tweetRoutes from './routes/tweetRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import followRoutes from './routes/followRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// --- 1. POBOLJŠANA SOCKET.IO KONFIGURACIJA ---
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header"], // Pomaže kod nekih proxy problema
  },
  transports: ['websocket', 'polling'] // Eksplicitno navodimo protokole
});

// --- 2. SOCKET LOGIKA ---
io.on('connection', (socket) => {
  console.log('Korisnik spojen:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Korisnik ${userId} ušao u sobu: user_${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Korisnik odspojen:', socket.id);
  });
});

// --- MIDDLEWARES ---

// Postavi CORS middleware PRIJE ruta
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Prosljeđujemo io u svaki request
app.use((req, res, next) => {
  req.io = io;
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ispravljena putanja za uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Debug logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --- RUTE ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/follow',followRoutes);

app.get('/', (req, res) => {
  res.send('Twitter Clone API is running...');
});

// --- 3. START SERVERA ---
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('MySQL tablice sinkronizirane.');
    httpServer.listen(PORT, () => {
      console.log(`Server radi na portu ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Greška pri sinkronizaciji baze:', err);
  });