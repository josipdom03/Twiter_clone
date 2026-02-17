import express from 'express';
import { getSuggestions } from '../controllers/suggestionsController.js';
import {authMiddleware} from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/comments - Kreiranje novog komentara
router.get('/', authMiddleware, getSuggestions);



export default router;