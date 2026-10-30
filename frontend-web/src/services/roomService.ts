import { api } from './api';
import { Sala } from '../types';

export const FALLBACK_SALAS: Sala[] = [
  {
    sala_id: 1,
    nombre_sala: 'Sala 1 - Azul / Neon',
    descripcion: 'Sala equipada con iluminación temática azul y neón, batería profesional, amplificadores de guitarra y bajo, y microfonía de alta fidelidad.',
    precio_por_hora: 35,
    capacidad: 9,
    estado: 'active',
  },
  {
    sala_id: 2,
    nombre_sala: 'Sala 2 - Roja',
    descripcion: 'Sala temática roja con tratamiento acústico avanzado, monitoreo de precisión, amplificación valvular y microfonía para ensayos de alta exigencia.',
    precio_por_hora: 35,
    capacidad: 9,
    estado: 'active',
  },
  {
    sala_id: 3,
    nombre_sala: 'Sala 3 - Naranja',
    descripcion: 'Sala temática naranja con backline completo de estudio, monitoreo estéreo equilibrado y excelente resonancia para ensambles y bandas.',
    precio_por_hora: 35,
    capacidad: 9,
    estado: 'active',
  },
  {
    sala_id: 4,
    nombre_sala: 'Sala 4 - Blanca',
    descripcion: 'Sala blanca minimalista con iluminación neutra de precisión acústica, microfonía condensador y dinámicos, y monitores de referencia.',
    precio_por_hora: 35,
    capacidad: 9,
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
