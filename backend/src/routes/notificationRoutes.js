import express from 'express';
import { getNotifications, markAllAsRead, markAsRead} from '../controllers/notificationController.js';
import {authMiddleware,optionalAuth} from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/',authMiddleware,getNotifications);
router.patch('/read-all',authMiddleware,markAllAsRead);
router.post('/:id/read',authMiddleware,markAsRead);


export default router;