import express from 'express';
import { getProfile, updateProfile, upload } from '../controller/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Dohvaćanje profila
router.get('/profile', authMiddleware, getProfile);

// Ažuriranje profila - dodan upload middleware
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);

export default router;