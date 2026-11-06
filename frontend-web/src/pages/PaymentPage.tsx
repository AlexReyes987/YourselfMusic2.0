import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Clock,
  Volume2,
  User,
  Users,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { reservationService } from '../services/reservationService';
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

  // Si el usuario no está autenticado, redirigir a /login preservando los datos de la reserva
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
          message:
            'Para registrar tu reservación oficial en YourSelf Music, primero debes iniciar sesión o crear tu cuenta.',
        },
        replace: true,
      });
    }
  }, [isAuthenticated, bookingData, navigate]);

  // Estado del formulario del cliente (sincronizado con el usuario autenticado)
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

  // Configuración de MercadoPago.js v2
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

  // Método de pago (tarjeta vía Mercado Pago o transferencia SPEI)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Estado local de los campos de tarjeta.
   * SEGURIDAD PCI-DSS: Estos campos son interceptados en el navegador únicamente para
   * invocar `mp.createCardToken(...)` del SDK oficial MercadoPago.js v2 y obtener un
   * token criptográfico de un solo uso. NUNCA se envían crudos a nuestro backend.
   */
  const [cardholderName, setCardholderName] = useState(user?.name || user?.nombre || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Datos de transferencia bancaria
  const [transferRef, setTransferRef] = useState('');

  if (!bookingData) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <p className="text-zinc-400">No hay información de reserva activa.</p>
        <button
          onClick={() => navigate('/booking')}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-semibold text-sm transition-colors"
        >
          Ir a Selección de Sala
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

  /**
   * Función que envía ÚNICAMENTE el token generado por MercadoPago.js,
   * el monto a cobrar y el identificador de la reserva hacia nuestro servidor.
   */
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const usuarioId = user?.id || user?.usuario_id;
      if (!usuarioId) {
        setErrorMessage('Debes haber iniciado sesión para confirmar la reservación.');
        setIsProcessing(false);
        return;
      }

      const conceptoReserva = `Ensayo ${bookingData.nombreSala} (${bookingData.fecha} ${bookingData.horaInicio.slice(0, 5)}-${bookingData.horaFin.slice(0, 5)}) - ${numPersonas} integrantes`;

      // ========================================================================
      // FLUJO 1: PAGO REAL CON TARJETA DE CRÉDITO / DÉBITO (MERCADO PAGO API)
      // ========================================================================
      if (paymentMethod === 'card') {
        const expiryParts = cardExpiry.split('/');
        const expMonth = expiryParts[0] || '';
        const expYear = expiryParts[1] || '';

        // Paso 1: Interceptar datos en el navegador y generar Token Seguro con MercadoPago.js v2
        setProcessingStep('Tokenizando tarjeta de forma segura con Mercado Pago...');
        const tokenData = await paymentService.generarTokenTarjetaCliente(mpPublicKey, {
          cardNumber,
          cardholderName: cardholderName || nombre,
          cardExpirationMonth: expMonth,
          cardExpirationYear: expYear,
          securityCode: cardCvc,
        });

        // SEGURIDAD EXPLICITA: Limpiar los datos sensibles de la tarjeta en el cliente
        // antes de realizar cualquier llamada a nuestro backend.
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');

        // Paso 2: Crear la reservación en estado 'pending' en Supabase para obtener su reservacion_id
        setProcessingStep('Apartando bloque de horario en Supabase...');
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
          throw new Error('No se pudo obtener el identificador de la reservación en Supabase.');
        }

        // Paso 3: Enviar ÚNICAMENTE el token generado, el monto a cobrar y el reservacion_id al servidor
        setProcessingStep('Procesando cargo real en Mercado Pago...');
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

        // Paso 4: Redirigir a la pantalla de confirmación y recibo de pago
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
              '¡Pago aprobado por Mercado Pago! Tu reservación ha sido actualizada automáticamente a Confirmada.',
            cliente: {
              nombre,
              email: user?.email || email,
              telefono,
            },
          },
        });
        return;
      }

      // ========================================================================
      // FLUJO 2: PAGO POR TRANSFERENCIA BANCARIA SPEI
      // ========================================================================
      setProcessingStep('Registrando reservación y referencia SPEI en Supabase...');
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
            '¡Reservación registrada! Tu comprobante SPEI ha sido enviado para validación administrativa.',
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
            'Debes iniciar sesión con una cuenta registrada para confirmar tu reservación.'
        );
        navigate('/login', {
          state: {
            from: '/payment',
            bookingData,
            message:
              'Tu sesión ha expirado. Inicia sesión con tu cuenta para confirmar la cita.',
          },
        });
        return;
      }

      if (err.response?.status === 409) {
        setErrorMessage(
          err.response.data?.message ||
            'Conflicto: El horario seleccionado acaba de ser apartado por otro músico. Por favor elige otro horario.'
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
        'Ocurrió un error al procesar el pago con Mercado Pago.';
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
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Modificar sala u horario</span>
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Confirmación de Reserva y Pago Seguro
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Procesa tu pago en línea con tarjeta de crédito o débito a través de Mercado Pago Checkout API.
        </p>
      </div>

      {/* Banner de resumen de la cita */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-orange-400" />
            <h2 className="text-base font-bold text-white">{bookingData.nombreSala}</h2>
            <span className="text-xs text-orange-400 font-semibold flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
              <Users className="w-3 h-3" />
              {numPersonas} {numPersonas === 1 ? 'músico' : 'músicos'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              {bookingData.fecha}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              {bookingData.horaInicio.slice(0, 5)} - {bookingData.horaFin.slice(0, 5)} (
              {bookingData.duration} hrs)
            </span>
            <span className="text-zinc-500 font-mono text-[11px]">
              Tarifa: {numPersonas} pers. × $35 MXN × {bookingData.duration} h
            </span>
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
          <span className="text-xs text-zinc-400 block">Total a Liquidar:</span>
          <span className="text-2xl font-black text-orange-400">${bookingData.totalPrice} MXN</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">No fue posible procesar el pago</p>
            <p className="text-xs text-rose-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sección 1: Datos de Contacto del Cliente */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <User className="w-4 h-4 text-orange-400" />
              <span>1. Titular de la Reserva (Cuenta Oficial YourSelf Music)</span>
            </div>
            {user && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cliente Verificado en Supabase</span>
              </span>
            )}
          </div>

          {user && (
            <div className="p-3 bg-zinc-800/40 border border-zinc-700/60 rounded-xl text-xs text-zinc-300 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-semibold text-white">
                  Titular: <span className="text-orange-400">{user.name || user.nombre}</span> (
                  {user.email})
                </p>
                <p className="text-zinc-400 text-[11px]">
                  Al confirmarse el pago en Mercado Pago, tu reservación cambiará automáticamente a{' '}
                  <code className="text-emerald-400">confirmed</code> en Supabase.
                </p>
              </div>
              <span className="text-[10px] bg-orange-500/10 text-orange-300 font-mono px-2.5 py-1 rounded-lg border border-orange-500/20">
                Usuario #{user.id || user.usuario_id}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Nombre completo / Banda:</label>
              <input
                type="text"
                required
                placeholder="Ej. Banda Los Alacranes / Carlos Mendoza"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>Correo Electrónico (para envío de recibo):</span>
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
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span>Teléfono de Contacto (10 dígitos):</span>
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
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <CreditCard className="w-4 h-4 text-orange-400" />
              <span>2. Pasarela de Pago (Mercado Pago Checkout API / SPEI)</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              <Lock className="w-3 h-3" />
              <span>MercadoPago.js v2 Activo</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                paymentMethod === 'card'
                  ? 'border-orange-500 bg-orange-500/10 text-white ring-1 ring-orange-500 shadow-lg'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <CreditCard className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white">
                  Tarjeta de Crédito / Débito (Mercado Pago)
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cobro real tokenizado y confirmación automática inmediata en Supabase.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                paymentMethod === 'transfer'
                  ? 'border-orange-500 bg-orange-500/10 text-white ring-1 ring-orange-500 shadow-lg'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Building2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white">Transferencia Bancaria SPEI</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Registrada en Supabase (estado 'pending') hasta validación.
                </p>
              </div>
            </button>
          </div>

          {/* Formulario de Tarjeta Tokenizado con MercadoPago.js v2 */}
          {paymentMethod === 'card' ? (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/70 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-zinc-300">
                    Tarjetas Oficiales de Prueba (Mercado Pago API de Orders México):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCardholderName('APRO');
                        setCardNumber('4075 5957 1648 3764');
                        setCardExpiry('11/30');
                        setCardCvc('123');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 font-semibold transition-colors cursor-pointer"
                    >
                      Usar Visa Crédito Prueba
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCardholderName('APRO');
                        setCardNumber('5474 9254 3267 0366');
                        setCardExpiry('11/30');
                        setCardCvc('123');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-semibold transition-colors cursor-pointer"
                    >
                      Usar Mastercard Prueba
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCardholderName('APRO');
                        setCardNumber('4189 1412 2126 7633');
                        setCardExpiry('11/30');
                        setCardCvc('123');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold transition-colors cursor-pointer"
                    >
                      Usar Visa Débito Prueba
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400">
                  En modo Sandbox de <strong>API de Orders</strong>, haz clic en cualquiera de los botones de arriba (o ingresa <code className="text-zinc-300">4075 5957 1648 3764</code>, Vencimiento <code className="text-zinc-300">11/30</code>, CVV <code className="text-zinc-300">123</code>, Titular <code className="text-zinc-300">APRO</code>).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Nombre del Titular (como aparece en la tarjeta):
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
                  <label className="text-xs font-semibold text-zinc-300">Número de Tarjeta:</label>
                  {detectedBrand && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      {detectedBrand}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  placeholder="4242 •••• •••• 4242"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Vencimiento (MM/AA):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={handleCardExpiryChange}
                    className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Código de Seguridad (CVV/CVC):
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    placeholder="•••"
                    maxLength={4}
                    value={cardCvc}
                    onChange={handleCardCvcChange}
                    className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5 text-[11px] text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300">Protección PCI-DSS con Mercado Pago:</strong>{' '}
                  Los datos sensibles de tu tarjeta se convierten en un token criptográfico directamente en tu navegador mediante{' '}
                  <code className="text-zinc-300">MercadoPago.js v2</code> y jamás viajan crudos hacia nuestro servidor.
                </span>
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
                  <span className="text-zinc-400">CLABE Interbancaria:</span>
                  <span className="font-mono font-bold text-orange-400">012 180 015482930412 8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Beneficiario:</span>
                  <span className="text-white">YourSelf Music S.A. de C.V.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Monto Exacto:</span>
                  <span className="font-bold text-emerald-400">${bookingData.totalPrice} MXN</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Número de Rastreo / Clave de Rastreo SPEI / Comprobante:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. SPEI-892140 o folio bancario"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                />
                <span className="text-[11px] text-zinc-500 block">
                  El personal de YourSelf Music validará este número con la cuenta bancaria para confirmar en Supabase.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Botón de Confirmación y Procesamiento */}
        <button
          type="submit"
          disabled={isProcessing || (paymentMethod === 'card' && !mpSdkReady)}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition-all text-base cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{processingStep || 'Procesando pago seguro con Mercado Pago...'}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>
                Confirmar y Pagar ${bookingData.totalPrice} MXN ({numPersonas}{' '}
                {numPersonas === 1 ? 'integrante' : 'integrantes'})
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
