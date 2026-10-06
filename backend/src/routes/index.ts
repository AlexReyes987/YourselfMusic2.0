import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { roomRouter } from './room.routes.js';
import { reservationRouter } from './reservation.routes.js';
import { paymentRouter } from './payment.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/rooms', roomRouter);
apiRouter.use('/reservations', reservationRouter);
apiRouter.use('/payments', paymentRouter);

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'YourSelf Music API',
  });
});

