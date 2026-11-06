import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';
import { MercadoPagoService } from '../services/mercadopago.service.js';

export class PaymentController {
  /**
   * GET /api/pagos/config
   * Devuelve la Public Key de Mercado Pago para inicializar MercadoPago.js v2 en el cliente.
   */
  static async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = MercadoPagoService.getPublicConfig();
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pagos/mercadopago/procesar
   * Recibe únicamente el token seguro generado en el cliente, el monto a cobrar
   * y el identificador de la reservación. Jamás recibe datos crudos de tarjeta.
   */
  static async procesarPagoMercadoPago(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioAutenticado = req.user;

      const resultado = await MercadoPagoService.procesarPagoConToken(
        {
          token: req.body.token,
          monto: Number(req.body.monto ?? req.body.transaction_amount),
          reservacion_id: req.body.reservacion_id ?? req.body.reservation_id,
          payment_method_id: req.body.payment_method_id,
          payment_type_id: req.body.payment_type_id,
          issuer_id: req.body.issuer_id,
          installments: Number(req.body.installments || 1),
          descripcion: req.body.descripcion ?? req.body.description,
          usuario_id: usuarioAutenticado?.id ?? req.body.usuario_id,
          payer: {
            email:
              req.body.payer?.email ||
              usuarioAutenticado?.email ||
              req.body.email ||
              'cliente@yourselfmusic.com',
            first_name: req.body.payer?.first_name || req.body.nombre_titular,
            last_name: req.body.payer?.last_name,
            identification: req.body.payer?.identification,
          },
        },
        req.body
      );

      res.status(200).json({
        success: true,
        message: resultado.mensaje,
        data: resultado,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({
          success: false,
          message: error.message,
          mp_status: error.mp_status,
          mp_status_detail: error.mp_status_detail,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/pagos/webhook
   * Endpoint oficial para recibir notificaciones Webhook de Mercado Pago.
   * Verifica la firma criptográfica x-signature y actualiza automáticamente
   * el estado de la reservación en Supabase cuando el pago es aprobado.
   */
  static async webhookMercadoPago(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MercadoPagoService.procesarNotificacionWebhook(
        req.headers as Record<string, string | string[] | undefined>,
        req.query as Record<string, any>,
        req.body || {}
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/pagos/enviar-recibo
   * Envía el comprobante / recibo de pago al correo electrónico con el que el usuario inició sesión.
   */
  static async enviarReciboCorreo(req: Request, res: Response, next: NextFunction) {
    try {
      const emailDestino = req.user?.email || req.body.email;
      const resultado = await MercadoPagoService.enviarReciboPorCorreo({
        email: emailDestino,
        nombre_cliente: req.body.nombre_cliente || 'Cliente YourSelf Music',
        folio: String(req.body.folio || ''),
        transaccion_id: String(req.body.transaccion_id || ''),
        nombre_sala: String(req.body.nombre_sala || 'Sala de Ensayo'),
        fecha_reservacion: String(req.body.fecha_reservacion || ''),
        horario: String(req.body.horario || ''),
        num_miembros: Number(req.body.num_miembros || 1),
        monto_total: Number(req.body.monto_total || 0),
        metodo_pago: String(req.body.metodo_pago || 'Tarjeta (Mercado Pago)'),
        ultimos_cuatro: req.body.ultimos_cuatro,
        fecha_pago: req.body.fecha_pago,
      });

      res.status(200).json({
        success: true,
        message: `El recibo de pago fue enviado exitosamente a ${emailDestino}.`,
        data: resultado,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

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
