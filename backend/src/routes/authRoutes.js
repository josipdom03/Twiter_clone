import express from 'express';
import { register, login, verifyEmail } from '../controllers/authController.js'; 
import { validateRegister } from '../middleware/validateRegister.js';
import passport from 'passport'; 
import '../passport.js'; 
import jwt from 'jsonwebtoken';


const router = express.Router();

router.use((req, res, next) => {
  console.log("Auth Router zaprimio zahtjev:", req.method, req.url);
  next();
});

router.post('/register', validateRegister, register);

router.get('/verify-email', verifyEmail); 

router.post('/login', login);

// Ruta koja šalje korisnika na Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback ruta nakon što se korisnik prijavi na Google
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generiraj JWT token za tvoj frontend
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Pošalji token nazad na frontend putem URL parametra (najjednostavnija metoda)
    // Frontend će ga pročitati, spremiti u localStorage i preusmjeriti na home
    res.redirect(`http://localhost:5173/login-success?token=${token}`);
  }
);


export default router;