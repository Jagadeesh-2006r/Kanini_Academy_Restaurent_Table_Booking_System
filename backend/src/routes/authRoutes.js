import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public auth endpoints
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);

// Protected auth endpoints
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

export default router;

