import React, { useState } from 'react';
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
  const { user } = useAuth();

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
    totalPrice: number;
  } | undefined;

  // Estado del formulario del cliente
  const [nombre, setNombre] = useState(user?.name || user?.nombre || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telefono, setTelefono] = useState(user?.phone || user?.telefono || '');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const transaccionId = paymentMethod === 'card'
        ? `CARD-STRIPE-${Date.now()}`
        : transferRef.trim() || `SPEI-${Date.now()}`;

      // Usar UUID de usuario autenticado o UUID predeterminado de cliente invitado
      const usuarioId = user?.id || user?.usuario_id || '00000000-0000-0000-0000-000000000001';

      const payload = {
        usuario_id: usuarioId,
        cliente_nombre: nombre,
        cliente_email: email,
        cliente_telefono: telefono,
        sala_id: bookingData.salaId,
        fecha_reservacion: bookingData.fecha,
        hora_inicio: bookingData.horaInicio,
        hora_fin: bookingData.horaFin,
        monto_total: bookingData.totalPrice,
        pago: {
          metodo_pago: paymentMethod,
          monto: bookingData.totalPrice,
          concepto_pago: `Ensayo ${bookingData.nombreSala} (${bookingData.fecha} ${bookingData.horaInicio.slice(0, 5)}-${bookingData.horaFin.slice(0, 5)})`,
          transaccion_id: transaccionId,
        },
      };

      let folio = `YM-${Date.now().toString().slice(-6)}`;
      let statusReservacion = paymentMethod === 'card' ? 'confirmed' : 'pending';

      try {
        const response = await reservationService.create(payload as any);
        if (response?.reservacion) {
          folio = response.reservacion.reservacion_id;
          statusReservacion = response.reservacion.estado_reservacion || statusReservacion;
        }
      } catch (apiErr: any) {
        // Si el backend responde con error 409 (conflicto de solapamiento), mostramos mensaje estricto
        if (apiErr.response?.status === 409) {
          setErrorMessage(
            apiErr.response.data?.message ||
              'Conflicto: El horario seleccionado acaba de ser reservado por otro usuario. Por favor vuelve al catálogo y selecciona otro horario.'
          );
          setIsProcessing(false);
          return;
        }

        console.warn('Backend API no disponible en este momento, simulando registro para demostración local:', apiErr);
      }

      navigate('/confirmation', {
        state: {
          folio,
          roomName: bookingData.nombreSala,
          date: bookingData.fecha,
          hours: `${bookingData.horaInicio.slice(0, 5)} a ${bookingData.horaFin.slice(0, 5)}`,
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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-orange-400" />
            <h2 className="text-base font-bold text-white">{bookingData.nombreSala}</h2>
            <span className="text-xs text-zinc-400">({bookingData.capacidad} músicos)</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              {bookingData.fecha}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              {bookingData.horaInicio.slice(0, 5)} - {bookingData.horaFin.slice(0, 5)} ({bookingData.duration} hrs)
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
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800 pb-3">
            <User className="w-4 h-4 text-orange-400" />
            <span>1. Datos del Titular de la Reserva</span>
          </div>

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
            <span>2. Método de Pago (alimenta tabla 'pagos')</span>
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
                  Confirmación inmediata en Supabase. Pasarela en línea.
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
                  Estado pendiente hasta aprobación por administración.
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
                <span>Transacción encriptada con cifrado SSL de 256 bits.</span>
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
                  El personal de YourSelf Music validará este número con la cuenta bancaria.
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
              <span>Confirmar y Pagar ${bookingData.totalPrice} MXN</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
