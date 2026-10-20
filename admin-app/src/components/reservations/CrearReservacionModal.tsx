import React, { useState } from 'react';
import { X, Calendar, Clock, Music, User, Phone, Mail, Loader2, AlertCircle } from 'lucide-react';
import { adminSupabaseService } from '../../services/adminSupabaseService';
import { ReservacionCompleta } from '../../types/database';

interface CrearReservacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nueva: ReservacionCompleta) => void;
  initialSalaId?: number;
  initialHour?: number;
  initialDate?: string;
}

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const CrearReservacionModal: React.FC<CrearReservacionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSalaId = 1,
  initialHour = 14,
  initialDate,
}) => {
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [salaId, setSalaId] = useState(initialSalaId);
  const [fecha, setFecha] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState(initialHour);
  const [duracion, setDuracion] = useState(2);
  const [registrarPago, setRegistrarPago] = useState(true);
  const [metodoPago, setMetodoPago] = useState<'card' | 'transfer'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const tarifas: Record<number, number> = { 1: 250, 2: 200, 3: 220, 4: 180 };
  const montoTotal = (tarifas[salaId] || 200) * duracion;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const startStr = `${String(horaInicio).padStart(2, '0')}:00:00`;
    const endStr = `${String(horaInicio + duracion).padStart(2, '0')}:00:00`;

    try {
      const nueva = await adminSupabaseService.crearReservacionManual({
        nombre_cliente: nombreCliente,
        telefono_cliente: telefonoCliente,
        email_cliente: emailCliente,
        sala_id: salaId,
        fecha_reservacion: fecha,
        hora_inicio: startStr,
        hora_fin: endStr,
        monto_total: montoTotal,
        estado_reservacion: registrarPago ? 'confirmed' : 'pending',
        registrar_pago: registrarPago,
        metodo_pago: metodoPago,
      });

      onSuccess(nueva);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear la reservación manual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#181b24] border border-[#2a3142] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-white text-base">Crear Reservación Manual</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Datos del Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Datos del Músico o Banda
            </h4>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Nombre o Banda *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Banda Los Alacranes / Roberto Gómez"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Teléfono *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="618 123 4567"
                  value={telefonoCliente}
                  onChange={(e) => setTelefonoCliente(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={emailCliente}
                  onChange={(e) => setEmailCliente(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Sala, Fecha y Horario */}
          <div className="space-y-3 pt-2 border-t border-[#2a3142]">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Detalles del Ensayo
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Sala Física (1 a 4) *</label>
                <select
                  value={salaId}
                  onChange={(e) => setSalaId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value={1}>Sala 1 - Master Stage ($250/h)</option>
                  <option value={2}>Sala 2 - Rocker Studio ($200/h)</option>
                  <option value={3}>Sala 3 - Acoustic & Jazz ($220/h)</option>
                  <option value={4}>Sala 4 - Indie Rehearsal ($180/h)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Fecha *</span>
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hora de Inicio *</span>
                </label>
                <select
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  {HOURS.filter((h) => h < 22).map((h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Duración *</label>
                <select
                  value={duracion}
                  onChange={(e) => setDuracion(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value={1}>1 Hora ({horaInicio}:00 - {horaInicio + 1}:00)</option>
                  <option value={2}>2 Horas ({horaInicio}:00 - {horaInicio + 2}:00)</option>
                  <option value={3}>3 Horas ({horaInicio}:00 - {horaInicio + 3}:00)</option>
                  <option value={4}>4 Horas ({horaInicio}:00 - {horaInicio + 4}:00)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opciones de Pago */}
          <div className="p-3 rounded-xl bg-[#1f2430] border border-[#2a3142] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={registrarPago}
                  onChange={(e) => setRegistrarPago(e.target.checked)}
                  className="rounded bg-zinc-800 text-orange-500 focus:ring-orange-500"
                />
                <span className="font-semibold">Registrar pago inmediatamente</span>
              </label>

              <span className="font-black text-orange-400 text-sm">
                ${montoTotal} MXN
              </span>
            </div>

            {registrarPago && (
              <div className="flex items-center gap-3 pt-2 border-t border-zinc-700/60 text-xs text-zinc-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="card"
                    checked={metodoPago === 'card'}
                    onChange={() => setMetodoPago('card')}
                  />
                  <span>Tarjeta / Terminal</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="transfer"
                    checked={metodoPago === 'transfer'}
                    onChange={() => setMetodoPago('transfer')}
                  />
                  <span>Transferencia / Efectivo</span>
                </label>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando y Guardando...</span>
                </>
              ) : (
                <span>Crear Reservación</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
