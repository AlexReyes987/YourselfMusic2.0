import { pool } from '../config/database.js';
import { User } from '../types/index.js';

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.name, user.email, user.phone, user.role, user.password_hash]
    );
    return result.rows[0];
  }

  static async findAll(): Promise<User[]> {
    const result = await pool.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
    return result.rows;
  }
}

