import express from 'express';
import { getSuggestions,getMentionSuggestions } from '../controllers/suggestionsController.js';
import {authMiddleware} from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/comments - Kreiranje novog komentara
router.get('/', authMiddleware, getSuggestions);


// GET /api/comments/mentions?search= - Dohvaćanje prijedloga za spominjanje korisnika
router.get('/mentions', authMiddleware, getMentionSuggestions);



export default router;