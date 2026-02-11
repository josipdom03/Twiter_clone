import express from 'express';
import { getProfile, updateProfile, upload, getUserByUsername,getUserById } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Profil ulogiranog korisnika
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);

// 2. Javne rute (uz provjeru privatnosti unutar kontrolera)
router.get('/u/:username', authMiddleware, getUserByUsername);

router.get('/id/:id',getUserById);

export default router;