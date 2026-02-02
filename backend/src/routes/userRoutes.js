import express from 'express';
import { getProfile, updateProfile, upload, getUserByUsername } from '../controllers/userController.js';
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


export default router;