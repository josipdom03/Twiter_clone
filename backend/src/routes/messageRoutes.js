import express from 'express';
import { sendMessage, getChat, getConversations } from '../controllers/messageController.js';
import {authMiddleware,optionalAuth} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', authMiddleware, sendMessage);
router.get('/conversations', authMiddleware, getConversations); 
router.get('/:userId', authMiddleware, getChat);

export default router;