import dotenv from 'dotenv';

dotenv.config();

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
    URL: process.env.SUPABASE_URL || '',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  JWT: {
    SECRET: process.env.JWT_SECRET || 'default_jwt_secret',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  },
  CORS: {
    CLIENT_WEB_URL: process.env.CLIENT_WEB_URL || 'http://localhost:5173',
    ADMIN_APP_URL: process.env.ADMIN_APP_URL || 'http://localhost:5174',
  },
};
