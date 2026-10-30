import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { DatabaseService } from '../services/databaseService.js';

export const reservationRouter = Router();

/**
 * GET /api/reservaciones/disponibilidad
 * Consulta horarios_disponibles y reservaciones para retornar los rangos de horas libres por fecha y sala.
 * (Acceso público para consultar disponibilidad en la web).
 */
reservationRouter.get('/disponibilidad', ReservationController.getDisponibilidad);
reservationRouter.get('/availability', ReservationController.getDisponibilidad); // Alias

/**
 * GET /api/reservaciones/my-reservations
 * Obtiene las reservaciones del cliente autenticado.
 */
reservationRouter.get('/my-reservations', authenticate, async (req, res, next) => {
  try {
    const usuarioId = parseInt(req.user!.id, 10);
    const reservaciones = await DatabaseService.getReservacionesPorUsuario(usuarioId);
    res.status(200).json({
      success: true,
      count: reservaciones.length,
      data: reservaciones,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/reservaciones
 * Validación estricta en servidor: Requiere cuenta real autenticada (token Bearer).
 * Valida solapamiento y registra la cita vinculada al usuario real y su pago en Supabase.
 */
reservationRouter.post('/', authenticate, ReservationController.create);
