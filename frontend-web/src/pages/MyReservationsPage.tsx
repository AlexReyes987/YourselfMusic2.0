import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  reservationService,
  calcularPoliticaCancelacionLocal,
  MULTA_CANCELACION_MXN,
} from '../services/reservationService';
import { useAuth } from '../context/AuthContext';

export const MyReservationsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [adeudoInfo, setAdeudoInfo] = useState<{
    total_adeudo: number;
    detalles: Array<{
      reservacion_id: number | string;
      nombre_sala: string;
      fecha_reservacion: string;
      horario: string;
      tarifa_multa: number;
      monto_retenido: number;
      adeudo_pendiente: number;
    }>;
  }>({ total_adeudo: 0, detalles: [] });
  const [loading, setLoading] = useState(true);

  const [resToCancel, setResToCancel] = useState<any | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const [multaToPay, setMultaToPay] = useState<{
    reservacion_id: number | string;
    adeudo_pendiente: number;
    nombre_sala: string;
  } | null>(null);
  const [referenciaPagoMulta, setReferenciaPagoMulta] = useState('');
  const [isPayingMulta, setIsPayingMulta] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [resList, adeudos] = await Promise.all([
        reservationService.getMyReservations(),
        reservationService.getMiAdeudo().catch(() => ({ total_adeudo: 0, detalles: [] })),
      ]);
      setReservations(resList || []);
      setAdeudoInfo(adeudos || { total_adeudo: 0, detalles: [] });
    } catch (err) {
      console.warn('No se pudieron obtener las reservaciones:', err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmarCancelacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resToCancel) return;

    setIsCancelling(true);
    setFeedbackMsg(null);

    try {
      const id = resToCancel.reservacion_id || resToCancel.id;
      const resp = await reservationService.cancelarReservacion(
        id,
        motivoCancelacion.trim() || 'Cancelación solicitada por el cliente'
      );
      setFeedbackMsg({
        type: 'success',
        text: resp.message || 'Reservación cancelada correctamente.',
      });
      setResToCancel(null);
      setMotivoCancelacion('');
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text:
          err.response?.data?.message ||
          err.message ||
          'No fue posible cancelar la reservación.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLiquidarMulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!multaToPay) return;

    setIsPayingMulta(true);
    setFeedbackMsg(null);

    try {
      const resp = await reservationService.liquidarMulta(multaToPay.reservacion_id, {
        monto: multaToPay.adeudo_pendiente,
        metodo_pago: 'transfer',
        transaccion_id: referenciaPagoMulta.trim() || `MULTA-SPEI-${Date.now()}`,
      });
      setFeedbackMsg({
        type: 'success',
        text:
          resp.message ||
          `Saldo de $${multaToPay.adeudo_pendiente} MXN liquidado correctamente.`,
      });
      setMultaToPay(null);
      setReferenciaPagoMulta('');
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text:
          err.response?.data?.message ||
          err.message ||
          'No se pudo registrar el pago.',
      });
    } finally {
      setIsPayingMulta(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Inicia sesión para ver tus reservaciones</h2>
        <p className="text-xs text-zinc-400">
          Accede con tu cuenta para consultar tus ensayos programados y tu historial.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            state={{ from: '/my-reservations' }}
            className="inline-flex items-center px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold text-xs transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const evaluacionSeleccionada = resToCancel
    ? resToCancel.politica_cancelacion ||
      calcularPoliticaCancelacionLocal(
        resToCancel.fecha_reservacion || resToCancel.date,
        Number(resToCancel.monto_total ?? resToCancel.total_price ?? 0),
        resToCancel.estado_reservacion || resToCancel.status || 'confirmed'
      )
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Mis reservaciones</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Ensayos programados e historial de{' '}
            <strong className="text-zinc-200">{user?.name || user?.nombre || user?.email}</strong>.
          </p>
        </div>

        <Link
          to="/booking"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold transition-all"
        >
          Nueva reservación
        </Link>
      </div>

      {/* Nota discreta de política de cancelación */}
      <p className="text-xs text-zinc-400 leading-relaxed">
        <strong className="text-zinc-300">Política de cancelación:</strong> Las cancelaciones realizadas el mismo día del ensayo o un día antes generan un cargo de ${MULTA_CANCELACION_MXN}.00 MXN por toda la banda. Cancelar con 2 o más días de anticipación no tiene costo.
      </p>

      {/* Banner de Adeudo Activo por Multa de Cancelación (si existe) */}
      {adeudoInfo.total_adeudo > 0 && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              Saldo pendiente por cancelación: ${adeudoInfo.total_adeudo} MXN
            </h3>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Liquida este saldo pendiente para poder agendar una nueva reservación.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            {adeudoInfo.detalles.map((item) => (
              <div
                key={item.reservacion_id}
                className="p-3 rounded-xl bg-zinc-950/70 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-white">
                    Folio #{item.reservacion_id} • {item.nombre_sala}
                  </span>
                  <span className="text-zinc-400 block sm:inline sm:ml-2">
                    ({item.fecha_reservacion} {item.horario}) — Cargo: ${item.tarifa_multa} MXN | Retenido: ${item.monto_retenido} MXN
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-rose-400">
                    Por pagar: ${item.adeudo_pendiente} MXN
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMultaToPay({
                        reservacion_id: item.reservacion_id,
                        adeudo_pendiente: item.adeudo_pendiente,
                        nombre_sala: item.nombre_sala,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    Liquidar saldo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">
          Cargando tus reservaciones...
        </div>
      ) : reservations.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-white">Aún no tienes reservaciones registradas.</p>
          <p className="text-xs text-zinc-400">
            Elige una sala y reserva tu horario de ensayo en línea.
          </p>
          <div className="pt-2">
            <Link
              to="/booking"
              className="inline-flex items-center px-4 py-2 bg-orange-500 rounded-lg text-white text-xs font-bold hover:bg-orange-600 transition-colors"
            >
              Reservar sala
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const id = res.reservacion_id || res.id;
            const salaNombre = res.nombre_sala || `Sala ${res.sala_id}`;
            const fecha = res.fecha_reservacion || res.date;
            const hInicio = (res.hora_inicio || res.start_time || '').slice(0, 5);
            const hFin = (res.hora_fin || res.end_time || '').slice(0, 5);
            const total = Number(res.monto_total ?? res.total_price ?? 0);
            const status = res.estado_reservacion || res.status || 'pending';
            const cancelInfo =
              Array.isArray(res.cancelaciones) && res.cancelaciones.length > 0
                ? res.cancelaciones[0]
                : null;

            return (
              <div
                key={id}
                className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-white text-sm sm:text-base">
                      {salaNombre}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        status === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {status === 'confirmed'
                        ? 'Confirmada'
                        : status === 'pending'
                        ? 'Pendiente de validación'
                        : 'Cancelada'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span>Fecha: {fecha}</span>
                    <span>•</span>
                    <span className="font-mono text-zinc-300">
                      {hInicio} - {hFin} hrs
                    </span>
                    <span>•</span>
                    <span className="font-mono text-zinc-500 text-[11px]">Folio #{id}</span>
                  </div>

                  {status === 'cancelled' && cancelInfo && (
                    <div className="text-[11px] text-zinc-400 pt-1 flex flex-wrap items-center gap-3">
                      <span>
                        Cargo por cancelación:{' '}
                        <strong className={Number(cancelInfo.tarifa_multa) > 0 ? 'text-amber-400' : 'text-zinc-200'}>
                          ${cancelInfo.tarifa_multa} MXN
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Reembolso:{' '}
                        <strong className="text-zinc-200">${cancelInfo.monto_reembolsado} MXN</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end gap-2">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Total</span>
                    <span className="text-lg font-black text-white">${total} MXN</span>
                  </div>

                  {status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => {
                        setResToCancel(res);
                        setMotivoCancelacion('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-500/15 text-zinc-300 hover:text-rose-400 border border-zinc-700 hover:border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancelar reservación
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Confirmar Cancelación */}
      {resToCancel && evaluacionSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Cancelar reservación #{resToCancel.reservacion_id || resToCancel.id}
              </h3>
              <button
                type="button"
                onClick={() => setResToCancel(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarCancelacion} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <p className="font-bold text-white text-sm">
                  {resToCancel.nombre_sala || `Sala ${resToCancel.sala_id}`}
                </p>
                <p className="text-zinc-400">
                  Fecha del ensayo: <strong className="text-zinc-200">{resToCancel.fecha_reservacion}</strong> ({String(resToCancel.hora_inicio || '').slice(0, 5)} - {String(resToCancel.hora_fin || '').slice(0, 5)} hrs)
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2.5">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {evaluacionSeleccionada.explicacion}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Monto de la reservación:</span>
                    <strong className="text-white">${evaluacionSeleccionada.monto_pagado_original} MXN</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cargo por cancelación:</span>
                    <strong className={evaluacionSeleccionada.aplica_multa ? 'text-amber-400' : 'text-zinc-200'}>
                      ${evaluacionSeleccionada.tarifa_multa} MXN
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Monto a reembolsar:</span>
                    <strong className="text-emerald-400">${evaluacionSeleccionada.monto_reembolsado} MXN</strong>
                  </div>
                  {evaluacionSeleccionada.adeudo_pendiente > 0 && (
                    <div className="flex justify-between pt-1.5 border-t border-zinc-800 text-rose-300">
                      <span>Saldo pendiente por cubrir:</span>
                      <strong className="text-rose-400">${evaluacionSeleccionada.adeudo_pendiente} MXN</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-zinc-300">
                  Motivo de la cancelación (opcional)
                </label>
                <textarea
                  rows={2}
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Indica brevemente el motivo..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResToCancel(null)}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cancelando...</span>
                    </>
                  ) : (
                    <span>Confirmar cancelación</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Liquidar Multa Pendiente */}
      {multaToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Liquidar saldo pendiente
              </h3>
              <button
                type="button"
                onClick={() => setMultaToPay(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLiquidarMulta} className="p-6 space-y-4 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                Liquidación de cargo por cancelación correspondiente a la{' '}
                <strong className="text-white">{multaToPay.nombre_sala}</strong> (Folio #{multaToPay.reservacion_id}).
              </p>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">CLABE BBVA:</span>
                  <span className="font-mono font-bold text-orange-400">012 180 015482930412 8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Monto a liquidar:</span>
                  <span className="font-bold text-white text-sm">${multaToPay.adeudo_pendiente} MXN</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-zinc-300">
                  Clave de rastreo SPEI o referencia de pago
                </label>
                <input
                  type="text"
                  required
                  value={referenciaPagoMulta}
                  onChange={(e) => setReferenciaPagoMulta(e.target.value)}
                  placeholder="Ingresa la clave de rastreo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMultaToPay(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={isPayingMulta}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPayingMulta ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Confirmar pago</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
