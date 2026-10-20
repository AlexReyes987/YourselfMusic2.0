import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Music,
  User,
  Phone,
  RotateCcw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { adminSupabaseService } from '../services/adminSupabaseService';
import { ReservacionCompleta } from '../types/database';
import { CrearReservacionModal } from '../components/reservations/CrearReservacionModal';
import { ModificarHorarioModal } from '../components/reservations/ModificarHorarioModal';
import { CancelarReservacionModal } from '../components/reservations/CancelarReservacionModal';

export const ReservationsPage: React.FC = () => {
  const [reservaciones, setReservaciones] = useState<ReservacionCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [filtroSala, setFiltroSala] = useState<number | 'todas'>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modales
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [isModificarOpen, setIsModificarOpen] = useState(false);
  const [isCancelarOpen, setIsCancelarOpen] = useState(false);
  const [resSeleccionada, setResSeleccionada] = useState<ReservacionCompleta | null>(null);

  // Mensaje de éxito temporal
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminSupabaseService.getReservacionesConRelaciones({
        fecha: filtroFecha || undefined,
        sala_id: filtroSala !== 'todas' ? (filtroSala as number) : undefined,
        estado: filtroEstado,
      });
      setReservaciones(data);
    } catch (err: any) {
      setError(err.message || 'Error al consultar reservaciones');
    } finally {
      setLoading(false);
    }
  }, [filtroFecha, filtroSala, filtroEstado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const mostrarExito = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleConfirmarPago = async (res: ReservacionCompleta) => {
    try {
      await adminSupabaseService.confirmarTransferencia(res.reservacion_id);
      mostrarExito(`Transferencia de ${res.usuarios?.nombre || 'la reservación'} confirmada.`);
      cargarDatos();
    } catch (err: any) {
      alert(`Error al confirmar pago: ${err.message}`);
    }
  };

  // Filtrado en memoria por búsqueda de texto
  const reservacionesFiltradas = reservaciones.filter((r) => {
    if (!busqueda.trim()) return true;
    const term = busqueda.toLowerCase();
    const cliente = r.usuarios?.nombre?.toLowerCase() || '';
    const email = r.usuarios?.email?.toLowerCase() || '';
    const telefono = r.usuarios?.telefono?.toLowerCase() || '';
    const folio = r.reservacion_id.toLowerCase();
    return (
      cliente.includes(term) ||
      email.includes(term) ||
      telefono.includes(term) ||
      folio.includes(term)
    );
  });

  // Métricas rápidas
  const total = reservaciones.length;
  const confirmadas = reservaciones.filter((r) => r.estado_reservacion === 'confirmed').length;
  const pendientes = reservaciones.filter((r) => r.estado_reservacion === 'pending').length;
  const canceladas = reservaciones.filter((r) => r.estado_reservacion === 'cancelled').length;

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Music className="w-6 h-6 text-orange-500" />
            Gestión de Reservaciones (CRUD)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Administración directa sobre Supabase: creación manual, cambios de horario, cancelaciones con multa y validación de cobros.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => cargarDatos()}
            className="p-2 rounded-xl bg-[#181b24] hover:bg-zinc-800 border border-[#2a3142] text-zinc-300 hover:text-white transition-colors"
            title="Recargar datos"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsCrearOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Reservación Manual</span>
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas de Estadísticas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#181b24] border border-[#2a3142]">
          <span className="text-[11px] text-zinc-400 font-medium">Total en Vista</span>
          <p className="text-xl font-black text-white mt-0.5">{total}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#181b24] border border-[#2a3142]">
          <span className="text-[11px] text-emerald-400 font-medium">Confirmadas</span>
          <p className="text-xl font-black text-emerald-400 mt-0.5">{confirmadas}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#181b24] border border-[#2a3142]">
          <span className="text-[11px] text-amber-400 font-medium">Pendientes de Pago</span>
          <p className="text-xl font-black text-amber-400 mt-0.5">{pendientes}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#181b24] border border-[#2a3142]">
          <span className="text-[11px] text-rose-400 font-medium">Canceladas</span>
          <p className="text-xl font-black text-rose-400 mt-0.5">{canceladas}</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-[#181b24] border border-[#2a3142] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Búsqueda por texto */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, folio o tel..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Filtro por Fecha */}
        <div className="relative">
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
          />
          {filtroFecha && (
            <button
              onClick={() => setFiltroFecha('')}
              className="absolute right-2.5 top-2 text-[10px] text-zinc-400 hover:text-white"
            >
              Borrar
            </button>
          )}
        </div>

        {/* Filtro por Sala */}
        <div>
          <select
            value={filtroSala}
            onChange={(e) =>
              setFiltroSala(e.target.value === 'todas' ? 'todas' : Number(e.target.value))
            }
            className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="todas">Todas las Salas (1 a 4)</option>
            <option value={1}>Sala 1 - Master Stage</option>
            <option value={2}>Sala 2 - Rocker Studio</option>
            <option value={3}>Sala 3 - Acoustic & Jazz</option>
            <option value={4}>Sala 4 - Indie Rehearsal</option>
          </select>
        </div>

        {/* Filtro por Estado */}
        <div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Tabla de Reservaciones */}
      <div className="border border-[#2a3142] rounded-2xl bg-[#181b24] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1f2430] border-b border-[#2a3142] text-zinc-400 font-semibold">
                <th className="p-3.5">Folio</th>
                <th className="p-3.5">Cliente / Contacto</th>
                <th className="p-3.5">Sala Asignada</th>
                <th className="p-3.5">Fecha & Horario</th>
                <th className="p-3.5">Monto & Pago</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3142]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                    <span>Cargando reservaciones desde Supabase...</span>
                  </td>
                </tr>
              ) : reservacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No se encontraron reservaciones que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                reservacionesFiltradas.map((res) => {
                  const cliente = res.usuarios?.nombre || 'Cliente';
                  const tel = res.usuarios?.telefono || 'Sin teléfono';
                  const email = res.usuarios?.email || 'Sin correo';
                  const salaNombre =
                    res.salas?.nombre_sala || `Sala ${res.sala_id}`;
                  const pago = res.pagos && res.pagos.length > 0 ? res.pagos[0] : null;

                  return (
                    <tr
                      key={res.reservacion_id}
                      className="hover:bg-zinc-800/20 transition-colors"
                    >
                      {/* Folio */}
                      <td className="p-3.5 font-mono text-[11px] text-zinc-400 font-bold">
                        {res.reservacion_id.slice(0, 8)}...
                      </td>

                      {/* Cliente */}
                      <td className="p-3.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span>{cliente}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{tel}</span>
                        </div>
                        {email && email !== 'Sin correo' && (
                          <div className="text-[10px] text-zinc-500 truncate max-w-[160px] mt-0.5">
                            {email}
                          </div>
                        )}
                      </td>

                      {/* Sala */}
                      <td className="p-3.5 font-medium text-zinc-200">
                        <div className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-orange-400" />
                          <span>{salaNombre}</span>
                        </div>
                      </td>

                      {/* Fecha y Horario */}
                      <td className="p-3.5">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{res.fecha_reservacion}</span>
                        </div>
                        <div className="text-[11px] text-orange-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>
                            {res.hora_inicio.slice(0, 5)} - {res.hora_fin.slice(0, 5)} hrs
                          </span>
                        </div>
                      </td>

                      {/* Monto & Pago */}
                      <td className="p-3.5">
                        <div className="font-bold text-emerald-400">
                          ${res.monto_total} MXN
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {pago ? (
                            <span className="capitalize">
                              {pago.metodo_pago === 'card' ? '💳 Tarjeta' : '🏦 Transferencia'}
                            </span>
                          ) : (
                            <span className="text-zinc-500">Pendiente de registro</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            res.estado_reservacion === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : res.estado_reservacion === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              res.estado_reservacion === 'confirmed'
                                ? 'bg-emerald-400'
                                : res.estado_reservacion === 'pending'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          {res.estado_reservacion === 'confirmed'
                            ? 'Confirmada'
                            : res.estado_reservacion === 'pending'
                            ? 'Pendiente'
                            : 'Cancelada'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {res.estado_reservacion === 'pending' && (
                            <button
                              onClick={() => handleConfirmarPago(res)}
                              className="px-2 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                              title="Confirmar Pago / Transferencia"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Confirmar</span>
                            </button>
                          )}

                          {res.estado_reservacion !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => {
                                  setResSeleccionada(res);
                                  setIsModificarOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-[#2a3142] transition-colors"
                                title="Reprogramar Horario o Sala"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-orange-400" />
                              </button>

                              <button
                                onClick={() => {
                                  setResSeleccionada(res);
                                  setIsCancelarOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-colors"
                                title="Cancelar Reservación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <CrearReservacionModal
        isOpen={isCrearOpen}
        onClose={() => setIsCrearOpen(false)}
        onSuccess={(nueva) => {
          mostrarExito(`Reservación creada exitosamente para ${nueva.usuarios?.nombre || 'el cliente'}.`);
          cargarDatos();
        }}
      />

      <ModificarHorarioModal
        isOpen={isModificarOpen}
        onClose={() => {
          setIsModificarOpen(false);
          setResSeleccionada(null);
        }}
        onSuccess={() => {
          mostrarExito('Horario de la reservación actualizado con éxito.');
          cargarDatos();
        }}
        reservacion={resSeleccionada}
      />

      <CancelarReservacionModal
        isOpen={isCancelarOpen}
        onClose={() => {
          setIsCancelarOpen(false);
          setResSeleccionada(null);
        }}
        onSuccess={() => {
          mostrarExito('Reservación cancelada y registrada en cancelaciones y auditoría.');
          cargarDatos();
        }}
        reservacion={resSeleccionada}
      />
    </div>
  );
};
