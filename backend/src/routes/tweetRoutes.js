import express from 'express';
import { createTweet, getAllTweets,getTweetById,getTrends } from '../controllers/tweetController.js';
import {authMiddleware,optionalAuth} from '../middleware/authMiddleware.js';

const router = express.Router();

// Putanja: GET /api/tweets
router.get('/', optionalAuth,getAllTweets);

// Putanja: POST /api/tweets (zaštićena ruta)
router.post('/', authMiddleware, createTweet);

//Putanja GET /api/tweets/trends
router.get('/trends', getTrends);
//Putanja:  GET /api/tweet/:id
router.get('/:id',optionalAuth, getTweetById);



export default router;