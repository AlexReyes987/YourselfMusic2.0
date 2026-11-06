import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prioriza .env.local sobre .env tanto desde la raíz del workspace como en la carpeta local
dotenv.config({
  path: [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env.local'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env.local'),
    path.resolve(__dirname, '../../../.env'),
  ],
});

function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  if (url.includes('supabase.com/dashboard/project/')) {
    const parts = url.split('/project/');
    const projectRef = parts[1]?.replace(/\/.*$/, '').trim();
    if (projectRef) {
      return `https://${projectRef}.supabase.co`;
    }
  }
  return url;
}

const rawSupabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://cfktwdarosdodquclcyi.supabase.co';

const rawSupabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  '';

const rawSupabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  rawSupabaseAnonKey;

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || 'postgres',
    NAME: process.env.DB_NAME || 'yourself_music',
  },
  SUPABASE: {
    URL: normalizeSupabaseUrl(rawSupabaseUrl),
    ANON_KEY: rawSupabaseAnonKey,
    SERVICE_ROLE_KEY: rawSupabaseServiceRoleKey,
  },
  MERCADOPAGO: {
    // Public Key (usada en el cliente para tokenizar tarjetas con MercadoPago.js v2)
    PUBLIC_KEY:
      process.env.MERCADOPAGO_PUBLIC_KEY ||
      process.env.VITE_MERCADOPAGO_PUBLIC_KEY ||
      '',
    // Access Token (usado ESTRICTAMENTE en el servidor para crear cobros y consultar pagos)
    ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    // Clave secreta del Webhook de Mercado Pago para verificar firma criptográfica x-signature
    WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  },
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.SMTP_FROM || 'YourSelf Music <yourself@gmail.com>',
  },
  JWT: {
    SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_yourself_music_2026',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  },
  CORS: {
    CLIENT_WEB_URL: process.env.CLIENT_WEB_URL || 'http://localhost:5173',
    ADMIN_APP_URL: process.env.ADMIN_APP_URL || 'http://localhost:5174',
  },
};
