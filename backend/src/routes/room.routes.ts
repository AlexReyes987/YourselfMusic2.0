import { Router } from 'express';
import { RoomController } from '../controllers/room.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware.js';

export const roomRouter = Router();

roomRouter.get('/', RoomController.getAll);
roomRouter.get('/:id', RoomController.getById);
roomRouter.patch('/:id', authenticate, authorizeRole('admin'), RoomController.update);
