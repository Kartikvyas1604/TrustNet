import { Response } from 'express';
import { ApiResponse } from '../types';
import { ERROR_CODES } from '../config/constants';
import logger from './logger';

/**
 * Sends a successful API response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Sends an error API response
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    },
    timestamp: new Date().toISOString()
  };
  
  // Log error for monitoring
  logger.error(`API Error: ${code} - ${message}`, { details });
  
  return res.status(statusCode).json(response);
}

/**
 * Sends validation error response
 */
export function sendValidationError(
  res: Response,
  errors: any[]
): Response {
  return sendError(
    res,
    ERROR_CODES.VALIDATION_ERROR,
    'Validation failed',
    400,
    errors
  );
}

/**
 * Sends not found error response
 */
export function sendNotFound(
  res: Response,
  resource: string
): Response {
  return sendError(
    res,
    'NOT_FOUND',
    `${resource} not found`,
    404
  );
}

/**
 * Sends unauthorized error response
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized access'
): Response {
  return sendError(
    res,
    ERROR_CODES.AUTH_UNAUTHORIZED,
    message,
    401
  );
}

/**
 * Sends forbidden error response
 */
export function sendForbidden(
  res: Response,
  message: string = 'Access forbidden'
): Response {
  return sendError(
    res,
    'FORBIDDEN',
    message,
    403
  );
}

/**
 * Sends internal server error response
 */
export function sendInternalError(
  res: Response,
  error?: Error
): Response {
  // Log the full error for debugging
  if (error) {
    logger.error('Internal Server Error:', error);
  }
  
  return sendError(
    res,
    ERROR_CODES.INTERNAL_ERROR,
    'An internal server error occurred',
    500,
    process.env.NODE_ENV === 'development' ? error?.message : undefined
  );
}

/**
 * Sends rate limit exceeded error
 */
export function sendRateLimitError(
  res: Response
): Response {
  return sendError(
    res,
    ERROR_CODES.TXN_RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded. Please try again later.',
    429
  );
}

/**
 * Sends database error response
 */
export function sendDatabaseError(
  res: Response,
  error?: Error
): Response {
  if (error) {
    logger.error('Database Error:', error);
  }
  
  return sendError(
    res,
    ERROR_CODES.DATABASE_ERROR,
    'A database error occurred',
    500
  );
}

/**
 * Sends blockchain transaction error
 */
export function sendBlockchainError(
  res: Response,
  message: string,
  details?: any
): Response {
  return sendError(
    res,
    ERROR_CODES.TXN_BLOCKCHAIN_ERROR,
    message,
    500,
    details
  );
}

export default {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendInternalError,
  sendRateLimitError,
  sendDatabaseError,
  sendBlockchainError
};
