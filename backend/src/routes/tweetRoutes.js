import express from 'express';
import { createTweet, getAllTweets,getTweetById } from '../controllers/tweetController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Putanja: GET /api/tweets
router.get('/', getAllTweets);

// Putanja: POST /api/tweets (zaštićena ruta)
router.post('/', authMiddleware, createTweet);

//Putanja:  GET /api/tweet/:id
router.get('/:id', getTweetById);

export default router;