import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { z } from 'zod';

export const paymentRouter = Router();

/**
 * GET /api/pagos/config
 * Obtiene la Public Key de Mercado Pago para inicializar el SDK en el navegador.
 */
paymentRouter.get('/config', PaymentController.getConfig);

/**
 * POST /api/pagos/mercadopago/procesar
 * Procesa el pago con tarjeta de crédito/débito enviando únicamente el token seguro,
 * el monto a cobrar y el identificador de la reservación.
 */
paymentRouter.post(
  '/mercadopago/procesar',
  authenticate,
  PaymentController.procesarPagoMercadoPago
);

/**
 * POST /api/pagos/webhook
 * Recibe notificaciones en tiempo real de Mercado Pago, verifica la firma x-signature
 * y actualiza automáticamente el estado de la reservación en Supabase.
 */
paymentRouter.post('/webhook', PaymentController.webhookMercadoPago);

/**
 * POST /api/pagos/enviar-recibo
 * Envía el recibo de pago al correo electrónico con el que el cliente inició sesión.
 */
paymentRouter.post(
  '/enviar-recibo',
  authenticate,
  PaymentController.enviarReciboCorreo
);

const registerPaymentSchema = z.object({
  reservation_id: z.string().min(1),
  payment_method: z.enum(['card', 'transfer']),
  transaction_id: z.string().min(1),
});

paymentRouter.post(
  '/',
  authenticate,
  validateBody(registerPaymentSchema),
  PaymentController.register
);

paymentRouter.patch(
  '/:id/approve-transfer',
  authenticate,
  authorizeRole('admin'),
  PaymentController.approveTransfer
);
