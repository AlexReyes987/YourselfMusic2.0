import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ENV } from './config/env.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [ENV.CORS.CLIENT_WEB_URL, ENV.CORS.ADMIN_APP_URL, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);
app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas principales bajo /api/v1
app.use('/api/v1', apiRouter);

// Manejador global de errores
app.use(errorHandler);

