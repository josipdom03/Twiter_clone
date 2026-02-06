import express from 'express';
import { sendMessage, getChat } from '../controllers/messageController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, sendMessage);
router.get('/:userId', authMiddleware, getChat);

export default router;