import { createClient } from '@supabase/supabase-js';

// Si el usuario copió la URL del Dashboard (ej. https://supabase.com/dashboard/project/xyz),
// la convertimos automáticamente a la URL oficial de la API (https://xyz.supabase.co)
function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.includes('placeholder')) {
    return 'https://cfktwdarosdodquclcyi.supabase.co';
  }
  if (rawUrl.includes('supabase.com/dashboard/project/')) {
    const parts = rawUrl.split('/project/');
    const projectRef = parts[1]?.replace(/\/.*$/, '').trim();
    if (projectRef) {
      return `https://${projectRef}.supabase.co`;
    }
  }
  return rawUrl.trim();
}

function normalizeSupabaseKey(rawKey?: string): string {
  if (!rawKey || rawKey.includes('placeholder') || rawKey.startsWith('sb_publishable_')) {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNma3R3ZGFyb3Nkb2RxdWNsY3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODQzNzQsImV4cCI6MjEwNjI2MDM3NH0.1gI_M0lCIgjL6roDhO_n3yUK0phGWFQMYg0mF9ZMtYY';
  }
  return rawKey.trim();
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseKey = normalizeSupabaseKey(rawKey);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
