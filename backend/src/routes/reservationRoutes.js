import { Router } from 'express';
import {
  createReservation,
  getMyReservations,
  getReservationById,
  modifyReservation,
  cancelReservation,
} from '../controllers/reservationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// All reservation endpoints require authentication
router.use(authenticateToken);

router.post('/', createReservation);
router.get('/my', getMyReservations);
router.get('/:id', getReservationById);
router.put('/:id', modifyReservation);
router.patch('/:id/cancel', cancelReservation);

export default router;
