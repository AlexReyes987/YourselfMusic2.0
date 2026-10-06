import { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/room.service.js';

export class RoomController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await RoomService.getAllRooms();
      res.json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const room = await RoomService.getRoomById(id);
      res.json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const updated = await RoomService.updateRoom(id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}
