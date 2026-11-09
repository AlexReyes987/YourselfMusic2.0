import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { reservationService, MULTA_CANCELACION_MXN } from '../services/reservationService';
import {
  paymentService,
  detectarMarcaTarjetaPorBin,
} from '../services/paymentService';
import { useAuth } from '../context/AuthContext';

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const bookingData = location.state as
    | {
        salaId: number;
        nombreSala: string;
        descripcion: string;
        precioPorHora: number;
        capacidad: number;
        fecha: string;
        horaInicio: string;
        horaFin: string;
        startHour: number;
        duration: number;
        numMiembros?: number;
        totalPrice: number;
      }
    | undefined;

  useEffect(() => {
    if (!isAuthenticated) {
      if (bookingData) {
        try {
          sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        } catch {}
      }
      navigate('/login', {
        state: {
          from: '/payment',
          bookingData,
          message: 'Inicia sesión o crea tu cuenta para continuar con tu reservación.',
        },
        replace: true,
      });
    }
  }, [isAuthenticated, bookingData, navigate]);

  const [nombre, setNombre] = useState(user?.name || user?.nombre || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telefono, setTelefono] = useState(user?.phone || user?.telefono || '');

  useEffect(() => {
    if (user) {
      if (!nombre) setNombre(user.name || user.nombre || '');
      if (!email) setEmail(user.email || '');
      if (!telefono) setTelefono(user.phone || user.telefono || '');
    }
  }, [user]);

  const [mpPublicKey, setMpPublicKey] = useState<string>(
    import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || ''
  );
  const [mpSdkReady, setMpSdkReady] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function initMercadoPago() {
      try {
        await paymentService.cargarSdkMercadoPago();
        const cfg = await paymentService.obtenerPublicKey();
        if (mounted) {
          if (cfg.publicKey) {
            setMpPublicKey(cfg.publicKey);
          }
          setMpSdkReady(true);
        }
      } catch (err) {
        console.warn('[PaymentPage] Error cargando SDK de Mercado Pago:', err);
      }
    }
    initMercadoPago();
    return () => {
      mounted = false;
    };
  }, []);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [adeudoActivo, setAdeudoActivo] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    async function checkAdeudo() {
      if (!isAuthenticated) return;
      try {
        const data = await reservationService.getMiAdeudo();
        if (mounted && data?.total_adeudo > 0) {
          setAdeudoActivo(data.total_adeudo);
        }
      } catch {}
    }
    checkAdeudo();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const [cardholderName, setCardholderName] = useState(user?.name || user?.nombre || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [transferRef, setTransferRef] = useState('');

  if (!bookingData) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <p className="text-zinc-400">No hay información de reservación activa.</p>
        <button
          onClick={() => navigate('/booking')}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-semibold text-sm transition-colors"
        >
          Seleccionar sala
        </button>
      </div>
    );
  }

  const numPersonas =
    bookingData.numMiembros && bookingData.numMiembros > 0 ? bookingData.numMiembros : 1;

  const cleanCardDigits = cardNumber.replace(/\D/g, '');
  const detectedBrand =
    cleanCardDigits.length >= 1 ? detectarMarcaTarjetaPorBin(cleanCardDigits) : '';

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleCardCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(raw);
  };

  const enviarTokenPagoAlServidor = async (params: {
    token: string;
    monto: number;
    reservacionId: string | number;
    paymentMethodId: string;
    paymentTypeId?: string;
    issuerId?: string | number;
    descripcion: string;
  }) => {
    return await paymentService.confirmarPagoConToken({
      token: params.token,
      monto: params.monto,
      reservacion_id: params.reservacionId,
      payment_method_id: params.paymentMethodId,
      payment_type_id: params.paymentTypeId || 'credit_card',
      issuer_id: params.issuerId,
      installments: 1,
      descripcion: params.descripcion,
      payer: {
        email: (user?.email || email).trim(),
        first_name: (cardholderName || nombre).trim(),
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const usuarioId = user?.id || user?.usuario_id;
    if (!usuarioId) {
      setErrorMessage('Debes iniciar sesión para confirmar tu reservación.');
      return;
    }

    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\D/g, '');
      if (cleanNum.length < 15 || cleanNum.length > 16) {
        setErrorMessage('Ingresa un número de tarjeta válido (15 o 16 dígitos).');
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 4) {
        setErrorMessage('Ingresa una fecha de vencimiento válida (MM/AA).');
        return;
      }
      if (cardCvc.replace(/\D/g, '').length < 3) {
        setErrorMessage('Ingresa el código de seguridad (CVV/CVC) de tu tarjeta.');
        return;
      }
    } else {
      if (!transferRef.trim()) {
        setErrorMessage('Ingresa el número o clave de rastreo SPEI para registrar tu pago.');
        return;
      }
    }

    setShowPolicyModal(true);
  };

  const ejecutarPagoConfirmado = async () => {
    setShowPolicyModal(false);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const usuarioId = user?.id || user?.usuario_id;
      if (!usuarioId) {
        setErrorMessage('Debes iniciar sesión para confirmar tu reservación.');
        setIsProcessing(false);
        return;
      }

      const conceptoReserva = `Ensayo ${bookingData.nombreSala} (${bookingData.fecha} ${bookingData.horaInicio.slice(0, 5)}-${bookingData.horaFin.slice(0, 5)}) - ${numPersonas} integrantes`;

      if (paymentMethod === 'card') {
        const expiryParts = cardExpiry.split('/');
        const expMonth = expiryParts[0] || '';
        const expYear = expiryParts[1] || '';

        setProcessingStep('Verificando datos de pago...');
        const tokenData = await paymentService.generarTokenTarjetaCliente(mpPublicKey, {
          cardNumber,
          cardholderName: cardholderName || nombre,
          cardExpirationMonth: expMonth,
          cardExpirationYear: expYear,
          securityCode: cardCvc,
        });

        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');

        setProcessingStep('Registrando reservación...');
        const resCreated = await reservationService.create({
          usuario_id: usuarioId,
          cliente_nombre: nombre,
          cliente_email: user?.email || email,
          cliente_telefono: telefono,
          sala_id: bookingData.salaId,
          fecha_reservacion: bookingData.fecha,
          hora_inicio: bookingData.horaInicio,
          hora_fin: bookingData.horaFin,
          num_personas: numPersonas,
          monto_total: bookingData.totalPrice,
          estado_reservacion: 'pending',
        } as any);

        const reservacionId = resCreated?.reservacion?.reservacion_id;
        if (!reservacionId) {
          throw new Error('No se pudo obtener el folio de la reservación.');
        }

        setProcessingStep('Procesando pago...');
        const mpResult = await enviarTokenPagoAlServidor({
          token: tokenData.token,
          monto: bookingData.totalPrice,
          reservacionId,
          paymentMethodId: tokenData.payment_method_id,
          paymentTypeId: tokenData.payment_type_id,
          issuerId: tokenData.issuer_id,
          descripcion: conceptoReserva,
        });

        try {
          sessionStorage.removeItem('pendingBooking');
        } catch {}

        navigate('/confirmation', {
          state: {
            folio: String(reservacionId),
            transaccionId: mpResult?.recibo?.transaccion_id || `MP-${mpResult?.mp_payment_id}`,
            roomName: bookingData.nombreSala,
            date: bookingData.fecha,
            hours: `${bookingData.horaInicio.slice(0, 5)} a ${bookingData.horaFin.slice(0, 5)}`,
            numMiembros: numPersonas,
            paymentMethod: 'card',
            cardBrand: tokenData.payment_method_id.toUpperCase(),
            lastFourDigits: mpResult?.recibo?.ultimos_cuatro || tokenData.last_four_digits,
            totalPrice: bookingData.totalPrice,
            status: mpResult?.recibo?.estado_reservacion || 'confirmed',
            fechaPago: mpResult?.recibo?.fecha_pago || new Date().toISOString(),
            mensajeConfirmacion:
              mpResult?.mensaje ||
              'Tu pago ha sido aprobado y tu reservación está confirmada.',
            cliente: {
              nombre,
              email: user?.email || email,
              telefono,
            },
          },
        });
        return;
      }

      setProcessingStep('Registrando reservación...');
      const transaccionId = transferRef.trim() || `SPEI-${Date.now()}`;

      const payload = {
        usuario_id: usuarioId,
        cliente_nombre: nombre,
        cliente_email: user?.email || email,
        cliente_telefono: telefono,
        sala_id: bookingData.salaId,
        fecha_reservacion: bookingData.fecha,
        hora_inicio: bookingData.horaInicio,
        hora_fin: bookingData.horaFin,
        num_personas: numPersonas,
        monto_total: bookingData.totalPrice,
        pago: {
          metodo_pago: 'transfer' as const,
          monto: bookingData.totalPrice,
          concepto_pago: conceptoReserva,
          transaccion_id: transaccionId,
        },
      };

      const response = await reservationService.create(payload as any);
      const folio = String(
        response?.reservacion?.reservacion_id || `YM-${Date.now().toString().slice(-6)}`
      );
      const statusReservacion = response?.reservacion?.estado_reservacion || 'pending';

      try {
        sessionStorage.removeItem('pendingBooking');
      } catch {}

      navigate('/confirmation', {
        state: {
          folio,
          transaccionId,
          roomName: bookingData.nombreSala,
          date: bookingData.fecha,
          hours: `${bookingData.horaInicio.slice(0, 5)} a ${bookingData.horaFin.slice(0, 5)}`,
          numMiembros: numPersonas,
          paymentMethod: 'transfer',
          totalPrice: bookingData.totalPrice,
          status: statusReservacion,
          fechaPago: new Date().toISOString(),
          mensajeConfirmacion:
            'Tu reservación ha sido registrada y tu comprobante está en revisión.',
          cliente: {
            nombre,
            email: user?.email || email,
            telefono,
          },
        },
      });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErrorMessage(
          err.response.data?.message ||
            'Debes iniciar sesión para confirmar tu reservación.'
        );
        navigate('/login', {
          state: {
            from: '/payment',
            bookingData,
            message: 'Tu sesión ha expirado. Inicia sesión nuevamente para continuar.',
          },
        });
        return;
      }

      if (err.response?.status === 409) {
        setErrorMessage(
          err.response.data?.message ||
            'El horario seleccionado acaba de ser reservado. Por favor elige otro horario.'
        );
        return;
      }

      const apiMsg =
        err.response?.data?.message ||
        (Array.isArray(err)
          ? err.map((item: any) => item?.message || item?.description || JSON.stringify(item)).join('. ')
          : undefined) ||
        err.message ||
        (typeof err === 'string' ? err : undefined) ||
        'No fue posible procesar el pago. Verifica los datos de tu tarjeta e inténtalo de nuevo.';
      setErrorMessage(apiMsg);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        ← Volver a la selección de sala
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Confirmar y pagar
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Revisa los detalles de tu ensayo y completa tu pago para confirmar la reservación.
        </p>
      </div>

      {/* Resumen de la cita */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-white">{bookingData.nombreSala}</h2>
            <span className="text-xs text-zinc-300 bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
              {numPersonas} {numPersonas === 1 ? 'músico' : 'músicos'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span>Fecha: {bookingData.fecha}</span>
            <span>•</span>
            <span>
              Horario: {bookingData.horaInicio.slice(0, 5)} - {bookingData.horaFin.slice(0, 5)} (
              {bookingData.duration} {bookingData.duration === 1 ? 'hora' : 'horas'})
            </span>
            <span>•</span>
            <span className="text-zinc-500">
              {numPersonas} pers. × $35 MXN × {bookingData.duration} h
            </span>
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
          <span className="text-xs text-zinc-400 block">Total a pagar</span>
          <span className="text-2xl font-black text-white">${bookingData.totalPrice} MXN</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm space-y-1">
          <p className="font-bold">No fue posible procesar el pago</p>
          <p className="text-xs text-rose-300/90">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sección 1: Datos de Contacto del Cliente */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white">1. Datos de contacto</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                Nombre completo o nombre de la banda
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Carlos Mendoza"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                Teléfono de contacto (10 dígitos)
              </label>
              <input
                type="tel"
                required
                placeholder="618 123 4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Selección del Método de Pago */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl space-y-5">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white">2. Método de pago</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                paymentMethod === 'card'
                  ? 'border-orange-500 bg-orange-500/10 text-white ring-1 ring-orange-500'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <p className="text-sm font-bold text-white">
                Tarjeta de crédito o débito
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Confirmación inmediata al procesar tu pago.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                paymentMethod === 'transfer'
                  ? 'border-orange-500 bg-orange-500/10 text-white ring-1 ring-orange-500'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <p className="text-sm font-bold text-white">Transferencia bancaria SPEI</p>
              <p className="text-xs text-zinc-400 mt-1">
                Sujeta a validación del comprobante de transferencia.
              </p>
            </button>
          </div>

          {/* Formulario de Tarjeta */}
          {paymentMethod === 'card' ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Nombre del titular (como aparece en la tarjeta)
                </label>
                <input
                  type="text"
                  required
                  placeholder="EJ. CARLOS MENDOZA"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white uppercase focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Número de tarjeta</label>
                  {detectedBrand && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {detectedBrand}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">
                    Fecha de vencimiento (MM/AA)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    required
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={handleCardExpiryChange}
                    className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">
                    Código de seguridad (CVV)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    required
                    placeholder="123"
                    maxLength={4}
                    value={cardCvc}
                    onChange={handleCardCvcChange}
                    className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Formulario de Transferencia SPEI */
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Banco:</span>
                  <span className="font-bold text-white">BBVA México</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">CLABE interbancaria:</span>
                  <span className="font-mono font-bold text-orange-400">012 180 015482930412 8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Beneficiario:</span>
                  <span className="text-white">YourSelf Music</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Monto a transferir:</span>
                  <span className="font-bold text-emerald-400">${bookingData.totalPrice} MXN</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Clave de rastreo o número de referencia SPEI
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ingresa la clave de rastreo de tu transferencia"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                />
                <span className="text-[11px] text-zinc-500 block">
                  Tu reservación quedará confirmada una vez validada la transferencia.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nota discreta sobre política de cancelación */}
        <div className="text-xs text-zinc-400 leading-relaxed px-1">
          <strong className="text-zinc-300">Política de cancelación:</strong> Las cancelaciones realizadas el mismo día del ensayo o un día antes tienen un cargo de ${MULTA_CANCELACION_MXN}.00 MXN en total por la banda. Cancelar con 2 o más días de anticipación no genera ningún costo.
        </div>

        {adeudoActivo > 0 && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="text-rose-300">
              <p className="font-bold text-white">Tienes un saldo pendiente por cancelación: ${adeudoActivo} MXN</p>
              <p className="text-rose-200/80 mt-0.5">
                Es necesario liquidar el saldo pendiente en tu cuenta antes de registrar una nueva reservación.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/my-reservations')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shrink-0 cursor-pointer transition-colors"
            >
              Ver mis reservaciones
            </button>
          </div>
        )}

        {/* Botón de Confirmación y Procesamiento */}
        <button
          type="submit"
          disabled={isProcessing || (paymentMethod === 'card' && !mpSdkReady)}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition-all text-base cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{processingStep || 'Procesando pago...'}</span>
            </>
          ) : (
            <span>Pagar ${bookingData.totalPrice} MXN</span>
          )}
        </button>
      </form>

      {/* Modal de Confirmación de Política de Cancelación */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Política de cancelación
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Revisa las condiciones antes de confirmar tu pago
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-zinc-300">
              <p className="leading-relaxed">
                Estás por confirmar tu reservación para la <strong className="text-white">{bookingData.nombreSala}</strong> el día{' '}
                <strong className="text-white">{bookingData.fecha}</strong> de {bookingData.horaInicio.slice(0, 5)} a {bookingData.horaFin.slice(0, 5)} hrs.
              </p>

              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <p>
                  En caso de cancelar la reservación <strong className="text-white">el mismo día del ensayo o un día antes</strong> (por ejemplo, si el ensayo es el miércoles y se cancela el martes o el miércoles), se aplicará un cargo por cancelación de <strong className="text-orange-400">${MULTA_CANCELACION_MXN}.00 MXN en total por toda la banda</strong>.
                </p>
                <p className="text-zinc-400">
                  Este cargo se descuenta del monto pagado y se reembolsa la diferencia (${Math.max(0, bookingData.totalPrice - MULTA_CANCELACION_MXN)} MXN). Si cancelas con 2 o más días de anticipación, la cancelación no tiene ningún costo.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={ejecutarPagoConfirmado}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Aceptar y pagar ${bookingData.totalPrice} MXN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
