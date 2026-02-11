import express from 'express';
import { sendMessage, getChat, getConversations,markAsRead } from '../controllers/messageController.js';
import {authMiddleware,optionalAuth} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', authMiddleware, sendMessage);
router.get('/conversations', authMiddleware, getConversations); 
router.get('/:userId', authMiddleware, getChat);
router.put('/read/:senderId', authMiddleware, markAsRead);


export default router;