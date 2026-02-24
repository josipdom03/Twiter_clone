import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron'; // 1. Uvoz cron-a
import { Op } from 'sequelize'; // Potrebno za filtriranje tweetova

// Inicijalizacija baze
import { initializeDatabase } from './db-init.js';
// Uvoz modela i funkcije za score (Pazi na putanju do tvog kontrolera)
import { Tweet } from './models/index.js';
import { updateTweetScore } from './controllers/tweetController.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// --- SOCKET.IO KONFIGURACIJA ---
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// --- SOCKET LOGIKA ---
io.on('connection', (socket) => {
  console.log('Korisnik spojen:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Korisnik ${userId} ušao u sobu: user_${userId}`);
    }
  });

  socket.on('messages_seen', ({ senderId, receiverId }) => {
    io.to(`user_${senderId}`).emit('messages_read_update', { 
      readBy: receiverId 
    });
  });

  socket.on('disconnect', () => {
    console.log('Korisnik odspojen:', socket.id);
  });
});

// --- MIDDLEWARES ---
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- DINAMIČKI IMPORT RUTA ---
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tweetRoutes from './routes/tweetRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import followRoutes from './routes/followRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import suggestionsRoutes from './routes/suggestionsRoutes.js';

app.use('/api/follow', followRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/suggestions', suggestionsRoutes);

app.get('/', (req, res) => {
  res.send('Twitter Clone API is running...');
});

// --- 3. START SERVERA & CRON JOBS ---
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('--- Pokretanje inicijalizacije baze ---');
    
    const dbReady = await initializeDatabase(false);

    if (dbReady) {
      // --- CRON LOGIKA: Pokreće se svakih 30 minuta ---
      // Formula: '*/30 * * * *' (svaka 30. minuta)
      cron.schedule('*/30 * * * *', async () => {
        console.log('⏳ Pokrećem automatsko osvježavanje score-a za trendove...');
        try {
          // Dohvaćamo samo tweetove stvorene u zadnjih 10 dana
          // Nema smisla stalno osvježavati tweetove stare godinu dana
          const activeTweets = await Tweet.findAll({
            where: {
              createdAt: {
                [Op.gte]: new Date(new Date() - 10 * 24 * 60 * 60 * 1000)
              }
            },
            attributes: ['id']
          });

          console.log(`📊 Ažuriram score za ${activeTweets.length} aktivnih tweetova.`);
          
          // Koristimo for-of petlju (ne forEach) zbog async/await-a
          for (const tweet of activeTweets) {
            await updateTweetScore(tweet.id);
          }
          console.log('✅ Score-ovi uspješno osvježeni.');
        } catch (cronErr) {
          console.error('❌ Greška unutar Cron Job-a:', cronErr);
        }
      });

      httpServer.listen(PORT, () => {
        console.log(`🚀 Server uspješno pokrenut na portu ${PORT}`);
      });
    } else {
      console.error('🛑 Server se gasi jer baza nije spremna.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Kritična greška pri startu:', error);
    process.exit(1);
  }
};

startServer();