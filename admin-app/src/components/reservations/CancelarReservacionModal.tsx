import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, DollarSign, Loader2, FileText } from 'lucide-react';
import { adminSupabaseService } from '../../services/adminSupabaseService';
import { ReservacionCompleta } from '../../types/database';

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
  const [esMismoDia, setEsMismoDia] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reservacion) {
      setMotivo('');
      setError(null);
      
      // Checar si la fecha de reservación es hoy
      const hoy = new Date().toISOString().split('T')[0];
      const esHoy = reservacion.fecha_reservacion === hoy;
      setEsMismoDia(esHoy);

      const monto = reservacion.monto_total || 0;
      if (esHoy) {
        // Por política de cancelación el mismo día, 50% de penalización por defecto
        const multa = Math.round(monto * 0.5);
        setTarifaMulta(multa);
        setMontoReembolsado(Math.max(0, monto - multa));
      } else {
        setTarifaMulta(0);
        setMontoReembolsado(monto);
      }
    }
  }, [reservacion]);

  if (!isOpen || !reservacion) return null;

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
        esMismoDia
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
      <div className="w-full max-w-lg bg-[#181b24] border border-[#2a3142] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Cancelar Reservación</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen */}
        <div className="p-4 bg-rose-500/10 border-b border-[#2a3142] text-xs space-y-1">
          <p className="text-zinc-300 font-medium">
            Estás a punto de cancelar la reservación <span className="font-mono text-rose-300 font-bold">{reservacion.reservacion_id}</span>
          </p>
          <div className="text-zinc-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <span>Cliente: <strong className="text-white">{clienteNombre}</strong></span>
            <span>Sala {reservacion.sala_id}</span>
            <span>Fecha: {reservacion.fecha_reservacion} ({reservacion.hora_inicio.slice(0, 5)} - {reservacion.hora_fin.slice(0, 5)})</span>
            <span>Monto Total: <strong className="text-emerald-400">${reservacion.monto_total} MXN</strong></span>
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
              rows={3}
              placeholder="Ej. Solicitud directa del cliente por imprevisto de la banda / Falta de pago de anticipo..."
              className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* ¿Mismo día? */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1f2430] border border-[#2a3142]">
            <input
              type="checkbox"
              id="es_mismo_dia"
              checked={esMismoDia}
              onChange={(e) => {
                const checked = e.target.checked;
                setEsMismoDia(checked);
                const monto = reservacion.monto_total || 0;
                if (checked) {
                  const multa = Math.round(monto * 0.5);
                  setTarifaMulta(multa);
                  setMontoReembolsado(Math.max(0, monto - multa));
                } else {
                  setTarifaMulta(0);
                  setMontoReembolsado(monto);
                }
              }}
              className="rounded bg-zinc-800 border-zinc-700 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="es_mismo_dia" className="text-xs text-zinc-300 cursor-pointer">
              Cancelación el mismo día del ensayo (Aplica retención de penalización)
            </label>
          </div>

          {/* Multa y Reembolso */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                Tarifa / Multa ($ MXN)
              </label>
              <input
                type="number"
                min="0"
                value={tarifaMulta}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTarifaMulta(val);
                  setMontoReembolsado(Math.max(0, (reservacion.monto_total || 0) - val));
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Monto Reembolsado ($ MXN)
              </label>
              <input
                type="number"
                min="0"
                value={montoReembolsado}
                onChange={(e) => setMontoReembolsado(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 italic">
            Esta acción liberará el espacio de la Sala {reservacion.sala_id} y registrará el movimiento en las tablas <strong>cancelaciones</strong> y <strong>auditoria</strong> de Supabase.
          </p>

          {/* Botones */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2a3142]">
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
