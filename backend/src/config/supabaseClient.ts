import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.js';
import { ENV } from './env.js';

const supabaseUrl = ENV.SUPABASE.URL;
const supabaseAnonKey = ENV.SUPABASE.ANON_KEY;
const supabaseServiceRoleKey = ENV.SUPABASE.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase Client] Advertencia: SUPABASE_URL o SUPABASE_ANON_KEY no están definidas en las variables de entorno (.env).'
  );
}

/**
 * Cliente público de Supabase (con clave anónima).
 * Respeta las políticas de Row Level Security (RLS).
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Cliente administrativo de Supabase (con clave service_role).
 * Utilizado por el backend para saltarse RLS en operaciones de administración,
 * validación de pagos, cancelaciones forzadas y registros de auditoría.
 */
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-service-role-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default supabase;

