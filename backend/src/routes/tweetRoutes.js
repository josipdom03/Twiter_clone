import express from 'express';
import { createTweet, getAllTweets,getTweetById } from '../controllers/tweetController.js';
import {authMiddleware,optionalAuth} from '../middleware/authMiddleware.js';

const router = express.Router();

// Putanja: GET /api/tweets
router.get('/', optionalAuth,getAllTweets);

// Putanja: POST /api/tweets (zaštićena ruta)
router.post('/', authMiddleware, createTweet);

//Putanja:  GET /api/tweet/:id
router.get('/:id',optionalAuth, getTweetById);

export default router;