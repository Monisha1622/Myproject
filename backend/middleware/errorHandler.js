/**
 * Centralized error-handling middleware.
 * Formats errors and maps PostgreSQL error codes to meaningful HTTP responses.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle PostgreSQL specific errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          success: false,
          error: 'Duplicate Record Error',
          message: err.detail || 'A record with this unique identifier already exists.',
        });

      case '23503': // foreign_key_violation
        return res.status(400).json({
          success: false,
          error: 'Foreign Key Constraint Violation',
          message: err.detail || 'The referenced record does not exist or cannot be modified due to dependent records.',
        });

      case '23514': // check_violation
        return res.status(400).json({
          success: false,
          error: 'Check Constraint Violation',
          message: err.detail || 'Data violates business constraint rules.',
        });

      case '22P02': // invalid_text_representation (e.g. invalid integer input)
        return res.status(400).json({
          success: false,
          error: 'Invalid Data Format',
          message: 'One or more parameters have an invalid data format or type.',
        });

      default:
        break;
    }
  }

  // Handle custom status errors or default 500
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: err.name || 'ServerError',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
