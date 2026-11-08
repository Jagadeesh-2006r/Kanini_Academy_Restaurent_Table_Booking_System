import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/prisma.js';

/**
 * Middleware to authenticate JWT tokens in the Authorization header
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
        error: 'NO_TOKEN',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch user from DB to verify they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        branch: {
          select: {
            id: true,
            branchName: true,
            address: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.',
        error: 'USER_NOT_FOUND',
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
        error: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Attach sanitized user to request object (excluding password)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session invalid or expired. Please sign in again.',
        error: error.name,
      });
    }
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 * Example: requireRole('ADMIN'), requireRole('STAFF', 'ADMIN')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        error: 'UNAUTHENTICATED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This action requires one of the following roles: [${roles.join(', ')}].`,
        error: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};

