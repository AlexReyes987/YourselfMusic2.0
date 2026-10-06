import { ReservationModel } from '../models/reservation.model.js';
import { RoomModel } from '../models/room.model.js';
import { calculateHours, isValidHourlyBlock } from '../utils/date-helpers.js';

export class ReservationService {
  static async createReservation(data: {
    user_id: string;
    room_id: number;
    date: string;
    start_time: string;
    end_time: string;
  }) {
    // 1. Validar sala física (1-4)
    if (data.room_id < 1 || data.room_id > 4) {
      throw { status: 400, message: 'La sala debe ser entre 1 y 4' };
    }

    const room = await RoomModel.findById(data.room_id);
    if (!room || room.status !== 'active') {
      throw { status: 400, message: 'La sala seleccionada no está disponible' };
    }

    // 2. Validar que los bloques sean horas completas
    if (!isValidHourlyBlock(data.start_time, data.end_time)) {
      throw { status: 400, message: 'Las reservaciones deben ser en bloques de horas cerradas' };
    }

    // 3. Regla crítica de negocio: Validar solapamiento
    const hasOverlap = await ReservationModel.checkOverlap(
      data.room_id,
      data.date,
      data.start_time,
      data.end_time
    );

    if (hasOverlap) {
      throw {
        status: 409,
        message: 'Conflicto: Ya existe una reservación para la sala y horario seleccionados',
      };
    }

    // 4. Calcular precio total
    const hours = calculateHours(data.start_time, data.end_time);
    const total_price = hours * Number(room.hourly_rate);

    return ReservationModel.create({
      user_id: data.user_id,
      room_id: data.room_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      total_price,
      status: 'pending',
    });
  }

  static async getByDate(date: string) {
    return ReservationModel.findByDate(date);
  }

  static async getUserReservations(userId: string) {
    return ReservationModel.findByUserId(userId);
  }

  static async updateStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled') {
    const reservation = await ReservationModel.findById(id);
    if (!reservation) {
      throw { status: 404, message: 'Reservación no encontrada' };
    }
    return ReservationModel.updateStatus(id, status);
  }
}

