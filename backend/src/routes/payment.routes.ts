import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { z } from 'zod';

export const paymentRouter = Router();

const registerPaymentSchema = z.object({
  reservation_id: z.string().uuid(),
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
