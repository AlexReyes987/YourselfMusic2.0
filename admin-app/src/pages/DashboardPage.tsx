import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Layers, CheckCircle, Clock, Music, ArrowRight, Plus } from 'lucide-react';
import { adminSupabaseService } from '../services/adminSupabaseService';
import { ReservacionCompleta } from '../types/database';
import { Link } from 'react-router-dom';
import { CrearReservacionModal } from '../components/reservations/CrearReservacionModal';

export const DashboardPage: React.FC = () => {
  const [reservacionesHoy, setReservacionesHoy] = useState<ReservacionCompleta[]>([]);
  const [todasReservaciones, setTodasReservaciones] = useState<ReservacionCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCrearOpen, setIsCrearOpen] = useState(false);

  const hoyStr = new Date().toISOString().split('T')[0];

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await adminSupabaseService.getReservacionesConRelaciones();
      setTodasReservaciones(data);
      const hoy = data.filter((r) => r.fecha_reservacion === hoyStr);
      setReservacionesHoy(hoy);
    } catch (err) {
      console.error('Error cargando métricas de dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Métricas
  const reservasHoyCount = reservacionesHoy.filter((r) => r.estado_reservacion !== 'cancelled').length;
  const ingresosHoy = reservacionesHoy
    .filter((r) => r.estado_reservacion === 'confirmed')
    .reduce((sum, r) => sum + (r.monto_total || 0), 0);
  const transferenciasPendientes = todasReservaciones.filter(
    (r) => r.estado_reservacion === 'pending'
  ).length;

  // Tasa de ocupación hoy (4 salas * 12 horas operativas = 48 horas totales)
  const horasOcupadasHoy = reservacionesHoy
    .filter((r) => r.estado_reservacion !== 'cancelled')
    .reduce((sum, r) => {
      const startH = parseInt(r.hora_inicio.split(':')[0], 10);
      const endH = parseInt(r.hora_fin.split(':')[0], 10);
      return sum + Math.max(1, endH - startH);
    }, 0);
  const porcentajeOcupacion = Math.min(100, Math.round((horasOcupadasHoy / 48) * 100));

  return (
    <div className="p-6 space-y-6">
      {/* Saludo y Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Panel de Control General</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Resumen operativo en tiempo real de Yourself Music 2.0 en Durango, Dgo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/calendar"
            className="px-3.5 py-2 rounded-xl bg-[#181b24] hover:bg-zinc-800 border border-[#2a3142] text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>Ver Matriz de Ocupación</span>
          </Link>
          <button
            onClick={() => setIsCrearOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Reservas Hoy</span>
            <Calendar className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{reservasHoyCount}</div>
          <p className="text-[11px] text-zinc-500">4 salas físicas activas</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Ingresos del Día</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">${ingresosHoy.toLocaleString()} MXN</div>
          <p className="text-[11px] text-emerald-400">Confirmadas hoy</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Transferencias por Validar</span>
            <CheckCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{transferenciasPendientes}</div>
          <Link to="/transfers" className="text-[11px] text-amber-500 hover:underline inline-block">
            Verificar comprobantes SPEI →
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Ocupación Hoy</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{porcentajeOcupacion}%</div>
          <p className="text-[11px] text-zinc-500">{horasOcupadasHoy} hrs reservadas de 48 hrs</p>
        </div>
      </div>

      {/* Lista de Reservaciones de Hoy */}
      <div className="p-6 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Agenda de Ensayos para Hoy ({hoyStr})</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Horarios ocupados en las salas 1 a 4.
            </p>
          </div>
          <Link
            to="/reservations"
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
          >
            <span>Ver todas las reservaciones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1f2430] border-b border-[#2a3142] text-zinc-400 font-semibold">
                <th className="p-3">Horario</th>
                <th className="p-3">Sala</th>
                <th className="p-3">Cliente / Banda</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Monto</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3142]/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-400">
                    Cargando agenda de hoy...
                  </td>
                </tr>
              ) : reservacionesHoy.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-500">
                    No hay reservaciones programadas para hoy. Haz clic en "Nueva Reserva" para agendar.
                  </td>
                </tr>
              ) : (
                reservacionesHoy.map((r) => (
                  <tr key={r.reservacion_id} className="hover:bg-zinc-800/20">
                    <td className="p-3 font-mono font-bold text-orange-400">
                      {r.hora_inicio.slice(0, 5)} - {r.hora_fin.slice(0, 5)}
                    </td>
                    <td className="p-3 text-white font-medium flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{r.salas?.nombre_sala || `Sala ${r.sala_id}`}</span>
                    </td>
                    <td className="p-3 text-zinc-200 font-medium">
                      {r.usuarios?.nombre || 'Cliente'}
                    </td>
                    <td className="p-3 text-zinc-400 font-mono text-[11px]">
                      {r.usuarios?.telefono || 'N/A'}
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      ${r.monto_total} MXN
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          r.estado_reservacion === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : r.estado_reservacion === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {r.estado_reservacion === 'confirmed'
                          ? 'Confirmada'
                          : r.estado_reservacion === 'pending'
                          ? 'Pendiente'
                          : 'Cancelada'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CrearReservacionModal
        isOpen={isCrearOpen}
        onClose={() => setIsCrearOpen(false)}
        initialDate={hoyStr}
        onSuccess={() => cargarDatos()}
      />
    </div>
  );
};
