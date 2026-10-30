import { api } from './api';
import { User } from '../types';

export interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  /**
   * Registra un nuevo usuario en la base de datos de Supabase (tabla usuarios).
   * Valida nombre, email, teléfono (10 dígitos) y contraseña con hash BCrypt.
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  /**
   * Inicia sesión con correo electrónico y contraseña.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  /**
   * Obtiene los datos del perfil del usuario autenticado.
   */
  async getProfile(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
};

