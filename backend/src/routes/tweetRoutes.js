import express from 'express';
import { createTweet, getAllTweets, getTweetById, getTrends, deleteTweet,getFollowingTweets ,retweetTweet,upload} from '../controllers/tweetController.js';
import { authMiddleware, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Putanja: GET /api/tweets (sada s paginacijom)
router.get('/', optionalAuth, getAllTweets);

// Putanja: GET /api/tweets/following (samo za autentificirane korisnike)
router.get('/following', authMiddleware, getFollowingTweets);

// Putanja: POST /api/tweets (zaštićena ruta)
router.post('/', authMiddleware, upload.array('images', 4), createTweet);

// Putanja: GET /api/tweets/trends
router.get('/trends', getTrends);

// Putanja: GET /api/tweets/:id
router.get('/:id', optionalAuth, getTweetById);

router.post('/:id/retweet', authMiddleware, retweetTweet);

// Putanja: DELETE /api/tweets/:id (ako ti treba)
router.delete('/:id', authMiddleware, deleteTweet);

export default router;
