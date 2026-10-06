export interface AdminRoom {
  id: number;
  name: string;
  equipment_description: string;
  hourly_rate: number;
  status: 'active' | 'maintenance';
}

export interface AdminReservation {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  room_id: number;
  room_name: string;
  date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at?: string;
}

export interface AdminPayment {
  id: string;
  reservation_id: string;
  payment_method: 'card' | 'transfer';
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

