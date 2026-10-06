import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('[DB Init] Inicializando esquema de base de datos...');
  const sqlPath = path.join(__dirname, 'init-db.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    const client = await pool.connect();
    await client.query(sql);
    console.log('[DB Init] Esquema creado y las 4 salas inicializadas con éxito.');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err: any) {
    console.error('[DB Init] Error inicializando la base de datos:', err.message);
    await pool.end();
    process.exit(1);
  }
}

initDatabase();

