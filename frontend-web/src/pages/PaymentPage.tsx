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
} from 'lucide-react';
import { reservationService } from '../services/reservationService';
import { useAuth } from '../context/AuthContext';

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const bookingData = location.state as {
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
  } | undefined;

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
          message: 'Para registrar tu reservación oficial en YourSelf Music, primero debes iniciar sesión o crear tu cuenta.',
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

  // Método de pago (tarjeta o transferencia SPEI)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Datos simulados de tarjeta
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

  const numPersonas = bookingData.numMiembros && bookingData.numMiembros > 0 ? bookingData.numMiembros : 1;

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

      const transaccionId = paymentMethod === 'card'
        ? `CARD-STRIPE-${Date.now()}`
        : transferRef.trim() || `SPEI-${Date.now()}`;

      const payload = {
        usuario_id: usuarioId,
        cliente_nombre: nombre,
        cliente_email: email,
        cliente_telefono: telefono,
        sala_id: bookingData.salaId,
        fecha_reservacion: bookingData.fecha,
        hora_inicio: bookingData.horaInicio,
        hora_fin: bookingData.horaFin,
        num_personas: numPersonas,
        monto_total: bookingData.totalPrice,
        pago: {
          metodo_pago: paymentMethod,
          monto: bookingData.totalPrice,
          concepto_pago: `Ensayo ${bookingData.nombreSala} (${bookingData.fecha} ${bookingData.horaInicio.slice(0, 5)}-${bookingData.horaFin.slice(0, 5)}) - ${numPersonas} integrantes`,
          transaccion_id: transaccionId,
        },
      };

      let folio = `YM-${Date.now().toString().slice(-6)}`;
      let statusReservacion = paymentMethod === 'card' ? 'confirmed' : 'pending';

      try {
        const response = await reservationService.create(payload as any);
        if (response?.reservacion) {
          folio = String(response.reservacion.reservacion_id);
          statusReservacion = response.reservacion.estado_reservacion || statusReservacion;
        }

        // Limpiar reservación pendiente tras éxito en base de datos
        try {
          sessionStorage.removeItem('pendingBooking');
        } catch {}
      } catch (apiErr: any) {
        setIsProcessing(false);

        // 1. Error 401: Usuario no autenticado o no encontrado en base de datos
        if (apiErr.response?.status === 401) {
          setErrorMessage(
            apiErr.response.data?.message ||
              'Debes iniciar sesión con una cuenta registrada para poder confirmar tu reservación.'
          );
          navigate('/login', {
            state: {
              from: '/payment',
              bookingData,
              message: 'Tu sesión ha expirado o no estás autenticado. Inicia sesión con tu cuenta de usuario para confirmar la cita.',
            },
          });
          return;
        }

        // 2. Error 409: Conflicto de horario o solapamiento
        if (apiErr.response?.status === 409) {
          setErrorMessage(
            apiErr.response.data?.message ||
              'Conflicto: El horario seleccionado acaba de ser apartado por otro músico. Por favor regresa al catálogo y elige otro bloque de horas.'
          );
          return;
        }

        // 3. Otro error devuelto por la API del backend
        if (apiErr.response?.data?.message) {
          setErrorMessage(apiErr.response.data.message);
          return;
        }

        // 4. Error de red o servidor no disponible
        setErrorMessage(
          'No se pudo conectar con el servidor de YourSelf Music. Asegúrate de que el backend esté ejecutándose en http://localhost:4000.'
        );
        return;
      }

      navigate('/confirmation', {
        state: {
          folio,
          roomName: bookingData.nombreSala,
          date: bookingData.fecha,
          hours: `${bookingData.horaInicio.slice(0, 5)} a ${bookingData.horaFin.slice(0, 5)}`,
          numMiembros: numPersonas,
          paymentMethod,
          totalPrice: bookingData.totalPrice,
          status: statusReservacion,
          cliente: {
            nombre,
            email,
            telefono,
          },
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error al procesar la reservación y pago.');
    } finally {
      setIsProcessing(false);
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
          Confirmación de Reserva y Pago
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Completa tus datos de contacto y selecciona tu método de pago preferido.
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
              {bookingData.horaInicio.slice(0, 5)} - {bookingData.horaFin.slice(0, 5)} ({bookingData.duration} hrs)
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
            <p className="font-bold">No fue posible completar la reserva</p>
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
                  Titular: <span className="text-orange-400">{user.name || user.nombre}</span>
                </p>
                <p className="text-zinc-400 text-[11px]">
                  Esta reservación quedará vinculada oficialmente a tu usuario en la tabla <code className="text-zinc-200">usuarios</code> de Supabase.
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
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej. Banda Los Alacranes / Carlos Mendoza"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>Correo Electrónico:</span>
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
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800 pb-3">
            <CreditCard className="w-4 h-4 text-orange-400" />
            <span>2. Método de Pago (alimenta tabla 'pagos' en Supabase)</span>
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
                <p className="text-sm font-bold text-white">Tarjeta de Crédito / Débito</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Confirmación inmediata en Supabase (estado 'confirmed').
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

          {/* Formulario de Tarjeta */}
          {paymentMethod === 'card' ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Número de Tarjeta:</label>
                <input
                  type="text"
                  required
                  placeholder="4242 •••• •••• 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Vencimiento:</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">CVC / CVV:</label>
                  <input
                    type="password"
                    required
                    placeholder="•••"
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Transacción encriptada con cifrado SSL de 256 bits y registro en Supabase.</span>
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
          disabled={isProcessing}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition-all text-base cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Validando disponibilidad e insertando en Supabase...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar y Pagar ${bookingData.totalPrice} MXN ({numPersonas} integrantes)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
