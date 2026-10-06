export interface Room {
  id: number;
  name: string;
  equipment_description: string;
  hourly_rate: number;
  status: 'active' | 'maintenance';
}

export interface Reservation {
  id: string;
  user_id: string;
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  room_name?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'admin';
}

