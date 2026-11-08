/**
 * Centralized Global Error Handling Middleware
 * Ensures friendly error responses, correct HTTP status codes,
 * and protects against leaking server stack traces to users.
 */
export const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ Error on [${req.method} ${req.originalUrl}]:`, err.message || err);

  // Prisma unique constraint violation (e.g., duplicate email, duplicate reference)
  if (err.code === 'P2002') {
    const target = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists.`,
      error: 'DUPLICATE_RESOURCE',
      timestamp,
    });
  }

  // Prisma record not found error
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'The requested record could not be found.',
      error: 'NOT_FOUND',
      timestamp,
    });
  }

  // JWT authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token. Please log in again.',
      error: 'INVALID_TOKEN',
      timestamp,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.',
      error: 'TOKEN_EXPIRED',
      timestamp,
    });
  }

  // Custom status code if assigned, otherwise 500
  const statusCode = err.statusCode || res.statusCode !== 200 ? (err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500)) : 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    error: err.errorCode || 'INTERNAL_ERROR',
    timestamp,
  });
};

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route [${req.method} ${req.originalUrl}] not found.`,
    error: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
};
