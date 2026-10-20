import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';

export const reservationRouter = Router();

/**
 * GET /api/reservaciones/disponibilidad
 * Consulta horarios_disponibles y reservaciones para retornar los rangos de horas libres por fecha y sala.
 */
reservationRouter.get('/disponibilidad', ReservationController.getDisponibilidad);
reservationRouter.get('/availability', ReservationController.getDisponibilidad); // Alias

/**
 * POST /api/reservaciones
 * Validación en servidor para evitar solapamiento de horarios en la misma sala
 * y registro del pago correspondiente en la tabla pagos.
 */
reservationRouter.post('/', optionalAuthenticate, ReservationController.create);
