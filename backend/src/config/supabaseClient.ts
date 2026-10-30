import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.js';
import { ENV } from './env.js';

const supabaseUrl = ENV.SUPABASE.URL;
const supabaseAnonKey = ENV.SUPABASE.ANON_KEY;
const supabaseServiceRoleKey = ENV.SUPABASE.SERVICE_ROLE_KEY || ENV.SUPABASE.ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase Client] Advertencia: SUPABASE_URL o SUPABASE_ANON_KEY no están definidas en las variables de entorno (.env).'
  );
} else {
  console.log(`[Supabase Client] Inicializado con endpoint: ${supabaseUrl}`);
}

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Cliente público de Supabase (con clave anónima).
 * Respeta las políticas de Row Level Security (RLS).
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Cliente administrativo de Supabase (con clave service_role o anon).
 * Utilizado por el backend para saltarse RLS en operaciones de administración,
 * validación de pagos, cancelaciones forzadas y registros de auditoría.
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Función auxiliar para obtener el cliente de Supabase adecuado según el contexto.
 */
export function getSupabaseClient(useServiceRole: boolean = false): typeof supabase {
  return useServiceRole ? supabaseAdmin : supabase;
}

export default supabase;
