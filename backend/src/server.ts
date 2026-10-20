import { app } from './app.js';
import { ENV } from './config/env.js';
import { supabase } from './config/supabaseClient.js';

const server = app.listen(ENV.PORT, async () => {
  console.log(`[YourSelf Music API] Servidor Express corriendo en puerto ${ENV.PORT} (${ENV.NODE_ENV})`);
  console.log(`[YourSelf Music API] Endpoints listos:`);
  console.log(`  - GET  http://localhost:${ENV.PORT}/api/salas`);
  console.log(`  - GET  http://localhost:${ENV.PORT}/api/reservaciones/disponibilidad`);
  console.log(`  - POST http://localhost:${ENV.PORT}/api/reservaciones`);

  // Verificación de conectividad con Supabase
  if (ENV.SUPABASE.URL && ENV.SUPABASE.ANON_KEY) {
    try {
      const { data, error } = await supabase.from('salas').select('count', { count: 'exact', head: true });
      if (error) {
        console.warn(`[Supabase] Advertencia conectando con Supabase (${ENV.SUPABASE.URL}):`, error.message);
      } else {
        console.log(`[Supabase] Conexión establecida con éxito en: ${ENV.SUPABASE.URL}`);
      }
    } catch (err: any) {
      console.warn('[Supabase] Error en handshake inicial:', err.message);
    }
  } else {
    console.log('[Supabase] Nota: SUPABASE_URL y SUPABASE_ANON_KEY están pendientes en .env');
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor HTTP de forma ordenada...');
  server.close(() => {
    console.log('Servidor HTTP cerrado.');
    process.exit(0);
  });
});
