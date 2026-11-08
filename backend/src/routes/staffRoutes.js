import { Router } from 'express';
import {
  getStaffReservations,
  createStaffUser,
  getAllStaff,
} from '../controllers/staffController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Staff role endpoints
router.get('/reservations', authenticateToken, requireRole('STAFF', 'ADMIN'), getStaffReservations);

// Admin-only staff management endpoints
router.get('/', authenticateToken, requireRole('ADMIN'), getAllStaff);
router.post('/', authenticateToken, requireRole('ADMIN'), createStaffUser);

export default router;

