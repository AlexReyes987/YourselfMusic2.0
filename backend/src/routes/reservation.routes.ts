import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { z } from 'zod';

export const reservationRouter = Router();

const createReservationSchema = z.object({
  room_id: z.number().int().min(1).max(4),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:00:00$/, 'Formato de hora inválido (debe ser hora en punto, ej. 14:00:00)'),
  end_time: z.string().regex(/^\d{2}:00:00$/, 'Formato de hora inválido (debe ser hora en punto, ej. 16:00:00)'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});

reservationRouter.post(
  '/',
  authenticate,
  validateBody(createReservationSchema),
  ReservationController.create
);

reservationRouter.get(
  '/my-reservations',
  authenticate,
  ReservationController.getMyReservations
);

reservationRouter.get(
  '/by-date',
  authenticate,
  ReservationController.getByDate
);

reservationRouter.patch(
  '/:id/status',
  authenticate,
  authorizeRole('admin'),
  validateBody(updateStatusSchema),
  ReservationController.updateStatus
);
