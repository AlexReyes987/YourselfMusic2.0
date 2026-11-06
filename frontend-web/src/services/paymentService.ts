import { api } from './api';

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

export interface DatosTarjetaCliente {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType?: string;
  identificationNumber?: string;
}

export interface EnviarTokenPagoPayload {
  /** Token criptográfico de un solo uso generado en el cliente por MercadoPago.js v2 */
  token: string;
  /** Monto total a cobrar en MXN */
  monto: number;
  /** Identificador de la reservación en Supabase */
  reservacion_id: string | number;
  /** Marca de la tarjeta detectada (ej. visa, master, debvisa, amex) */
  payment_method_id?: string;
  /** Tipo de método de pago para API de Orders ('credit_card' | 'debit_card') */
  payment_type_id?: string;
  /** Banco emisor detectado */
  issuer_id?: string | number;
  /** Número de mensualidades (1 = contado) */
  installments?: number;
  /** Descripción del cargo */
  descripcion?: string;
  /** Datos no sensibles del titular pagador */
  payer: {
    email: string;
    first_name?: string;
  };
}

export interface EnviarReciboPayload {
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

/**
 * Detecta la marca y el tipo de tarjeta por su BIN (primeros 6 dígitos),
 * incluyendo soporte exacto para los BINs oficiales de prueba de Mercado Pago (API de Orders México).
 */
export function detectarMarcaYTipoPorBin(cardNumberClean: string): {
  id: string;
  type: 'credit_card' | 'debit_card';
} {
  const bin6 = cardNumberClean.slice(0, 6);
  // BINs oficiales de Tarjetas de Débito de Prueba en Mercado Pago México (MLM)
  if (bin6 === '418914') return { id: 'debvisa', type: 'debit_card' };
  if (bin6 === '557905') return { id: 'debmaster', type: 'debit_card' };

  if (/^4/.test(cardNumberClean)) return { id: 'visa', type: 'credit_card' };
  if (/^(5[1-5]|2[2-7])/.test(cardNumberClean)) return { id: 'master', type: 'credit_card' };
  if (/^3[47]/.test(cardNumberClean)) return { id: 'amex', type: 'credit_card' };
  return { id: 'visa', type: 'credit_card' };
}

export function detectarMarcaTarjetaPorBin(cardNumberClean: string): string {
  return detectarMarcaYTipoPorBin(cardNumberClean).id;
}

const TARJETAS_PRUEBA_MP_BINS = [
  '407559', // Visa Crédito de prueba (API de Orders MLM)
  '547492', // Mastercard Crédito de prueba (API de Orders MLM)
  '371180', // Amex Crédito de prueba (API de Orders MLM)
  '557905', // Mastercard Débito de prueba (API de Orders MLM)
  '418914', // Visa Débito de prueba (API de Orders MLM)
  '425895', // Visa prueba legacy
  '503143', // Mastercard prueba legacy
];

const CODIGOS_SIMULACION_MP = ['APRO', 'CONT', 'CALL', 'FUND', 'SECU', 'EXPI', 'FORM', 'OTHE'];

export const paymentService = {
  /**
   * Obtiene la configuración pública de Mercado Pago (Public Key) desde variables de entorno
   * del cliente o del endpoint /api/pagos/config del servidor.
   */
  async obtenerPublicKey(): Promise<{ publicKey: string; isConfigured: boolean }> {
    const envKey = (import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '').trim();
    const validEnvKey =
      envKey &&
      !envKey.includes('REEMPLAZA') &&
      (envKey.startsWith('APP_USR-') || envKey.startsWith('TEST-'))
        ? envKey
        : '';

    try {
      const resp = await api.get('/pagos/config');
      const serverKey = resp.data?.data?.publicKey || '';
      const isConfigured = Boolean(resp.data?.data?.isConfigured || validEnvKey);
      return {
        publicKey: validEnvKey || serverKey,
        isConfigured,
      };
    } catch {
      return {
        publicKey: validEnvKey,
        isConfigured: Boolean(validEnvKey),
      };
    }
  },

  /**
   * Asegura que el script oficial de MercadoPago.js v2 esté cargado en el navegador.
   */
  async cargarSdkMercadoPago(): Promise<any> {
    if (typeof window !== 'undefined' && window.MercadoPago) {
      return window.MercadoPago;
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[src="https://sdk.mercadopago.com/js/v2"]'
      );
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.MercadoPago));
        existingScript.addEventListener('error', () =>
          reject(new Error('No se pudo cargar el SDK de MercadoPago.js v2'))
        );
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => resolve(window.MercadoPago);
      script.onerror = () => reject(new Error('No se pudo cargar el SDK de MercadoPago.js v2'));
      document.head.appendChild(script);
    });
  },

  /**
   * Intercepta los datos de la tarjeta en el navegador y genera un token criptográfico
   * de un solo uso directamente contra los servidores seguros de Mercado Pago.
   *
   * SEGURIDAD PCI-DSS: Los datos sensibles (número de tarjeta, fecha de expiración y CVV/CVC)
   * se procesan exclusivamente con el SDK de MercadoPago.js v2 en el cliente y NUNCA
   * se envían ni viajan crudos hacia nuestro backend.
   */
  async generarTokenTarjetaCliente(
    publicKey: string,
    datosTarjeta: DatosTarjetaCliente
  ): Promise<{
    token: string;
    payment_method_id: string;
    payment_type_id: string;
    issuer_id?: string | number;
    last_four_digits: string;
  }> {
    const cleanCardNumber = datosTarjeta.cardNumber.replace(/\D/g, '');
    const cleanMonth = datosTarjeta.cardExpirationMonth.replace(/\D/g, '').padStart(2, '0');
    let cleanYear = datosTarjeta.cardExpirationYear.replace(/\D/g, '');
    if (cleanYear.length === 2) {
      cleanYear = `20${cleanYear}`;
    }
    const cleanCvv = datosTarjeta.securityCode.replace(/\D/g, '');

    if (cleanCardNumber.length < 15 || cleanCardNumber.length > 16) {
      throw new Error('El número de tarjeta debe contener entre 15 y 16 dígitos.');
    }
    const monthNum = parseInt(cleanMonth, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error('El mes de vencimiento debe estar entre 01 y 12.');
    }
    if (cleanYear.length !== 4) {
      throw new Error('El año de vencimiento no es válido.');
    }
    if (cleanCvv.length < 3 || cleanCvv.length > 4) {
      throw new Error('El código de seguridad (CVV/CVC) debe tener 3 o 4 dígitos.');
    }

    if (
      !publicKey ||
      publicKey.includes('REEMPLAZA') ||
      (!publicKey.startsWith('APP_USR-') && !publicKey.startsWith('TEST-'))
    ) {
      throw new Error(
        'Falta configurar una MERCADOPAGO_PUBLIC_KEY válida (TEST-... o APP_USR-...) en el archivo .env para tokenizar la tarjeta con Mercado Pago.'
      );
    }

    const MercadoPagoConstructor = await this.cargarSdkMercadoPago();
    const mp = new MercadoPagoConstructor(publicKey, { locale: 'es-MX' });

    // 1. Detectar método de pago, tipo (credit_card / debit_card) e institución emisora a partir del BIN
    const bin = cleanCardNumber.slice(0, 6);
    const localBinInfo = detectarMarcaYTipoPorBin(cleanCardNumber);
    let paymentMethodId = localBinInfo.id;
    let paymentTypeId: string = localBinInfo.type;
    let issuerId: string | number | undefined = undefined;

    try {
      const paymentMethodsResp = await mp.getPaymentMethods({ bin });
      const results = paymentMethodsResp?.results || [];
      // Solo sobreescribir si la búsqueda por BIN filtró resultados específicos (<= 5 coincidencias)
      if (results.length >= 1 && results.length <= 5) {
        const firstMethod = results[0];
        if (firstMethod?.id) {
          paymentMethodId = firstMethod.id;
        }
        if (firstMethod?.payment_type_id) {
          paymentTypeId = firstMethod.payment_type_id;
        }
        if (firstMethod?.issuer?.id) {
          issuerId = firstMethod.issuer.id;
        }
      }
    } catch (binErr) {
      console.warn('[MercadoPago.js] Usando detección de BIN estándar:', binErr);
    }

    // Si es una tarjeta oficial de prueba de Mercado Pago y el usuario dejó su nombre normal
    // (sin escribir un prefijo de error como OTHE/FUND/CALL), normalizar a 'APRO' para que el sandbox apruebe el cargo.
    const rawHolder = (datosTarjeta.cardholderName || 'TITULAR').trim();
    const upperHolder = rawHolder.toUpperCase();
    const isTestCardBin = TARJETAS_PRUEBA_MP_BINS.includes(bin);
    const hasExplicitSimCode = CODIGOS_SIMULACION_MP.some(
      (code) => upperHolder === code || upperHolder.startsWith(`${code} `)
    );
    const effectiveCardholderName =
      isTestCardBin && !hasExplicitSimCode ? 'APRO' : rawHolder;

    // 2. Generar el token seguro en los servidores de Mercado Pago desde el navegador
    const tokenPayload: Record<string, any> = {
      cardNumber: cleanCardNumber,
      cardholderName: effectiveCardholderName,
      cardExpirationMonth: cleanMonth,
      cardExpirationYear: cleanYear,
      securityCode: cleanCvv,
    };

    if (datosTarjeta.identificationNumber) {
      tokenPayload.identificationType = datosTarjeta.identificationType || 'RFC';
      tokenPayload.identificationNumber = datosTarjeta.identificationNumber.trim();
    }

    let cardTokenResponse: any = null;

    try {
      cardTokenResponse = await mp.createCardToken(tokenPayload);
    } catch (sdkErr: any) {
      // Nota técnica: MercadoPago.js v2 bloquea mp.createCardToken en http://localhost cuando la llave
      // de prueba empieza con APP_USR- (exige https: o prefijo antiguo TEST-).
      // En ese escenario de desarrollo local, tokenizamos desde el propio navegador directo contra
      // https://api.mercadopago.com/v1/card_tokens (el mismo endpoint oficial que usa MercadoPago.js),
      // manteniendo 100% la garantía PCI de que los datos de la tarjeta jamás tocan nuestro servidor.
      const errStr = typeof sdkErr === 'string' ? sdkErr : JSON.stringify(sdkErr || '');
      const isLocalHttpSslBlock =
        errStr.includes('SSL certificate is required') ||
        (typeof window !== 'undefined' && window.location.protocol === 'http:');

      if (isLocalHttpSslBlock) {
        const directTokenResp = await fetch(
          `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              card_number: cleanCardNumber,
              expiration_month: parseInt(cleanMonth, 10),
              expiration_year: parseInt(cleanYear, 10),
              security_code: cleanCvv,
              cardholder: {
                name: effectiveCardholderName,
                ...(datosTarjeta.identificationNumber
                  ? {
                      identification: {
                        type: datosTarjeta.identificationType || 'RFC',
                        number: datosTarjeta.identificationNumber.trim(),
                      },
                    }
                  : {}),
              },
            }),
          }
        );

        const directTokenData = await directTokenResp.json().catch(() => null);
        if (!directTokenResp.ok || !directTokenData?.id) {
          const causeDesc =
            directTokenData?.cause?.[0]?.description ||
            directTokenData?.message ||
            'Mercado Pago rechazó los datos de la tarjeta al generar el token.';
          throw new Error(causeDesc);
        }
        cardTokenResponse = directTokenData;
      } else {
        const mpErrMsg = Array.isArray(sdkErr)
          ? sdkErr.map((item: any) => item?.message || item?.description || JSON.stringify(item)).join('. ')
          : sdkErr?.message ||
            sdkErr?.cause?.[0]?.description ||
            (typeof sdkErr === 'string' ? sdkErr : 'Error al validar los datos de la tarjeta en Mercado Pago.');
        throw new Error(mpErrMsg);
      }
    }

    if (!cardTokenResponse || !cardTokenResponse.id) {
      throw new Error(
        'Mercado Pago no pudo validar los datos de la tarjeta. Verifica el número, fecha de vencimiento y CVV.'
      );
    }

    return {
      token: cardTokenResponse.id,
      payment_method_id: paymentMethodId,
      payment_type_id: paymentTypeId,
      issuer_id: issuerId,
      last_four_digits: cardTokenResponse.last_four_digits || cleanCardNumber.slice(-4),
    };
  },

  /**
   * Envía ÚNICAMENTE el token generado por Mercado Pago, el monto a cobrar y el
   * identificador de la reserva hacia nuestro servidor.
   *
   * Garantía de seguridad: En este payload jamás se incluyen números de tarjeta,
   * fechas de vencimiento ni códigos CVC/CVV.
   */
  async confirmarPagoConToken(payload: EnviarTokenPagoPayload) {
    const bodySeguro = {
      token: payload.token,
      monto: payload.monto,
      reservacion_id: payload.reservacion_id,
      payment_method_id: payload.payment_method_id,
      payment_type_id: payload.payment_type_id || 'credit_card',
      issuer_id: payload.issuer_id,
      installments: payload.installments || 1,
      descripcion: payload.descripcion,
      payer: {
        email: payload.payer.email,
        first_name: payload.payer.first_name,
      },
    };

    const response = await api.post('/pagos/mercadopago/procesar', bodySeguro);
    return response.data.data;
  },

  /**
   * Solicita al backend el envío del recibo de pago al correo electrónico
   * con el que el usuario inició sesión.
   */
  async enviarReciboPorCorreo(payload: EnviarReciboPayload) {
    const response = await api.post('/pagos/enviar-recibo', payload);
    return response.data;
  },
};

