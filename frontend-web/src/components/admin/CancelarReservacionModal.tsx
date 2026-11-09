import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, DollarSign, Loader2, FileText } from 'lucide-react';
import { adminSupabaseService } from '../../services/adminSupabaseService';
import { ReservacionCompleta } from '../../types/adminDatabase';
import {
  calcularPoliticaCancelacionLocal,
  MULTA_CANCELACION_MXN,
} from '../../services/reservationService';

interface CancelarReservacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reservacion: ReservacionCompleta | null;
}

export const CancelarReservacionModal: React.FC<CancelarReservacionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  reservacion,
}) => {
  const [motivo, setMotivo] = useState('');
  const [tarifaMulta, setTarifaMulta] = useState<number>(0);
  const [montoReembolsado, setMontoReembolsado] = useState<number>(0);
  const [aplicaPenalizacion, setAplicaPenalizacion] = useState<boolean>(false);
  const [diasAnticipacion, setDiasAnticipacion] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reservacion) {
      setMotivo('');
      setError(null);

      const evaluacion = calcularPoliticaCancelacionLocal(
        reservacion.fecha_reservacion,
        Number(reservacion.monto_total || 0),
        reservacion.estado_reservacion
      );

      setDiasAnticipacion(evaluacion.dias_anticipacion);
      setAplicaPenalizacion(evaluacion.aplica_multa);
      setTarifaMulta(evaluacion.tarifa_multa);
      setMontoReembolsado(evaluacion.monto_reembolsado);
    }
  }, [reservacion]);

  if (!isOpen || !reservacion) return null;

  const montoPagado =
    reservacion.estado_reservacion === 'confirmed' ? Number(reservacion.monto_total || 0) : 0;
  const montoRetenido = Math.min(montoPagado, tarifaMulta);
  const adeudoCliente = Math.max(0, tarifaMulta - montoRetenido);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Debes especificar un motivo para registrar la cancelación.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await adminSupabaseService.cancelarReservacion(
        reservacion.reservacion_id,
        motivo,
        tarifaMulta,
        montoReembolsado,
        aplicaPenalizacion
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la cancelación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clienteNombre = reservacion.usuarios?.nombre || 'Cliente';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#141417] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">
              Cancelar Reservación (Política Oficial ${MULTA_CANCELACION_MXN} MXN)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen */}
        <div className="p-4 bg-rose-500/10 border-b border-zinc-800 text-xs space-y-1">
          <p className="text-zinc-300 font-medium">
            Estás a punto de cancelar la reservación{' '}
            <span className="font-mono text-rose-300 font-bold">#{reservacion.reservacion_id}</span>
          </p>
          <div className="text-zinc-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <span>
              Cliente: <strong className="text-white">{clienteNombre}</strong>
            </span>
            <span>Sala {reservacion.sala_id}</span>
            <span>
              Fecha: {reservacion.fecha_reservacion} ({reservacion.hora_inicio.slice(0, 5)} -{' '}
              {reservacion.hora_fin.slice(0, 5)})
            </span>
            <span>
              Monto Reserva:{' '}
              <strong className="text-emerald-400">${reservacion.monto_total} MXN</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Motivo de cancelación */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              Motivo de la Cancelación <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              rows={2}
              placeholder="Ej. Solicitud de cancelación el mismo día o 1 día antes por parte de la banda..."
              className="w-full px-3 py-2 rounded-xl bg-[#1b1b20] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* ¿Mismo día o 1 día antes? */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#1b1b20] border border-zinc-800">
            <input
              type="checkbox"
              id="es_mismo_dia"
              checked={aplicaPenalizacion}
              onChange={(e) => {
                const checked = e.target.checked;
                setAplicaPenalizacion(checked);
                if (checked) {
                  setTarifaMulta(MULTA_CANCELACION_MXN);
                  setMontoReembolsado(Math.max(0, montoPagado - MULTA_CANCELACION_MXN));
                } else {
                  setTarifaMulta(0);
                  setMontoReembolsado(montoPagado);
                }
              }}
              className="mt-0.5 rounded bg-zinc-800 border-zinc-700 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="es_mismo_dia" className="text-xs text-zinc-300 cursor-pointer">
              <strong className="text-white block">
                Cancelación el mismo día o 1 día antes del ensayo (Multa Fija de ${MULTA_CANCELACION_MXN} MXN por toda la banda)
              </strong>
              <span className="text-[11px] text-zinc-400">
                {diasAnticipacion === 0
                  ? 'Detectado automáticamente: El ensayo es HOY (mismo día).'
                  : diasAnticipacion === 1
                  ? 'Detectado automáticamente: El ensayo es MAÑANA (1 día antes).'
                  : `Faltan ${diasAnticipacion} días para el ensayo.`}
              </span>
            </label>
          </div>

          {/* Multa y Reembolso */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                Multa Aplicada ($ MXN)
              </label>
              <input
                type="number"
                min="0"
                value={tarifaMulta}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTarifaMulta(val);
                  setMontoReembolsado(Math.max(0, montoPagado - val));
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#1b1b20] border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Monto a Reembolsar ($ MXN)
              </label>
              <input
                type="number"
                min="0"
                value={montoReembolsado}
                onChange={(e) => setMontoReembolsado(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#1b1b20] border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Resumen contable para el Administrador */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] space-y-1 text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-400">Retención automática sobre el pago del cliente:</span>
              <strong className="text-amber-400">${montoRetenido} MXN</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Monto a devolver al cliente:</span>
              <strong className="text-emerald-400">${montoReembolsado} MXN</strong>
            </div>
            {adeudoCliente > 0 && (
              <div className="flex justify-between pt-1 border-t border-rose-500/30 text-rose-300">
                <span>Adeudo registrado en la cuenta del cliente (bloquea nuevas reservas):</span>
                <strong className="text-rose-400">${adeudoCliente} MXN</strong>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Regresar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar Cancelación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
