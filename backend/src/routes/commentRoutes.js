import express from 'express';
import { createComment,getCommentLikes } from '../controllers/commentController.js';
import {authMiddleware,optionalAuth} from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/comments - Kreiranje novog komentara
router.post('/', authMiddleware, createComment);

// GET /api/comments/:id/likes - Tko je lajaka komentar
router.get('/:id/likes', optionalAuth, getCommentLikes);

export default router;