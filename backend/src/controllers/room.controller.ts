import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../services/databaseService.js';

export class RoomController {
  /**
   * GET /api/salas (o /api/rooms)
   * Obtiene la lista de las 4 salas de ensayo desde la tabla 'salas' en Supabase.
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const salas = await DatabaseService.getSalas();
      res.status(200).json({
        success: true,
        count: salas.length,
        data: salas,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/salas/:id (o /api/rooms/:id)
   * Obtiene el detalle de una de las 4 salas físicas por su ID.
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id) || id < 1 || id > 4) {
        res.status(400).json({
          success: false,
          message: 'El identificador de sala debe ser un número entre 1 y 4.',
        });
        return;
      }

      const sala = await DatabaseService.getSalaPorId(id);
      if (!sala) {
        res.status(404).json({
          success: false,
          message: `Sala ${id} no encontrada.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: sala,
      });
    } catch (error) {
      next(error);
    }
  }
}
