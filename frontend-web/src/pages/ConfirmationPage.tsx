import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
      ? `Tarjeta ${state?.cardBrand || 'bancaria'}`
      : 'Transferencia bancaria SPEI';

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEnviarReciboCorreo = async () => {
    if (!emailCuenta) {
      setEmailError('No se encontró un correo electrónico asociado a tu sesión.');
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
        resp?.message || `El recibo de pago fue enviado a ${emailCuenta}.`
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
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {isConfirmed ? 'Reservación confirmada' : 'Reservación registrada'}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          {state?.mensajeConfirmacion ||
            (isConfirmed
              ? 'Tu pago se procesó correctamente y tu sala de ensayo ha quedado reservada.'
              : 'Hemos recibido tu referencia de transferencia y se encuentra en proceso de validación.')}
        </p>
      </div>

      {/* Comprobante / Recibo de Pago en Pantalla */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Cabecera del Recibo */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Comprobante de pago — YourSelf Music
            </h2>
            <p className="text-xs text-zinc-400">
              Recibo de reservación de sala de ensayo
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-xs font-semibold">
            Folio #{folio}
          </span>
        </div>

        {/* Cuerpo del Comprobante */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-zinc-800">
            <div>
              <span className="text-zinc-400 text-xs block">Número de operación:</span>
              <span className="font-mono font-semibold text-white">{transaccionId}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-zinc-400 text-xs block">Fecha y hora:</span>
              <span className="font-medium text-zinc-200">
                {state?.fechaPago
                  ? new Date(state.fechaPago).toLocaleString('es-MX')
                  : new Date().toLocaleString('es-MX')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Titular:</span>
              <span className="font-semibold text-white">{nombreCliente}</span>
            </div>

            {emailCuenta && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Correo electrónico:</span>
                <span className="text-zinc-200">{emailCuenta}</span>
              </div>
            )}

            {state?.roomName && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Sala reservada:</span>
                <span className="font-semibold text-white">{state.roomName}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Fecha y horario:</span>
              <span className="font-medium text-white">
                {state?.date || 'Hoy'} {state?.hours ? `(${state.hours})` : ''}
              </span>
            </div>

            {state?.numMiembros && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Integrantes:</span>
                <span className="text-white font-medium">
                  {state.numMiembros} {state.numMiembros === 1 ? 'músico' : 'músicos'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Método de pago:</span>
              <span className="text-zinc-200">
                {metodoPagoTexto}
                {state?.lastFourDigits ? ` •••• ${state.lastFourDigits}` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-zinc-400">Estado de la reservación:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isConfirmed
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {isConfirmed ? 'Confirmada' : 'Pendiente de validación'}
              </span>
            </div>
          </div>

          {/* Total Pagado */}
          <div className="mt-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 block">Total pagado</span>
              <span className="text-[11px] text-zinc-500">IVA incluido • MXN</span>
            </div>
            <span className="text-2xl font-black text-white">
              ${state?.totalPrice ?? 0} MXN
            </span>
          </div>

          <div className="text-zinc-400 text-xs pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>YourSelf Music Estudio — Durango, Dgo.</span>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://wa.me/526181133482"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-200 hover:text-orange-400 underline"
              >
                WhatsApp: 618 113 3482
              </a>
              <span>•</span>
              <a
                href="mailto:yourself_music@hotmail.com"
                className="text-zinc-200 hover:text-orange-400 underline"
              >
                yourself_music@hotmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes de estado de envío por correo */}
      {emailSentSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm">
          {emailSentSuccess}
        </div>
      )}

      {emailError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm">
          {emailError}
        </div>
      )}

      {/* Botones requeridos: Enviar recibo al correo y Cerrar a un lado */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleEnviarReciboCorreo}
          disabled={isSendingEmail || Boolean(emailSentSuccess)}
          className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
        >
          {isSendingEmail ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enviando recibo a {emailCuenta}...</span>
            </>
          ) : emailSentSuccess ? (
            <span>Recibo enviado a {emailCuenta}</span>
          ) : (
            <span>Enviar recibo a mi correo ({emailCuenta || 'mi cuenta'})</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleCerrarComprobante}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
