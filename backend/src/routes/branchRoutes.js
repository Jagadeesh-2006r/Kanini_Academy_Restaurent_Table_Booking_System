import { Router } from 'express';
import {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  toggleBranchStatus,
} from '../controllers/branchController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = Router();

// Public / Guest endpoints (enriched if authenticated admin)
router.get('/', optionalAuth, getAllBranches);
router.get('/:id', optionalAuth, getBranchById);

// Admin-only endpoints
router.post('/', authenticateToken, requireRole('ADMIN'), createBranch);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateBranch);
router.patch('/:id/deactivate', authenticateToken, requireRole('ADMIN'), toggleBranchStatus);

export default router;

