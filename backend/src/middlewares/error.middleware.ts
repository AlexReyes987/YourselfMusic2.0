import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error Handler]:', err);

  const status = err.status || (typeof err.statusCode === 'number' ? err.statusCode : 500);
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    success: false,
    message,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
