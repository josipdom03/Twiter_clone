import express from 'express';
import { getProfile, updateProfile, upload, getUserByUsername,followUser,unfollowUser } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Privatne rute (za ulogiranog korisnika)
// Putanja: GET /api/users/profile
router.get('/profile', authMiddleware, getProfile);

// Putanja: PUT /api/users/profile
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);

// 2. Javne rute (za pregled tuđih profila)
// Putanja: GET /api/users/u/:username  <-- DODAN /u/ PREFIKS
router.get('/u/:username', getUserByUsername);

//Putanja za Prati korisnika
router.post('/:id/follow', authMiddleware, followUser);
//Putanja za otpratiti korisnika 
router.delete('/:id/unfollow', authMiddleware, unfollowUser);


export default router;