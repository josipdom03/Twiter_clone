import express from 'express';
import { 
    followUser, 
    getFollowLists, 
    unfollowUser, 
    respondToRequest,
    getPendingRequests 
} from '../controllers/FollowController.js';
import { authMiddleware, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. STATIČNE RUTE (Uvijek idu prve!)
// Dohvaćanje liste na čekanju (za AuthStore.fetchPendingRequests)
router.get('/requests', authMiddleware, getPendingRequests);

// Odgovori na zahtjev za praćenje (accept/reject)
router.post('/respond', authMiddleware, respondToRequest);

// 2. DINAMIČNE RUTE (Rute s :id idu na kraj)
// Zaprati korisnika (ili pošalji zahtjev ako je profil privatan)
router.post('/:id', authMiddleware, followUser);

// Otprati korisnika
router.delete('/:id', authMiddleware, unfollowUser);

// Lista pratitelja
router.get('/lists/:id', optionalAuth, getFollowLists);

export default router;