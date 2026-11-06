import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Volume2,
  CreditCard,
  ShieldCheck,
  Users,
  Mail,
  X,
  Loader2,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';

export const ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = location.state as
    | {
        folio?: string;
        transaccionId?: string;
        roomName?: string;
        date?: string;
        hours?: string;
        numMiembros?: number;
        paymentMethod?: string;
        cardBrand?: string;
        lastFourDigits?: string;
        totalPrice?: number;
        status?: string;
        fechaPago?: string;
        mensajeConfirmacion?: string;
        cliente?: {
          nombre?: string;
          email?: string;
          telefono?: string;
        };
      }
    | undefined;

  const folio = state?.folio || 'YM-2026-0842';
  const transaccionId = state?.transaccionId || `MP-${Date.now().toString().slice(-8)}`;
  const isConfirmed = state?.status === 'confirmed' || state?.paymentMethod === 'card';
  const emailCuenta = user?.email || state?.cliente?.email || '';
  const nombreCliente = state?.cliente?.nombre || user?.name || user?.nombre || 'Cliente YourSelf Music';
  const metodoPagoTexto =
    state?.paymentMethod === 'card'
      ? `Tarjeta ${state?.cardBrand || 'Bancaria'} (Mercado Pago)`
      : 'Transferencia Bancaria SPEI';

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEnviarReciboCorreo = async () => {
    if (!emailCuenta) {
      setEmailError('No se encontró un correo electrónico en tu sesión activa.');
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);
    setEmailSentSuccess(null);

    try {
      const resp = await paymentService.enviarReciboPorCorreo({
        email: emailCuenta,
        nombre_cliente: nombreCliente,
        folio: String(folio),
        transaccion_id: transaccionId,
        nombre_sala: state?.roomName || 'Sala de Ensayo',
        fecha_reservacion: state?.date || new Date().toISOString().split('T')[0],
        horario: state?.hours || 'Horario reservado',
        num_miembros: state?.numMiembros || 1,
        monto_total: state?.totalPrice || 0,
        metodo_pago: metodoPagoTexto,
        ultimos_cuatro: state?.lastFourDigits,
        fecha_pago: state?.fechaPago || new Date().toISOString(),
      });

      setEmailSentSuccess(
        resp?.message || `¡Recibo de pago enviado exitosamente a ${emailCuenta}!`
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'No se pudo enviar el recibo al correo. Inténtalo de nuevo.';
      setEmailError(msg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCerrarComprobante = () => {
    navigate('/my-reservations');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14 space-y-6">
      {/* Encabezado y Mensaje de Confirmación */}
      <div className="text-center space-y-3">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full border ${
            isConfirmed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}
        >
          {isConfirmed ? (
            <CheckCircle2 className="w-10 h-10" />
          ) : (
            <Clock className="w-10 h-10" />
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {isConfirmed
            ? '¡Pago Aprobado y Reservación Confirmada!'
            : '¡Reservación Registrada con Éxito!'}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto">
          {state?.mensajeConfirmacion ||
            (isConfirmed
              ? 'Tu pago ha sido procesado exitosamente por Mercado Pago y el estado de tu reservación se ha actualizado automáticamente a Confirmada en Supabase.'
              : 'Tu pago por transferencia SPEI está registrado en Supabase y en proceso de validación administrativa.')}
        </p>
      </div>

      {/* Comprobante / Recibo de Pago en Pantalla */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Cabecera del Recibo */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                Recibo Oficial de Pago — YourSelf Music
              </h2>
              <p className="text-[11px] text-orange-100">
                Comprobante electrónico de reservación de sala de ensayo
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-black/25 text-white font-mono text-xs font-bold">
            Folio #{folio}
          </span>
        </div>

        {/* Cuerpo del Comprobante */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-zinc-800">
            <div>
              <span className="text-zinc-400 text-xs block">ID Transacción Mercado Pago:</span>
              <span className="font-mono font-bold text-white">{transaccionId}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-zinc-400 text-xs block">Fecha y Hora de Pago:</span>
              <span className="font-medium text-zinc-200">
                {state?.fechaPago
                  ? new Date(state.fechaPago).toLocaleString('es-MX')
                  : new Date().toLocaleString('es-MX')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Titular de la Reserva:</span>
              <span className="font-bold text-white">{nombreCliente}</span>
            </div>

            {emailCuenta && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Correo de la Cuenta:</span>
                <span className="text-zinc-200 font-medium">{emailCuenta}</span>
              </div>
            )}

            {state?.roomName && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-orange-400" />
                  <span>Sala Reservada:</span>
                </span>
                <span className="font-bold text-white">{state.roomName}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span>Fecha y Horario:</span>
              </span>
              <span className="font-semibold text-white">
                {state?.date || 'Hoy'} {state?.hours ? `(${state.hours})` : ''}
              </span>
            </div>

            {state?.numMiembros && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-orange-400" />
                  <span>Integrantes Registrados:</span>
                </span>
                <span className="text-white font-semibold">
                  {state.numMiembros} {state.numMiembros === 1 ? 'músico' : 'músicos'} ($35 MXN/h c/u)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-orange-400" />
                <span>Método de Pago:</span>
              </span>
              <span className="text-zinc-200 font-medium">
                {metodoPagoTexto}
                {state?.lastFourDigits ? ` •••• ${state.lastFourDigits}` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-zinc-400">Estado de la Reserva en Base de Datos:</span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  isConfirmed
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isConfirmed ? 'CONFIRMADA (confirmed)' : 'POR VALIDAR (pending)'}
              </span>
            </div>
          </div>

          {/* Total Pagado */}
          <div className="mt-4 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 block">Monto Total Pagado</span>
              <span className="text-[11px] text-zinc-500">IVA incluido • Moneda Nacional</span>
            </div>
            <span className="text-2xl font-black text-emerald-400">
              ${state?.totalPrice ?? 0} MXN
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400 text-xs pt-1">
            <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
            <span>YourSelf Music Estudio — Durango, Dgo., México</span>
          </div>
        </div>
      </div>

      {/* Mensajes de estado de envío por correo */}
      {emailSentSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{emailSentSuccess}</span>
        </div>
      )}

      {emailError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{emailError}</span>
        </div>
      )}

      {/* Botones requeridos: Enviar recibo al correo con el que inició sesión y Cerrar a un lado */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleEnviarReciboCorreo}
          disabled={isSendingEmail || Boolean(emailSentSuccess)}
          className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
        >
          {isSendingEmail ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enviando recibo a {emailCuenta}...</span>
            </>
          ) : emailSentSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Recibo Enviado a {emailCuenta}</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>Enviar recibo a mi correo ({emailCuenta || 'mi cuenta'})</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCerrarComprobante}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  );
};
