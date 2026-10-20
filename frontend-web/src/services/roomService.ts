import { api } from './api';
import { Sala } from '../types';

export const FALLBACK_SALAS: Sala[] = [
  {
    sala_id: 1,
    nombre_sala: 'Sala 1 - Master Stage',
    descripcion: 'Batería Pearl Masters, Amplificadores Marshall JCM800 y Fender Twin Reverb, PA Yamaha 2000W.',
    precio_por_hora: 250,
    capacidad: 8,
    estado: 'active',
  },
  {
    sala_id: 2,
    nombre_sala: 'Sala 2 - Rocker Studio',
    descripcion: 'Batería Tama Superstar, Amplis Vox AC30 y Ampeg Bass, Microfonía Shure SM58.',
    precio_por_hora: 200,
    capacidad: 6,
    estado: 'active',
  },
  {
    sala_id: 3,
    nombre_sala: 'Sala 3 - Acoustic & Jazz',
    descripcion: 'Piano acústico vertical Yamaha, Batería Gretsch Catalina Jazz, Monitoreo de precisión.',
    precio_por_hora: 220,
    capacidad: 5,
    estado: 'active',
  },
  {
    sala_id: 4,
    nombre_sala: 'Sala 4 - Indie Rehearsal',
    descripcion: 'Batería Mapex, Amplis Orange y Fender Rumble Bass, ideal para ensambles compactos.',
    precio_por_hora: 180,
    capacidad: 4,
    estado: 'active',
  },
];

export const roomService = {
  /**
   * Obtiene el catálogo de las 4 salas desde el backend/Supabase (/api/salas)
   */
  async getAll(): Promise<Sala[]> {
    try {
      const response = await api.get('/salas');
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data;
      }
      return FALLBACK_SALAS;
    } catch (error) {
      console.warn('[roomService.getAll] No se pudo conectar al endpoint /api/salas, usando catálogo local:', error);
      return FALLBACK_SALAS;
    }
  },

  /**
   * Obtiene el detalle de una sala por ID (/api/salas/:id)
   */
  async getById(id: number): Promise<Sala> {
    try {
      const response = await api.get(`/salas/${id}`);
      return response.data.data;
    } catch {
      const found = FALLBACK_SALAS.find((s) => s.sala_id === id);
      if (found) return found;
      throw new Error(`Sala ${id} no encontrada`);
    }
  },
};
