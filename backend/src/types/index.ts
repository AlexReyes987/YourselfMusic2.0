export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password_hash: string;
  created_at?: Date;
}

export type RoomStatus = 'active' | 'maintenance';

export interface Room {
  id: number; // 1, 2, 3, 4
  name: string;
  equipment_description: string;
  hourly_rate: number;
  status: RoomStatus;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id: string;
  user_id: string;
  room_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:00:00
  end_time: string; // HH:00:00
  total_price: number;
  status: ReservationStatus;
  created_at?: Date;
}

export type PaymentMethod = 'card' | 'transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  reservation_id: string;
  payment_method: PaymentMethod;
  transaction_id: string;
  status: PaymentStatus;
  created_at?: Date;
}

export * from './database.js';

