import express from 'express';
import { register, login, verifyEmail } from '../controllers/authController.js'; 
import { validateRegister } from '../middleware/validateRegister.js';

const router = express.Router();

router.post('/register', validateRegister, register);

router.get('/verify-email', verifyEmail); 

router.post('/login', login);

export default router;