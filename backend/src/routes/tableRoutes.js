import { Router } from 'express';
import {
  getTablesByBranch,
  createTable,
  updateTable,
  deleteTable,
} from '../controllers/tableController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = Router();

// Get tables for a branch
router.get('/:branchId', optionalAuth, getTablesByBranch);

// Admin-only table management
router.post('/', authenticateToken, requireRole('ADMIN'), createTable);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateTable);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteTable);

export default router;

