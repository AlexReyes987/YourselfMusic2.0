import { pool } from '../config/database.js';
import { Reservation } from '../types/index.js';

export class ReservationModel {
  /**
   * Verifica si existe alguna reservación activa que se solape con el intervalo indicado.
   * Regla crítica: Ninguna reservación puede compartir room_id, date y solaparse en horario.
   */
  static async checkOverlap(
    roomId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = `
      SELECT COUNT(*) AS count
      FROM reservations
      WHERE room_id = $1
        AND date = $2
        AND status != 'cancelled'
        AND NOT (end_time <= $3 OR start_time >= $4)
    `;
    const params: any[] = [roomId, date, startTime, endTime];

    if (excludeId) {
      query += ` AND id != $5`;
      params.push(excludeId);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10) > 0;
  }

  static async findByDate(date: string): Promise<Reservation[]> {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name, u.phone as user_phone, rm.name as room_name
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.date = $1
       ORDER BY r.start_time ASC`,
      [date]
    );
    return result.rows;
  }

  static async findByUserId(userId: string): Promise<Reservation[]> {
    const result = await pool.query(
      `SELECT r.*, rm.name as room_name, rm.hourly_rate
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.user_id = $1
       ORDER BY r.date DESC, r.start_time DESC`,
      [userId]
    );
    return result.rows;
  }

  static async create(data: Omit<Reservation, 'id' | 'created_at'>): Promise<Reservation> {
    const result = await pool.query(
      `INSERT INTO reservations (user_id, room_id, date, start_time, end_time, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.user_id, data.room_id, data.date, data.start_time, data.end_time, data.total_price, data.status]
    );
    return result.rows[0];
  }

  static async updateStatus(id: string, status: Reservation['status']): Promise<Reservation | null> {
    const result = await pool.query(
      `UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<Reservation | null> {
    const result = await pool.query(`SELECT * FROM reservations WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }
}

