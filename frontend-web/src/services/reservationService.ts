import { api } from './api';
import { Reservation } from '../types';

export interface CreateReservationDto {
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export const reservationService = {
  async create(data: CreateReservationDto): Promise<Reservation> {
    const response = await api.post('/reservations', data);
    return response.data.data;
  },

  async getMyReservations(): Promise<Reservation[]> {
    const response = await api.get('/reservations/my-reservations');
    return response.data.data;
  },

  async getByDate(date: string): Promise<Reservation[]> {
    const response = await api.get(`/reservations/by-date?date=${date}`);
    return response.data.data;
  },
};

