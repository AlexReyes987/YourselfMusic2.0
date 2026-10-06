import { api } from './api';
import { Room } from '../types';

export const roomService = {
  async getAll(): Promise<Room[]> {
    const response = await api.get('/rooms');
    return response.data.data;
  },

  async getById(id: number): Promise<Room> {
    const response = await api.get(`/rooms/${id}`);
    return response.data.data;
  },
};

