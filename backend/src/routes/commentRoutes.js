import express from 'express';
import { createComment } from '../controllers/commentController.js';
import {authMiddleware,optionalAuth} from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/comments - Kreiranje novog komentara
router.post('/', authMiddleware, createComment);

export default router;