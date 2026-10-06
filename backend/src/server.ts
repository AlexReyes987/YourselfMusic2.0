import { app } from './app.js';
import { ENV } from './config/env.js';
import { pool } from './config/database.js';

const server = app.listen(ENV.PORT, async () => {
  console.log(`[YourSelf Music API] Servidor corriendo en puerto ${ENV.PORT} (${ENV.NODE_ENV})`);
  console.log(`[YourSelf Music API] Health check en: http://localhost:${ENV.PORT}/api/v1/health`);

  try {
    const client = await pool.connect();
    console.log('[PostgreSQL] Conexión a la base de datos establecida con éxito');
    client.release();
  } catch (err: any) {
    console.warn('[PostgreSQL] Advertencia: No se pudo conectar a PostgreSQL en el inicio:', err.message);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor HTTP de forma ordenada...');
  server.close(async () => {
    await pool.end();
    console.log('Pool de base de datos cerrado.');
    process.exit(0);
  });
});

