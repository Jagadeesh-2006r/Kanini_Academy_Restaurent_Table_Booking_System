import { Router } from 'express';
import {
  getUserNotifications,
  markNotificationRead,
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserNotifications);
router.patch('/:id/read', markNotificationRead);

export default router;
