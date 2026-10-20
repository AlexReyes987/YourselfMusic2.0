import { Router } from 'express';
import { RoomController } from '../controllers/room.controller.js';

export const roomRouter = Router();

/**
 * GET /api/salas (o /api/rooms)
 * Lista las 4 salas de ensayo desde la tabla 'salas' en Supabase
 */
roomRouter.get('/', RoomController.getAll);

/**
 * GET /api/salas/:id (o /api/rooms/:id)
 * Detalle de una sala de ensayo (1..4)
 */
roomRouter.get('/:id', RoomController.getById);
