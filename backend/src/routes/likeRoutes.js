import express from 'express';
import {toggleCommentLike,toggleTweetLike}from '../controllers/likeController.js'
import authMiddleware from '../middleware/authMiddleware.js';


const router = express.Router();


router.post('/tweet/:id/like', authMiddleware, toggleTweetLike);


router.post('/comment/:id/like', authMiddleware, toggleCommentLike);

export default router;