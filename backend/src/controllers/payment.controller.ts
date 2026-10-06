import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';

export class PaymentController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { reservation_id, payment_method, transaction_id } = req.body;
      const payment = await PaymentService.registerPayment({
        reservation_id,
        payment_method,
        transaction_id,
      });
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  static async approveTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const payment = await PaymentService.approveTransfer(id);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }
}
