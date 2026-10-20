import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../services/databaseService.js';

export class ReservationController {
  /**
   * GET /api/reservaciones/disponibilidad
   * Consulta horarios_disponibles y reservaciones para retornar los rangos de horas libres por fecha y sala.
   * Query params:
   *  - sala_id (1..4)
   *  - fecha (YYYY-MM-DD)
   */
  static async getDisponibilidad(req: Request, res: Response, next: NextFunction) {
    try {
      const salaIdRaw = req.query.sala_id ?? req.query.room_id;
      const fechaRaw = req.query.fecha ?? req.query.date;

      if (!salaIdRaw || !fechaRaw) {
        res.status(400).json({
          success: false,
          message: 'Los parámetros query "sala_id" (1 a 4) y "fecha" (YYYY-MM-DD) son obligatorios.',
        });
        return;
      }

      const salaId = parseInt(String(salaIdRaw), 10);
      const fecha = String(fechaRaw).trim();

      if (isNaN(salaId) || salaId < 1 || salaId > 4) {
        res.status(400).json({
          success: false,
          message: 'El parámetro "sala_id" debe ser un número entero entre 1 y 4.',
        });
        return;
      }

      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha)) {
        res.status(400).json({
          success: false,
          message: 'El formato de fecha debe ser YYYY-MM-DD.',
        });
        return;
      }

      const disponibilidad = await DatabaseService.obtenerDisponibilidad(salaId, fecha);

      res.status(200).json({
        success: true,
        data: disponibilidad,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reservaciones
   * Crea una reservación con validación en servidor para evitar solapamiento de horarios
   * y registra automáticamente el pago correspondiente en la tabla 'pagos'.
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const salaId = Number(req.body.sala_id ?? req.body.room_id);
      const fecha = String(req.body.fecha_reservacion ?? req.body.date ?? '').trim();
      let horaInicio = String(req.body.hora_inicio ?? req.body.start_time ?? '').trim();
      let horaFin = String(req.body.hora_fin ?? req.body.end_time ?? '').trim();
      const usuarioId = req.user?.id ?? req.body.usuario_id ?? req.body.user_id;

      // 1. Validaciones básicas en servidor
      if (!usuarioId) {
        res.status(400).json({
          success: false,
          message: 'El identificador del usuario (usuario_id) es requerido o debe enviar token Bearer.',
        });
        return;
      }

      if (!salaId || isNaN(salaId) || salaId < 1 || salaId > 4) {
        res.status(400).json({
          success: false,
          message: 'La sala seleccionada debe ser un número entre 1 y 4.',
        });
        return;
      }

      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha)) {
        res.status(400).json({
          success: false,
          message: 'Formato de fecha_reservacion inválido. Debe ser YYYY-MM-DD.',
        });
        return;
      }

      // Normalizar formato de hora a HH:00:00
      if (/^\d{2}:00$/.test(horaInicio)) horaInicio = `${horaInicio}:00`;
      if (/^\d{2}:00$/.test(horaFin)) horaFin = `${horaFin}:00`;

      const horaRegex = /^\d{2}:00:00$/;
      if (!horaRegex.test(horaInicio) || !horaRegex.test(horaFin)) {
        res.status(400).json({
          success: false,
          message: 'Las horas deben estar en bloques cerrados (ej. 14:00:00 a 16:00:00).',
        });
        return;
      }

      const startHour = parseInt(horaInicio.split(':')[0], 10);
      const endHour = parseInt(horaFin.split(':')[0], 10);
      if (endHour <= startHour) {
        res.status(400).json({
          success: false,
          message: 'La hora de fin debe ser posterior a la hora de inicio.',
        });
        return;
      }

      // 2. Extraer datos del pago (soporta tanto objeto anidado 'pago' como campos planos)
      const pagoBody = req.body.pago || (req.body.metodo_pago ? {
        metodo_pago: req.body.metodo_pago,
        monto: req.body.monto,
        concepto_pago: req.body.concepto_pago,
        transaccion_id: req.body.transaccion_id,
      } : undefined);

      const montoTotal = req.body.monto_total ?? req.body.total_price;

      // 3. Crear reservación y registrar pago con validación estricta de solapamiento
      const resultado = await DatabaseService.crearReservacionConPago({
        usuario_id: String(usuarioId),
        sala_id: salaId,
        fecha_reservacion: fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        monto_total: montoTotal ? Number(montoTotal) : undefined,
        estado_reservacion: req.body.estado_reservacion,
        pago: pagoBody,
      });

      res.status(201).json({
        success: true,
        message: 'Reservación y registro de pago procesados exitosamente.',
        data: resultado,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }
}
