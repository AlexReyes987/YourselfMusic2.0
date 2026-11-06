import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { supabaseAdmin as supabase } from '../config/supabaseClient.js';
import { DatabaseService } from './databaseService.js';

export interface ProcesarPagoMercadoPagoDto {
  token: string;
  monto: number;
  reservacion_id: number | string;
  payment_method_id?: string;
  payment_type_id?: string;
  issuer_id?: string | number;
  installments?: number;
  descripcion?: string;
  usuario_id?: number | string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

export interface EnviarReciboCorreoDto {
  email: string;
  nombre_cliente: string;
  folio: string;
  transaccion_id: string;
  nombre_sala: string;
  fecha_reservacion: string;
  horario: string;
  num_miembros: number;
  monto_total: number;
  metodo_pago: string;
  ultimos_cuatro?: string;
  fecha_pago?: string;
}

const MP_STATUS_DETAIL_MESSAGES: Record<string, string> = {
  accredited: '¡Pago acreditado y aprobado exitosamente!',
  processed: '¡Pago procesado y aprobado exitosamente!',
  pending_contingency: 'Estamos procesando el pago. En menos de 2 horas te notificaremos por correo.',
  pending_review_manual: 'Estamos revisando el pago. En menos de 2 días hábiles te informaremos el resultado.',
  cc_rejected_bad_filled_card_number: 'Revisa el número de tarjeta ingresado.',
  cc_rejected_bad_filled_date: 'Revisa la fecha de vencimiento de tu tarjeta.',
  cc_rejected_bad_filled_other: 'Revisa los datos ingresados de tu tarjeta.',
  cc_rejected_bad_filled_security_code: 'Revisa el código de seguridad (CVV/CVC) de la tarjeta.',
  cc_rejected_blacklist: 'No pudimos procesar tu pago con esta tarjeta.',
  cc_rejected_call_for_authorize: 'Debes autorizar ante tu banco el pago de este monto a Mercado Pago.',
  cc_rejected_card_disabled: 'Llama a tu banco para activar tu tarjeta o usa otro medio de pago.',
  cc_rejected_card_error: 'No pudimos procesar tu pago. Intenta nuevamente o usa otra tarjeta.',
  cc_rejected_duplicated_payment: 'Ya hiciste un pago por ese valor. Si necesitas volver a pagar usa otra tarjeta.',
  cc_rejected_high_risk: 'Tu pago fue rechazado por prevención de seguridad. Elige otro medio de pago.',
  cc_rejected_insufficient_amount: 'Tu tarjeta no tiene fondos suficientes para cubrir el monto.',
  cc_rejected_invalid_installments: 'Tu tarjeta no procesa pagos en las mensualidades seleccionadas.',
  cc_rejected_max_attempts: 'Llegaste al límite de intentos permitidos. Elige otra tarjeta.',
  cc_rejected_other_reason: 'Tu banco o emisor rechazó el cargo. Intenta con otra tarjeta.',
  // Códigos de estado de API de Orders (v1/orders)
  rejected_by_issuer: 'El banco emisor rechazó el cargo. Si estás en modo de prueba, usa una tarjeta oficial de prueba con titular APRO.',
  insufficient_amount: 'La tarjeta no cuenta con fondos suficientes para cubrir el monto.',
  invalid_security_code: 'El código de seguridad (CVV/CVC) es inválido.',
  invalid_expiration_date: 'La fecha de vencimiento de la tarjeta es inválida.',
  call_for_authorize: 'Debes autorizar el cargo ante tu banco emisor.',
  processing_error:
    'Mercado Pago no pudo procesar esta tarjeta en el entorno actual. Si estás en modo Prueba de API de Orders, utiliza una de las tarjetas oficiales de prueba (ej. Visa 4075 5957 1648 3764 o Mastercard 5474 9254 3267 0366).',
  unprocessable_content:
    'El número de tarjeta ingresado no pertenece al catálogo de pruebas de API de Orders de Mercado Pago México. Usa por ejemplo Visa 4075 5957 1648 3764 o Mastercard 5474 9254 3267 0366.',
};

export class MercadoPagoService {
  /**
   * Devuelve únicamente la llave pública para el cliente y el estado de configuración.
   * El ACCESS_TOKEN jamás sale del servidor.
   */
  static getPublicConfig() {
    const pubKey = ENV.MERCADOPAGO.PUBLIC_KEY || '';
    const accessToken = ENV.MERCADOPAGO.ACCESS_TOKEN || '';

    const hasValidPublicKey =
      Boolean(pubKey) &&
      !pubKey.includes('REEMPLAZA') &&
      (pubKey.startsWith('APP_USR-') || pubKey.startsWith('TEST-'));

    const hasValidAccessToken =
      Boolean(accessToken) &&
      !accessToken.includes('REEMPLAZA') &&
      (accessToken.startsWith('APP_USR-') || accessToken.startsWith('TEST-'));

    return {
      publicKey: hasValidPublicKey ? pubKey : '',
      isConfigured: hasValidPublicKey && hasValidAccessToken,
    };
  }

  /**
   * Procesa un cobro real con tarjeta de crédito o débito usando el token seguro
   * generado en el navegador por el SDK MercadoPago.js v2.
   *
   * Al aprobarse el pago, actualiza automáticamente la reservación a 'confirmed' en Supabase.
   */
  static async procesarPagoConToken(dto: ProcesarPagoMercadoPagoDto, rawBody?: Record<string, any>) {
    // 1. Verificación explícita de seguridad PCI: Rechazar si viajaron datos crudos de tarjeta
    if (
      rawBody &&
      (rawBody.cardNumber ||
        rawBody.card_number ||
        rawBody.securityCode ||
        rawBody.security_code ||
        rawBody.cvv ||
        rawBody.cvc ||
        rawBody.cardExpiry)
    ) {
      throw {
        status: 400,
        message:
          'Violación de seguridad bloqueada: Los datos sensibles de la tarjeta (PAN/CVV/Vencimiento) nunca deben viajar crudos al servidor. Envía únicamente el token criptográfico de Mercado Pago.',
      };
    }

    if (!dto.token || typeof dto.token !== 'string' || dto.token.trim().length < 6) {
      throw {
        status: 400,
        message: 'El token seguro de la tarjeta (generado por MercadoPago.js) es obligatorio.',
      };
    }

    if (!dto.reservacion_id) {
      throw {
        status: 400,
        message: 'El identificador de la reservación (reservacion_id) es obligatorio.',
      };
    }

    if (!dto.monto || isNaN(Number(dto.monto)) || Number(dto.monto) <= 0) {
      throw {
        status: 400,
        message: 'El monto a cobrar debe ser mayor a $0 MXN.',
      };
    }

    // 2. Consultar la reservación en Supabase para verificar su existencia
    const { data: reservacionRaw, error: resError } = await (supabase.from('reservaciones') as any)
      .select('*, salas(*), usuarios(*)')
      .eq('reservacion_id', dto.reservacion_id)
      .maybeSingle();

    const reservacionDB: any = reservacionRaw;

    if (resError || !reservacionDB) {
      throw {
        status: 404,
        message: `No se encontró la reservación #${dto.reservacion_id} en la base de datos.`,
      };
    }

    const montoCobrar = Number(reservacionDB.monto_total || dto.monto);
    const accessToken = ENV.MERCADOPAGO.ACCESS_TOKEN;

    // Validar que el administrador haya configurado su MERCADOPAGO_ACCESS_TOKEN real
    if (
      !accessToken ||
      accessToken.includes('REEMPLAZA') ||
      (!accessToken.startsWith('APP_USR-') && !accessToken.startsWith('TEST-'))
    ) {
      throw {
        status: 503,
        message:
          'Configuración pendiente: El administrador aún no ha configurado un MERCADOPAGO_ACCESS_TOKEN válido (TEST-... o APP_USR-...) en el archivo backend/.env.',
      };
    }

    // 3. Preparar datos comunes del cargo para Mercado Pago (API de Orders v1/orders con respaldo automático a v1/payments)
    const idempotencyKey = crypto.randomUUID();
    const descripcionCargo =
      dto.descripcion ||
      `YourSelf Music - ${reservacionDB.salas?.nombre_sala || `Sala ${reservacionDB.sala_id}`} (${reservacionDB.fecha_reservacion} ${String(reservacionDB.hora_inicio).slice(0, 5)}-${String(reservacionDB.hora_fin).slice(0, 5)})`;

    const payerEmail =
      dto.payer?.email || reservacionDB.usuarios?.email || 'cliente@yourselfmusic.com';
    const payerFirstName =
      dto.payer?.first_name || reservacionDB.usuarios?.nombre || 'Cliente';
    const paymentMethodId = dto.payment_method_id || 'visa';
    const paymentTypeId =
      dto.payment_type_id ||
      (paymentMethodId.startsWith('deb') ? 'debit_card' : 'credit_card');
    const installments = Number(dto.installments || 1);
    const amountFormatted = montoCobrar.toFixed(2);

    // Variables normalizadas de resultado de Mercado Pago
    let mpApproved = false;
    let mpRejected = false;
    let mpStatus = '';
    let mpStatusDetail = '';
    let mpTransactionId = '';
    let mpOrderId = '';
    let ultimosCuatro = '';
    let metodoPagoMarca = paymentMethodId;
    let fechaPago = new Date().toISOString();
    let apiUtilizada: 'orders' | 'payments' = 'orders';

    // =========================================================================
    // MOTOR PRINCIPAL: API DE ORDERS DE MERCADO PAGO (POST /v1/orders)
    // Estándar actual recomendado por Mercado Pago para Checkout API
    // =========================================================================
    const orderPayload: Record<string, any> = {
      type: 'online',
      processing_mode: 'automatic',
      total_amount: amountFormatted,
      external_reference: String(dto.reservacion_id),
      description: descripcionCargo,
      payer: {
        email: payerEmail,
        first_name: payerFirstName,
      },
      transactions: {
        payments: [
          {
            amount: amountFormatted,
            payment_method: {
              id: paymentMethodId,
              type: paymentTypeId,
              token: dto.token.trim(),
              installments,
              statement_descriptor: 'YOURSELFMUSIC',
            },
          },
        ],
      },
    };

    if (dto.payer?.identification?.number) {
      orderPayload.payer.identification = {
        type: dto.payer.identification.type || 'RFC',
        number: dto.payer.identification.number,
      };
    }

    const orderResponse = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData: any = await orderResponse.json().catch(() => ({}));
    // En respuestas 402 de API de Orders, Mercado Pago envuelve la orden dentro de orderData.data
    const orderRoot: any = orderData?.data?.id ? orderData.data : orderData;

    // Evaluar si la respuesta fue procesada por /v1/orders
    const hasOrderTransactions = Boolean(
      orderResponse.ok ||
        orderRoot?.id?.startsWith?.('ORD') ||
        orderRoot?.transactions?.payments?.length ||
        orderResponse.status === 402 ||
        orderResponse.status === 422
    );

    if (hasOrderTransactions) {
      apiUtilizada = 'orders';
      const paymentNode = orderRoot?.transactions?.payments?.[0] || {};
      mpOrderId = String(orderRoot?.id || '');
      mpTransactionId = String(paymentNode?.id || orderRoot?.id || `ORD-${Date.now()}`);
      const rawOrderStatus = String(orderRoot?.status || '').toLowerCase();
      const rawPaymentStatus = String(paymentNode?.status || '').toLowerCase();

      mpStatusDetail =
        paymentNode?.status_detail ||
        orderRoot?.status_detail ||
        orderData?.errors?.[0]?.code ||
        orderData?.errors?.[0]?.message ||
        '';

      // En API de Orders: status 'processed' y status_detail 'accredited' indican pago aprobado
      mpApproved =
        rawOrderStatus === 'processed' ||
        rawPaymentStatus === 'processed' ||
        rawPaymentStatus === 'approved' ||
        rawPaymentStatus === 'accredited' ||
        mpStatusDetail === 'accredited';

      mpRejected =
        !mpApproved &&
        (rawOrderStatus === 'failed' ||
          rawOrderStatus === 'canceled' ||
          rawOrderStatus === 'cancelled' ||
          rawPaymentStatus === 'failed' ||
          rawPaymentStatus === 'rejected' ||
          rawPaymentStatus === 'canceled' ||
          !orderResponse.ok);

      mpStatus = mpApproved ? 'approved' : mpRejected ? 'rejected' : rawOrderStatus || 'in_process';
      ultimosCuatro =
        paymentNode?.payment_method?.card?.last_four_digits ||
        paymentNode?.card?.last_four_digits ||
        '';
      metodoPagoMarca =
        paymentNode?.payment_method?.id || dto.payment_method_id || 'card';
      fechaPago =
        orderRoot?.last_updated_date ||
        orderRoot?.created_date ||
        new Date().toISOString();
    } else {
      // =========================================================================
      // MOTOR DE RESPALDO: API DE PAYMENTS (POST /v1/payments)
      // Se activa automáticamente si la cuenta fue creada con el esquema anterior
      // =========================================================================
      apiUtilizada = 'payments';
      const mpPayload: Record<string, any> = {
        token: dto.token.trim(),
        transaction_amount: montoCobrar,
        description: descripcionCargo,
        installments,
        external_reference: String(dto.reservacion_id),
        statement_descriptor: 'YOURSELFMUSIC',
        payer: {
          email: payerEmail,
          first_name: payerFirstName,
        },
        metadata: {
          reservacion_id: String(dto.reservacion_id),
          usuario_id: String(dto.usuario_id || reservacionDB.usuario_id),
          sala_id: String(reservacionDB.sala_id),
        },
      };

      if (dto.payment_method_id) {
        mpPayload.payment_method_id = dto.payment_method_id;
      }

      if (dto.issuer_id && !isNaN(Number(dto.issuer_id))) {
        mpPayload.issuer_id = Number(dto.issuer_id);
      }

      if (dto.payer?.identification?.number) {
        mpPayload.payer.identification = {
          type: dto.payer.identification.type || 'RFC',
          number: dto.payer.identification.number,
        };
      }

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(mpPayload),
      });

      const mpData: any = await mpResponse.json().catch(() => ({}));

      if (!mpResponse.ok) {
        const mpCauseMsg =
          mpData?.cause?.[0]?.description ||
          mpData?.message ||
          orderData?.errors?.[0]?.message ||
          orderData?.message ||
          'Error al procesar el pago con Mercado Pago.';
        console.error('[MercadoPagoService] Error de API Mercado Pago:', {
          ordersError: orderData,
          paymentsError: mpData,
        });

        throw {
          status: mpResponse.status >= 400 && mpResponse.status < 500 ? 400 : 502,
          message: `Mercado Pago rechazó la solicitud: ${mpCauseMsg}`,
          details: mpData,
        };
      }

      mpStatus = String(mpData.status || '');
      mpStatusDetail = String(mpData.status_detail || '');
      mpTransactionId = String(mpData.id || '');
      mpApproved = mpStatus === 'approved';
      mpRejected = mpStatus === 'rejected' || mpStatus === 'cancelled';
      ultimosCuatro = mpData.card?.last_four_digits || '';
      metodoPagoMarca = mpData.payment_method_id || dto.payment_method_id || 'card';
      fechaPago = mpData.date_approved || mpData.date_created || new Date().toISOString();
    }

    // 5. Si el pago fue RECHAZADO por el banco o por Mercado Pago
    if (mpRejected) {
      const motivoAmigable =
        MP_STATUS_DETAIL_MESSAGES[mpStatusDetail] ||
        `El pago fue rechazado (${mpStatusDetail || mpStatus}). Por favor intenta con otra tarjeta.`;

      // Cancelar la reservación temporal pendiente para liberar el horario si el pago falló
      await (supabase.from('reservaciones') as any)
        .update({ estado_reservacion: 'cancelled' })
        .eq('reservacion_id', dto.reservacion_id);

      await DatabaseService.registrarAuditoria(
        reservacionDB.usuario_id,
        `PAGO_MP_RECHAZADO (${apiUtilizada.toUpperCase()}): Reserva #${dto.reservacion_id} rechazada por Mercado Pago (ID: ${mpTransactionId}, Detalle: ${mpStatusDetail})`,
        'pagos'
      );

      throw {
        status: 402,
        message: motivoAmigable,
        mp_status: mpStatus,
        mp_status_detail: mpStatusDetail,
      };
    }

    // 6. Si el pago es APROBADO -> Actualizar automáticamente la reservación a 'confirmed'
    const nuevoEstadoReserva = mpApproved ? 'confirmed' : 'pending';

    const { data: reservacionActualizada } = await (supabase.from('reservaciones') as any)
      .update({ estado_reservacion: nuevoEstadoReserva })
      .eq('reservacion_id', dto.reservacion_id)
      .select()
      .single();

    // 7. Registrar el pago verificado en la tabla 'pagos' de Supabase
    const { data: pagoRegistrado } = await (supabase.from('pagos') as any)
      .insert({
        reservacion_id: Number(dto.reservacion_id) || dto.reservacion_id,
        monto: montoCobrar,
        concepto_pago: `${descripcionCargo} [${metodoPagoMarca.toUpperCase()} ****${ultimosCuatro || '****'}]`,
        metodo_pago: 'card',
        transaccion_id: `MP-${mpTransactionId}`,
      })
      .select()
      .single();

    // 8. Registrar en auditoría
    await DatabaseService.registrarAuditoria(
      reservacionDB.usuario_id,
      `PAGO_MP_${mpStatus.toUpperCase()} (${apiUtilizada.toUpperCase()}): Reserva #${dto.reservacion_id} actualizada automáticamente a '${nuevoEstadoReserva}'. Transacción MP: ${mpTransactionId}${mpOrderId ? ` (Order: ${mpOrderId})` : ''}, Monto: $${montoCobrar} MXN`,
      'pagos'
    );

    return {
      aprobado: mpApproved,
      api_utilizada: apiUtilizada,
      mp_order_id: mpOrderId || undefined,
      mp_payment_id: mpTransactionId,
      mp_status: mpStatus,
      mp_status_detail: mpStatusDetail,
      mensaje:
        MP_STATUS_DETAIL_MESSAGES[mpStatusDetail] ||
        (mpApproved
          ? '¡Pago aprobado exitosamente! Tu reservación ha quedado confirmada.'
          : 'Tu pago está en proceso de validación por Mercado Pago.'),
      reservacion: reservacionActualizada || {
        ...reservacionDB,
        estado_reservacion: nuevoEstadoReserva,
      },
      pago: pagoRegistrado || {
        reservacion_id: dto.reservacion_id,
        monto: montoCobrar,
        metodo_pago: 'card',
        transaccion_id: `MP-${mpTransactionId}`,
        fecha_pago: new Date().toISOString(),
      },
      recibo: {
        folio: String(dto.reservacion_id),
        transaccion_id: `MP-${mpTransactionId}`,
        mp_id: mpTransactionId,
        mp_order_id: mpOrderId || undefined,
        estado_pago: mpStatus,
        estado_reservacion: nuevoEstadoReserva,
        monto_total: montoCobrar,
        metodo_pago: `Tarjeta (${metodoPagoMarca.toUpperCase()})`,
        ultimos_cuatro: ultimosCuatro,
        fecha_pago: fechaPago,
        nombre_sala: reservacionDB.salas?.nombre_sala || `Sala ${reservacionDB.sala_id}`,
        fecha_reservacion: reservacionDB.fecha_reservacion,
        horario: `${String(reservacionDB.hora_inicio).slice(0, 5)} a ${String(reservacionDB.hora_fin).slice(0, 5)}`,
        cliente_nombre: reservacionDB.usuarios?.nombre || dto.payer?.first_name || 'Cliente',
        cliente_email: payerEmail,
      },
    };
  }

  /**
   * Verifica criptográficamente que el Webhook proviene legítimamente de Mercado Pago
   * utilizando el encabezado 'x-signature', 'x-request-id' y MERCADOPAGO_WEBHOOK_SECRET (HMAC-SHA256).
   */
  static verificarFirmaWebhook(
    headers: Record<string, string | string[] | undefined>,
    query: Record<string, any>,
    body: Record<string, any>
  ): { valid: boolean; reason?: string } {
    const secret = ENV.MERCADOPAGO.WEBHOOK_SECRET;

    // Si no se ha configurado un secret aún en desarrollo, permitir pero advertir en consola
    if (!secret || secret.trim() === '' || secret.includes('tu_webhook_secret')) {
      console.warn(
        '[MercadoPago Webhook] Advertencia: MERCADOPAGO_WEBHOOK_SECRET no está definido en .env. Se omitió validación HMAC local.'
      );
      return { valid: true, reason: 'no_secret_configured' };
    }

    const xSignature = String(headers['x-signature'] || '');
    const xRequestId = String(headers['x-request-id'] || '');

    if (!xSignature || !xRequestId) {
      return {
        valid: false,
        reason: 'Faltan encabezados de seguridad x-signature o x-request-id.',
      };
    }

    // Extraer ts y v1 del header x-signature (formato: ts=1704908010,v1=618c8534...)
    const parts = xSignature.split(',');
    let ts = '';
    let v1 = '';

    for (const part of parts) {
      const [key, value] = part.split('=').map((s) => s.trim());
      if (key === 'ts') ts = value;
      if (key === 'v1') v1 = value;
    }

    if (!ts || !v1) {
      return {
        valid: false,
        reason: 'Formato de encabezado x-signature inválido (faltan parámetros ts o v1).',
      };
    }

    const dataId = String(query?.['data.id'] || body?.data?.id || query?.id || '').toLowerCase();

    // Plantilla oficial del manifiesto de Mercado Pago:
    // id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const hmacCalculado = crypto
      .createHmac('sha256', secret.trim())
      .update(manifest)
      .digest('hex');

    try {
      const bufCalculado = Buffer.from(hmacCalculado, 'hex');
      const bufRecibido = Buffer.from(v1, 'hex');

      if (bufCalculado.length !== bufRecibido.length) {
        return { valid: false, reason: 'Longitud de firma HMAC no coincide.' };
      }

      const coincide = crypto.timingSafeEqual(bufCalculado, bufRecibido);
      return coincide
        ? { valid: true }
        : { valid: false, reason: 'La firma HMAC-SHA256 no coincide con el payload recibido.' };
    } catch {
      return { valid: false, reason: 'Error verificando firma criptográfica.' };
    }
  }

  /**
   * Procesa las notificaciones Webhook de Mercado Pago y actualiza automáticamente
   * el estado de la reservación en Supabase sin intervención humana.
   */
  static async procesarNotificacionWebhook(
    headers: Record<string, string | string[] | undefined>,
    query: Record<string, any>,
    body: Record<string, any>
  ) {
    const rawType = String(body?.type || query?.type || query?.topic || '').toLowerCase();
    const rawAction = String(body?.action || '').toLowerCase();
    const resourceId = body?.data?.id || query?.['data.id'] || query?.id;

    // 1. Verificar autenticidad de la firma criptográfica x-signature (HMAC-SHA256)
    const verificacion = this.verificarFirmaWebhook(headers, query, body);
    const isSimulatedTestPing =
      String(resourceId) === '123456' ||
      body?.live_mode === false ||
      String(resourceId || '').startsWith('ORDTST');

    if (!verificacion.valid && !isSimulatedTestPing) {
      console.error('[MercadoPago Webhook] Firma inválida rechazada:', verificacion.reason);
      throw {
        status: 401,
        message: `Firma de seguridad de Webhook inválida: ${verificacion.reason}`,
      };
    }

    if (String(resourceId) === '123456') {
      return {
        processed: true,
        simulated: true,
        message: 'Notificación de prueba de Mercado Pago recibida y verificada correctamente (200 OK).',
      };
    }

    const isOrderEvent =
      rawType === 'order' ||
      rawAction.startsWith('order.') ||
      String(resourceId || '').startsWith('ORD');
    const isPaymentEvent =
      rawType === 'payment' ||
      rawAction.startsWith('payment.');

    // Si no es un evento de order ni de payment o no trae ID, responder 200 OK para acusar recibo
    if ((!isOrderEvent && !isPaymentEvent) || !resourceId) {
      return {
        processed: false,
        message: 'Evento recibido (no requiere actualización de orden/pago).',
      };
    }

    const accessToken = ENV.MERCADOPAGO.ACCESS_TOKEN;
    if (!accessToken || accessToken.includes('REEMPLAZA')) {
      return {
        processed: false,
        message: 'MERCADOPAGO_ACCESS_TOKEN no configurado para consultar la orden/pago.',
      };
    }

    let reservacionId: string | number | undefined;
    let mpStatus = '';
    let mpTransactionId = '';
    let montoCobrado = 0;
    let descripcionPago = '';
    let usuarioIdMeta: string | number = 1;

    // 2A. Si la notificación proviene de la API de Orders (v1/orders)
    if (isOrderEvent) {
      const orderResp = await fetch(`https://api.mercadopago.com/v1/orders/${resourceId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!orderResp.ok) {
        console.warn(`[MercadoPago Webhook] No se pudo consultar la orden ${resourceId} en Mercado Pago.`);
        return {
          processed: false,
          message: `Orden ${resourceId} no encontrada en API de Orders de Mercado Pago.`,
        };
      }

      const mpOrder: any = await orderResp.json();
      const firstPayment = mpOrder?.transactions?.payments?.[0] || {};
      const orderStatus = String(mpOrder?.status || '').toLowerCase();
      const paymentStatus = String(firstPayment?.status || '').toLowerCase();

      reservacionId = mpOrder?.external_reference;
      mpTransactionId = `MP-${firstPayment?.id || mpOrder?.id}`;
      montoCobrado = Number(mpOrder?.total_amount || firstPayment?.amount || 0);
      descripcionPago = mpOrder?.description || `Pago aprobado vía Webhook API de Orders (${mpTransactionId})`;

      if (
        orderStatus === 'processed' ||
        paymentStatus === 'processed' ||
        paymentStatus === 'approved' ||
        paymentStatus === 'accredited'
      ) {
        mpStatus = 'approved';
      } else if (
        orderStatus === 'failed' ||
        orderStatus === 'canceled' ||
        orderStatus === 'cancelled' ||
        paymentStatus === 'failed' ||
        paymentStatus === 'rejected'
      ) {
        mpStatus = 'rejected';
      } else if (orderStatus === 'refunded' || paymentStatus === 'refunded') {
        mpStatus = 'refunded';
      } else {
        mpStatus = orderStatus || 'pending';
      }
    } else {
      // 2B. Si la notificación proviene de la API de Payments (v1/payments)
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!mpResponse.ok) {
        console.warn(`[MercadoPago Webhook] No se pudo consultar el pago ${resourceId} en Mercado Pago.`);
        return {
          processed: false,
          message: `Pago ${resourceId} no encontrado en API de Mercado Pago.`,
        };
      }

      const mpPayment: any = await mpResponse.json();
      reservacionId = mpPayment.external_reference || mpPayment.metadata?.reservacion_id;
      mpStatus = String(mpPayment.status || '');
      mpTransactionId = `MP-${mpPayment.id}`;
      montoCobrado = Number(mpPayment.transaction_amount || 0);
      descripcionPago = mpPayment.description || `Pago aprobado vía Webhook Mercado Pago (${mpTransactionId})`;
      usuarioIdMeta = mpPayment.metadata?.usuario_id || 1;
    }

    if (!reservacionId) {
      return {
        processed: false,
        message: 'La notificación de Mercado Pago no contiene external_reference (reservacion_id).',
      };
    }

    // 3. Si el pago/orden está APROBADO ('approved' / 'processed'), confirmar automáticamente la reservación en Supabase
    if (mpStatus === 'approved') {
      await (supabase.from('reservaciones') as any)
        .update({ estado_reservacion: 'confirmed' })
        .eq('reservacion_id', reservacionId);

      // Verificar si ya existe registro en la tabla 'pagos'
      const { data: pagoExistente } = await (supabase.from('pagos') as any)
        .select('pago_id')
        .eq('reservacion_id', reservacionId)
        .maybeSingle();

      if (!pagoExistente) {
        await (supabase.from('pagos') as any).insert({
          reservacion_id: Number(reservacionId) || reservacionId,
          monto: montoCobrado,
          concepto_pago: descripcionPago,
          metodo_pago: 'card',
          transaccion_id: mpTransactionId,
        });
      }

      await DatabaseService.registrarAuditoria(
        usuarioIdMeta,
        `WEBHOOK_MP_APROBADO: Reservación #${reservacionId} actualizada automáticamente a 'confirmed' tras confirmación de Mercado Pago (${mpTransactionId})`,
        'reservaciones'
      );

      return {
        processed: true,
        reservacion_id: reservacionId,
        nuevo_estado: 'confirmed',
        mp_status: mpStatus,
      };
    }

    // 4. Si el pago/orden fue rechazado, cancelado o reembolsado
    if (mpStatus === 'rejected' || mpStatus === 'cancelled' || mpStatus === 'refunded') {
      await (supabase.from('reservaciones') as any)
        .update({ estado_reservacion: 'cancelled' })
        .eq('reservacion_id', reservacionId)
        .eq('estado_reservacion', 'pending');

      await DatabaseService.registrarAuditoria(
        usuarioIdMeta,
        `WEBHOOK_MP_${mpStatus.toUpperCase()}: Reservación #${reservacionId} marcada como 'cancelled' (${mpTransactionId})`,
        'reservaciones'
      );

      return {
        processed: true,
        reservacion_id: reservacionId,
        nuevo_estado: 'cancelled',
        mp_status: mpStatus,
      };
    }

    return {
      processed: true,
      reservacion_id: reservacionId,
      mp_status: mpStatus,
    };
  }

  /**
   * Envía el recibo de pago oficial al correo electrónico con el que el cliente inició sesión.
   */
  static async enviarReciboPorCorreo(dto: EnviarReciboCorreoDto) {
    if (!dto.email || !dto.email.includes('@')) {
      throw { status: 400, message: 'Se requiere un correo electrónico válido para enviar el recibo.' };
    }

    const htmlRecibo = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #121318; color: #f4f4f5; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 800;">YourSelf Music</h1>
          <p style="margin: 4px 0 0; font-size: 13px; color: #ffedd5;">Recibo Oficial de Pago y Confirmación de Sala</p>
        </div>

        <div style="padding: 28px;">
          <div style="background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 24px;">
            <strong style="color: #34d399; font-size: 15px;">✓ PAGO APROBADO Y RESERVACIÓN CONFIRMADA</strong>
          </div>

          <p style="font-size: 14px; color: #d4d4d8; margin-bottom: 20px;">
            Hola <strong style="color: #ffffff;">${dto.nombre_cliente}</strong>, adjuntamos los detalles de tu comprobante de pago procesado de forma segura a través de Mercado Pago:
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background-color: #18181b; border-radius: 12px; overflow: hidden;">
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 12px 16px; color: #a1a1aa;">Folio de Reservación:</td>
              <td style="padding: 12px 16px; text-align: right; color: #fb923c; font-weight: 700; font-family: monospace;">#${dto.folio}</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 12px 16px; color: #a1a1aa;">ID Transacción Mercado Pago:</td>
              <td style="padding: 12px 16px; text-align: right; color: #e4e4e7; font-family: monospace;">${dto.transaccion_id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 12px 16px; color: #a1a1aa;">Sala de Ensayo:</td>
              <td style="padding: 12px 16px; text-align: right; color: #ffffff; font-weight: 600;">${dto.nombre_sala}</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 12px 16px; color: #a1a1aa;">Fecha y Horario:</td>
              <td style="padding: 12px 16px; text-align: right; color: #ffffff;">${dto.fecha_reservacion} (${dto.horario})</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 12px 16px; color: #a1a1aa;">Integrantes Registrados:</td>
              <td style="padding: 12px 16px; text-align: right; color: #ffffff;">${dto.num_miembros} ${dto.num_miembros === 1 ? 'músico' : 'músicos'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 12px 16px; color: #a1a1aa;">Método de Pago:</td>
              <td style="padding: 12px 16px; text-align: right; color: #ffffff;">${dto.metodo_pago} ${dto.ultimos_cuatro ? `(•••• ${dto.ultimos_cuatro})` : ''}</td>
            </tr>
            <tr style="border-bottom: 1px solid #27272a;">
              <td style="padding: 12px 16px; color: #a1a1aa;">Estado de la Reserva:</td>
              <td style="padding: 12px 16px; text-align: right; color: #34d399; font-weight: 700;">CONFIRMADA</td>
            </tr>
            <tr>
              <td style="padding: 16px; color: #ffffff; font-weight: 700; font-size: 16px;">Total Pagado:</td>
              <td style="padding: 16px; text-align: right; color: #34d399; font-weight: 800; font-size: 18px;">$${dto.monto_total} MXN</td>
            </tr>
          </table>

          <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px;">
            YourSelf Music Estudio • Durango, Dgo., México<br/>
            Presenta este comprobante o tu número de folio al llegar a recepción.
          </p>
        </div>
      </div>
    `;

    try {
      let transporter: any;
      let isEthereal = false;

      if (ENV.SMTP.USER && ENV.SMTP.PASS && ENV.SMTP.PASS.trim() !== '' && !ENV.SMTP.PASS.includes('tu_contrasena')) {
        transporter = nodemailer.createTransport({
          host: ENV.SMTP.HOST,
          port: ENV.SMTP.PORT,
          secure: ENV.SMTP.PORT === 465,
          auth: {
            user: ENV.SMTP.USER,
            pass: ENV.SMTP.PASS,
          },
        });
      } else {
        // Cuenta de prueba automática Ethereal si el admin aún no configura SMTP_PASS
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        isEthereal = true;
      }

      const info = await transporter.sendMail({
        from: ENV.SMTP.FROM || '"YourSelf Music" <yourself@gmail.com>',
        to: dto.email,
        subject: `Recibo de Pago #${dto.folio} - YourSelf Music (${dto.nombre_sala})`,
        html: htmlRecibo,
      });

      const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;
      if (previewUrl) {
        console.log(`[Email Recibo] Vista previa del correo enviado a ${dto.email}: ${previewUrl}`);
      }

      return {
        enviado: true,
        email: dto.email,
        messageId: info.messageId,
        previewUrl: previewUrl || undefined,
      };
    } catch (err: any) {
      console.error('[MercadoPagoService.enviarReciboPorCorreo] Error enviando correo:', err.message);
      throw {
        status: 500,
        message: `No se pudo enviar el recibo por correo: ${err.message}`,
      };
    }
  }
}
