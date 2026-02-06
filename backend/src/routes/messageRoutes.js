import express from 'express';
import { sendMessage, getChat } from '../controllers/messagesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // Tvoj middleware za JWT

const router = express.Router();

router.post('/', authenticateToken, sendMessage);
router.get('/:userId', authenticateToken, getChat);

export default router;