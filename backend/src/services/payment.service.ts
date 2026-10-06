import { PaymentModel } from '../models/payment.model.js';
import { ReservationModel } from '../models/reservation.model.js';
import { PaymentMethod, PaymentStatus } from '../types/index.js';

export class PaymentService {
  static async registerPayment(data: {
    reservation_id: string;
    payment_method: PaymentMethod;
    transaction_id: string;
  }) {
    const reservation = await ReservationModel.findById(data.reservation_id);
    if (!reservation) {
      throw { status: 404, message: 'Reservación asociada no encontrada' };
    }

    // Si es con tarjeta y procesado por pasarela exitosamente, queda 'completed'
    // Si es transferencia, queda 'pending' hasta revisión de administración
    const initialStatus: PaymentStatus =
      data.payment_method === 'card' ? 'completed' : 'pending';

    const payment = await PaymentModel.create({
      reservation_id: data.reservation_id,
      payment_method: data.payment_method,
      transaction_id: data.transaction_id,
      status: initialStatus,
    });

    if (initialStatus === 'completed') {
      await ReservationModel.updateStatus(data.reservation_id, 'confirmed');
    }

    return payment;
  }

  static async approveTransfer(paymentId: string) {
    const payment = await PaymentModel.updateStatus(paymentId, 'completed');
    if (!payment) {
      throw { status: 404, message: 'Pago no encontrado' };
    }

    await ReservationModel.updateStatus(payment.reservation_id, 'confirmed');
    return payment;
  }
}

