import { pool } from '../config/database.js';
import { Room } from '../types/index.js';

export class RoomModel {
  static async findAll(): Promise<Room[]> {
    const result = await pool.query('SELECT * FROM rooms ORDER BY id ASC');
    return result.rows;
  }

  static async findById(id: number): Promise<Room | null> {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async update(id: number, data: Partial<Omit<Room, 'id'>>): Promise<Room | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.equipment_description !== undefined) {
      fields.push(`equipment_description = $${idx++}`);
      values.push(data.equipment_description);
    }
    if (data.hourly_rate !== undefined) {
      fields.push(`hourly_rate = $${idx++}`);
      values.push(data.hourly_rate);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const query = `UPDATE rooms SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
}

