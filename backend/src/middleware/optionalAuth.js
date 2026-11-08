import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/prisma.js';

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (user && user.active) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore invalid token on optional routes
  }
  next();
};
