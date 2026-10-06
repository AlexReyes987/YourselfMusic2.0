import { pool } from '../config/database.js';
import { Payment } from '../types/index.js';

export class PaymentModel {
  static async create(data: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const result = await pool.query(
      `INSERT INTO payments (reservation_id, payment_method, transaction_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.reservation_id, data.payment_method, data.transaction_id, data.status]
    );
    return result.rows[0];
  }

  static async findByReservationId(reservationId: string): Promise<Payment | null> {
    const result = await pool.query('SELECT * FROM payments WHERE reservation_id = $1', [reservationId]);
    return result.rows[0] || null;
  }

  static async updateStatus(id: string, status: Payment['status']): Promise<Payment | null> {
    const result = await pool.query(
      `UPDATE payments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }
}

