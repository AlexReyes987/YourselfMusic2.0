import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Music, AlertCircle, Loader2, Check } from 'lucide-react';
import { adminSupabaseService } from '../../services/adminSupabaseService';
import { ReservacionCompleta } from '../../types/database';

interface ModificarHorarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reservacion: ReservacionCompleta | null;
}

const ROOMS = [
  { id: 1, name: 'Sala 1 - Master Stage ($250/h)' },
  { id: 2, name: 'Sala 2 - Rocker Studio ($200/h)' },
  { id: 3, name: 'Sala 3 - Acoustic & Jazz ($220/h)' },
  { id: 4, name: 'Sala 4 - Indie Rehearsal ($180/h)' },
];

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const ModificarHorarioModal: React.FC<ModificarHorarioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  reservacion,
}) => {
  const [salaId, setSalaId] = useState<number>(1);
  const [fecha, setFecha] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<number>(14);
  const [duracion, setDuracion] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reservacion) {
      setSalaId(reservacion.sala_id);
      setFecha(reservacion.fecha_reservacion);
      const startH = parseInt(reservacion.hora_inicio.split(':')[0], 10) || 14;
      const endH = parseInt(reservacion.hora_fin.split(':')[0], 10) || startH + 2;
      setHoraInicio(startH);
      setDuracion(Math.max(1, endH - startH));
      setError(null);
    }
  }, [reservacion]);

  if (!isOpen || !reservacion) return null;

  const horaFin = horaInicio + duracion;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (horaFin > 23) {
      setError('El horario de cierre del estudio es a las 23:00 hrs.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const startStr = `${String(horaInicio).padStart(2, '0')}:00:00`;
    const endStr = `${String(horaFin).padStart(2, '0')}:00:00`;

    try {
      await adminSupabaseService.modificarHorario(
        reservacion.reservacion_id,
        salaId,
        fecha,
        startStr,
        endStr
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al reprogramar la reservación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clienteNombre = reservacion.usuarios?.nombre || 'Cliente';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#181b24] border border-[#2a3142] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="font-bold text-white text-base">Modificar Horario o Sala</h3>
              <p className="text-[11px] text-zinc-400">
                Folio: <span className="font-mono text-zinc-300">{reservacion.reservacion_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de cita actual */}
        <div className="bg-[#1f2430]/60 p-3.5 mx-4 mt-4 rounded-xl border border-[#2a3142] text-xs space-y-1">
          <div className="text-zinc-400">
            Cliente: <strong className="text-white">{clienteNombre}</strong>
          </div>
          <div className="text-zinc-400">
            Agendado originalmente:{' '}
            <span className="text-orange-400 font-medium">
              Sala {reservacion.sala_id} • {reservacion.fecha_reservacion} ({reservacion.hora_inicio.slice(0, 5)} - {reservacion.hora_fin.slice(0, 5)})
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Sala */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-orange-400" />
              Nueva Sala de Ensayo
            </label>
            <select
              value={salaId}
              onChange={(e) => setSalaId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
            >
              {ROOMS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              Nueva Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                Hora Inicio
              </label>
              <select
                value={horaInicio}
                onChange={(e) => setHoraInicio(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {HOURS.filter((h) => h <= 21).map((h) => (
                  <option key={h} value={h}>
                    {h}:00 hrs
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Duración
              </label>
              <select
                value={duracion}
                onChange={(e) => setDuracion(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value={1}>1 hora (hasta {horaInicio + 1}:00)</option>
                <option value={2}>2 horas (hasta {horaInicio + 2}:00)</option>
                <option value={3}>3 horas (hasta {horaInicio + 3}:00)</option>
                <option value={4}>4 horas (hasta {horaInicio + 4}:00)</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px]">
            Nuevo bloque seleccionado: <strong>{horaInicio}:00 - {horaFin}:00 hrs</strong>. Se validará que no exista solapamiento en la Sala {salaId}.
          </div>

          {/* Botones */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2a3142]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Reprogramación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

