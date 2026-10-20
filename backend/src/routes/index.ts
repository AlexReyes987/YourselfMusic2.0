import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { roomRouter } from './room.routes.js';
import { reservationRouter } from './reservation.routes.js';
import { paymentRouter } from './payment.routes.js';

export const apiRouter = Router();

// Rutas solicitadas en español (y alias en inglés para máxima compatibilidad)
apiRouter.use('/salas', roomRouter);
apiRouter.use('/rooms', roomRouter);

apiRouter.use('/reservaciones', reservationRouter);
apiRouter.use('/reservations', reservationRouter);

apiRouter.use('/pagos', paymentRouter);
apiRouter.use('/payments', paymentRouter);

apiRouter.use('/auth', authRouter);

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'YourSelf Music API (Supabase Backend)',
  });
});
