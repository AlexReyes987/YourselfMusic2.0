import { Request, Response, NextFunction } from 'express';
import { ReservationService } from '../services/reservation.service.js';

export class ReservationController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        return;
      }

      const userId = req.user.id;
      const { room_id, date, start_time, end_time } = req.body;

      const reservation = await ReservationService.createReservation({
        user_id: userId,
        room_id,
        date,
        start_time,
        end_time,
      });

      res.status(201).json({ success: true, data: reservation });
    } catch (error) {
      next(error);
    }
  }

  static async getByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string;
      if (!date) {
        res.status(400).json({ success: false, message: 'El parámetro date (YYYY-MM-DD) es requerido' });
        return;
      }

      const reservations = await ReservationService.getByDate(date);
      res.json({ success: true, data: reservations });
    } catch (error) {
      next(error);
    }
  }

  static async getMyReservations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        return;
      }

      const userId = req.user.id;
      const reservations = await ReservationService.getUserReservations(userId);
      res.json({ success: true, data: reservations });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const updated = await ReservationService.updateStatus(id, status);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}
