import { supabaseAdmin as supabase } from '../config/supabaseClient.js';
import { User, UserRole } from '../types/index.js';

export class UserModel {
  private static mapToUser(row: any): User {
    return {
      id: String(row.usuario_id),
      name: row.nombre,
      email: row.email,
      phone: row.telefono || '',
      role: (row.role_id === 1 ? 'admin' : 'client') as UserRole,
      password_hash: row.password_hash,
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToUser(data);
  }

  static async findById(id: string | number): Promise<User | null> {
    const uid = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(uid)) return null;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario_id', uid)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToUser(data);
  }

  static async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const roleId = user.role === 'admin' ? 1 : 2;

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        role_id: roleId,
        nombre: user.name,
        email: user.email.trim().toLowerCase(),
        telefono: user.phone,
        password_hash: user.password_hash,
      } as any)
      .select('*')
      .single();

    if (error || !data) {
      console.error('[UserModel.create] Error en Supabase:', error);
      throw new Error(`Error al registrar usuario en base de datos: ${error?.message || 'Error desconocido'}`);
    }

    return this.mapToUser(data);
  }

  static async findAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('usuario_id', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToUser);
  }
}
