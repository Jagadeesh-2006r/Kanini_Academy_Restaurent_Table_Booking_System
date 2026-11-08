import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_key_restaurant_2026_xyz';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Generate a signed JWT token containing user id, email, and role
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

/**
 * Verify a JWT token and extract the payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

