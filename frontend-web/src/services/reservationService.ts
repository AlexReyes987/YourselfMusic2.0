import { api } from './api';
import { Reservacion, DisponibilidadResponse, CreateReservationDto } from '../types';

export const reservationService = {
  /**
   * Consulta la disponibilidad en tiempo real de una sala para una fecha específica.
   * Retorna horas libres, rangos libres y citas ocupadas.
   */
  async getDisponibilidad(salaId: number, fecha: string): Promise<DisponibilidadResponse> {
    const response = await api.get(`/reservaciones/disponibilidad?sala_id=${salaId}&fecha=${fecha}`);
    return response.data.data;
  },

  /**
   * Crea una nueva reservación y registra el pago (tarjeta/transferencia)
   * con validación anti-solapamiento en servidor.
   */
  async create(data: CreateReservationDto): Promise<{ reservacion: Reservacion; pago?: any }> {
    const response = await api.post('/reservaciones', data);
    return response.data.data;
  },

  /**
   * Obtiene las reservaciones del usuario autenticado
   */
  async getMyReservations(): Promise<Reservacion[]> {
    const response = await api.get('/reservaciones/my-reservations');
    return response.data.data;
  },

  /**
   * Obtiene reservaciones por fecha
   */
  async getByDate(date: string): Promise<Reservacion[]> {
    const response = await api.get(`/reservaciones/by-date?date=${date}`);
    return response.data.data;
  },
};
