import express from 'express';
import { getProfile, updateProfile } from '../controller/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

// Ruta: GET /api/users/profile
router.get('/profile', authMiddleware, getProfile);

// Ruta: PUT /api/users/profile (za ažuriranje)
router.put('/profile', authMiddleware, updateProfile);

export default router;