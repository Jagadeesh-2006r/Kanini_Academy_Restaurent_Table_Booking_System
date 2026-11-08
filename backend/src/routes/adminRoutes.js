import { Router } from 'express';
import {
  getAdminReservations,
  getAdminDashboard,
  getAdminReports,
} from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/reservations', getAdminReservations);
router.get('/dashboard', getAdminDashboard);
router.get('/reports', getAdminReports);

export default router;

