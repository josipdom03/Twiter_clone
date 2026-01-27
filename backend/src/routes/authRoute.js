import express from 'express';
import { register } from '../controller/authController.js';

const router = express.Router();

// Ruta: POST /api/auth/register
router.post('/register', validateRegister, register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
export default router;