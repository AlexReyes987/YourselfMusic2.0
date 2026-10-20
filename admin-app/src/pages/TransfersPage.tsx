import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, RotateCcw, AlertTriangle, Loader2, DollarSign, Calendar, Music } from 'lucide-react';
import { adminSupabaseService } from '../services/adminSupabaseService';
import { ReservacionCompleta } from '../types/database';

export const TransfersPage: React.FC = () => {
  const [reservaciones, setReservaciones] = useState<ReservacionCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  
  // Modal de rechazo
  const [rechazoModalOpen, setRechazoModalOpen] = useState(false);
  const [resARechazar, setResARechazar] = useState<ReservacionCompleta | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('Comprobante SPEI no coincide con el estado de cuenta bancario.');
  const [isProcessing, setIsProcessing] = useState(false);

  const cargarTransferencias = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSupabaseService.getReservacionesConRelaciones();
      // Filtrar reservaciones que tengan pago por transferencia o estén pendientes de validación
      const transferencias = data.filter((r) => {
        const metodoPago = r.pagos?.[0]?.metodo_pago;
        return metodoPago === 'transfer' || r.estado_reservacion === 'pending';
      });
      setReservaciones(transferencias);
    } catch (err) {
      console.error('Error al cargar transferencias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTransferencias();
  }, [cargarTransferencias]);

  const showFeedback = (tipo: 'success' | 'error', texto: string) => {
    setMessage({ tipo, texto });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleApprove = async (res: ReservacionCompleta) => {
    setIsProcessing(true);
    try {
      await adminSupabaseService.confirmarTransferencia(res.reservacion_id);
      showFeedback('success', `Transferencia para la reserva ${res.reservacion_id.slice(0, 8)} aprobada con éxito. Estado actualizado a "Confirmada".`);
      await cargarTransferencias();
    } catch (err: any) {
      showFeedback('error', `Error al aprobar: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmarRechazo = async () => {
    if (!resARechazar) return;
    setIsProcessing(true);
    try {
      await adminSupabaseService.rechazarTransferencia(resARechazar.reservacion_id, motivoRechazo);
      showFeedback('success', `Comprobante rechazado y reservación cancelada.`);
      setRechazoModalOpen(false);
      setResARechazar(null);
      await cargarTransferencias();
    } catch (err: any) {
      showFeedback('error', `Error al rechazar: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendientes = reservaciones.filter((r) => r.estado_reservacion === 'pending');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Validación de Pagos y Transferencias Bancarias
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Revisión de depósitos y transferencias SPEI. Al aprobar, la reservación pasa inmediatamente a "Confirmada".
          </p>
        </div>

        <button
          onClick={() => cargarTransferencias()}
          className="p-2 rounded-xl bg-[#181b24] hover:bg-zinc-800 border border-[#2a3142] text-zinc-300 hover:text-white transition-colors"
          title="Recargar pagos"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            message.tipo === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.tipo === 'success' ? (
            <ShieldCheck className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.texto}</span>
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="border border-[#2a3142] rounded-2xl bg-[#181b24] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Depósitos y Transferencias Registradas</h3>
          <span className="text-xs text-zinc-400">
            Pendientes por validar:{' '}
            <strong className="text-amber-400 font-bold">{pendientes.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1f2430] border-b border-[#2a3142] text-zinc-400 font-semibold">
                <th className="p-3.5">Ref. Rastreo</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Sala & Fecha</th>
                <th className="p-3.5">Monto</th>
                <th className="p-3.5">Estado Pago</th>
                <th className="p-3.5 text-center">Acciones Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3142]/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                    <span>Cargando transferencias de Supabase...</span>
                  </td>
                </tr>
              ) : reservaciones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No hay comprobantes de transferencia pendientes de validar.
                  </td>
                </tr>
              ) : (
                reservaciones.map((item) => {
                  const pago = item.pagos?.[0];
                  const ref = pago?.transaccion_id || `SPEI-${item.reservacion_id.slice(0, 6)}`;
                  const clienteNombre = item.usuarios?.nombre || 'Cliente';
                  const salaNombre = item.salas?.nombre_sala || `Sala ${item.sala_id}`;
                  const isPending = item.estado_reservacion === 'pending';

                  return (
                    <tr key={item.reservacion_id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-orange-400">{ref}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{clienteNombre}</div>
                        <div className="text-[11px] text-zinc-500">{item.usuarios?.telefono || item.usuarios?.email}</div>
                      </td>
                      <td className="p-3.5 text-zinc-300">
                        <div className="font-medium flex items-center gap-1">
                          <Music className="w-3 h-3 text-orange-400" />
                          <span>{salaNombre}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>
                            {item.fecha_reservacion} ({item.hora_inicio.slice(0, 5)} - {item.hora_fin.slice(0, 5)})
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400">${item.monto_total} MXN</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            item.estado_reservacion === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : item.estado_reservacion === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {item.estado_reservacion === 'confirmed'
                            ? 'Aprobada / Confirmada'
                            : item.estado_reservacion === 'pending'
                            ? 'Por Validar'
                            : 'Rechazada / Cancelada'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(item)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-700/20 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobar SPEI</span>
                            </button>
                            <button
                              onClick={() => {
                                setResARechazar(item);
                                setRechazoModalOpen(true);
                              }}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px] italic">Validado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Rechazar Comprobante */}
      {rechazoModalOpen && resARechazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#181b24] border border-[#2a3142] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Rechazar Comprobante de Pago</span>
            </div>
            <p className="text-xs text-zinc-300">
              Esta acción cancelará la reservación de{' '}
              <strong className="text-white">{resARechazar.usuarios?.nombre || 'Cliente'}</strong> y liberará el espacio en la Sala {resARechazar.sala_id}.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Motivo del Rechazo:</label>
              <textarea
                rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white resize-none focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2a3142]">
              <button
                onClick={() => setRechazoModalOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Volver
              </button>
              <button
                onClick={confirmarRechazo}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Confirmar Rechazo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
