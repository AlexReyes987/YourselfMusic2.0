import { api } from './api';
import { Reservacion, DisponibilidadResponse, CreateReservationDto } from '../types';

export const MULTA_CANCELACION_MXN = 105;

export interface EvaluacionCancelacionCliente {
  fecha_hoy: string;
  fecha_reservacion: string;
  dias_anticipacion: number;
  es_mismo_dia: boolean;
  es_un_dia_antes: boolean;
  aplica_multa: boolean;
  tarifa_multa: number;
  monto_pagado_original: number;
  monto_retenido: number;
  monto_reembolsado: number;
  adeudo_pendiente: number;
  explicacion: string;
}

/**
 * Calcula en el cliente la política oficial de cancelación de YourSelf Music:
 * - Si se cancela el MISMO DÍA del ensayo (dias_anticipacion === 0) o UN DÍA ANTES (dias_anticipacion === 1),
 *   se cobra una multa fija de $105.00 MXN en total por toda la banda.
 * - Si se cancela con 2 o más días de anticipación (dias_anticipacion >= 2), la multa es $0 MXN.
 */
export function calcularPoliticaCancelacionLocal(
  fechaReservacion: string,
  montoTotal: number,
  estadoReservacion: string = 'confirmed'
): EvaluacionCancelacionCliente {
  const hoyStr = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Mexico_City',
  });

  const [yR, mR, dR] = String(fechaReservacion).slice(0, 10).split('-').map(Number);
  const [yH, mH, dH] = hoyStr.split('-').map(Number);

  const utcReserva = Date.UTC(yR, (mR || 1) - 1, dR || 1);
  const utcHoy = Date.UTC(yH, (mH || 1) - 1, dH || 1);
  const diasAnticipacion = Math.round((utcReserva - utcHoy) / (1000 * 60 * 60 * 24));

  const esMismoDia = diasAnticipacion === 0;
  const esUnDiaAntes = diasAnticipacion === 1;
  const aplicaMulta = esMismoDia || esUnDiaAntes;
  const tarifaMulta = aplicaMulta ? MULTA_CANCELACION_MXN : 0;

  const montoPagadoOriginal = estadoReservacion === 'confirmed' ? Number(montoTotal || 0) : 0;
  const montoRetenido = Math.min(montoPagadoOriginal, tarifaMulta);
  const montoReembolsado = Math.max(0, montoPagadoOriginal - tarifaMulta);
  const adeudoPendiente = Math.max(0, tarifaMulta - montoRetenido);

  return {
    fecha_hoy: hoyStr,
    fecha_reservacion: fechaReservacion,
    dias_anticipacion: diasAnticipacion,
    es_mismo_dia: esMismoDia,
    es_un_dia_antes: esUnDiaAntes,
    aplica_multa: aplicaMulta,
    tarifa_multa: tarifaMulta,
    monto_pagado_original: montoPagadoOriginal,
    monto_retenido: montoRetenido,
    monto_reembolsado: montoReembolsado,
    adeudo_pendiente: adeudoPendiente,
    explicacion: aplicaMulta
      ? esMismoDia
        ? 'Cancelación el mismo día del ensayo: Aplica una multa fija de $105.00 MXN en total por toda la banda.'
        : 'Cancelación 1 día antes del ensayo: Aplica una multa fija de $105.00 MXN en total por toda la banda.'
      : 'Cancelación con 2 o más días de anticipación: Sin cargo de multa ($0.00 MXN).',
  };
}

export const reservationService = {
  /**
   * Consulta la disponibilidad en tiempo real de una sala para una fecha específica.
   * Retorna horas libres, rangos libres y citas ocupadas.
   */
  async getDisponibilidad(salaId: number, fecha: string): Promise<DisponibilidadResponse> {
    const response = await api.get(`/reservaciones/disponibilidad?sala_id=${salaId}&fecha=${fecha}`);
    return response.data.data;
  },

  /**
   * Crea una nueva reservación y registra el pago (tarjeta/transferencia)
   * con validación anti-solapamiento en servidor.
   */
  async create(data: CreateReservationDto): Promise<{ reservacion: Reservacion; pago?: any }> {
    const response = await api.post('/reservaciones', data);
    return response.data.data;
  },

  /**
   * Obtiene las reservaciones del usuario autenticado
   */
  async getMyReservations(): Promise<any[]> {
    const response = await api.get('/reservaciones/my-reservations');
    return response.data.data;
  },

  /**
   * Consulta si el usuario autenticado tiene adeudos pendientes por multas de cancelación ($105 MXN)
   */
  async getMiAdeudo(): Promise<{
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
  }> {
    const response = await api.get('/reservaciones/mi-adeudo');
    return response.data.data;
  },

  /**
   * Cancela una reservación aplicando la política oficial de multa de $105 MXN
   */
  async cancelarReservacion(reservacionId: string | number, motivo?: string) {
    const response = await api.post(`/reservaciones/${reservacionId}/cancelar`, { motivo });
    return response.data;
  },

  /**
   * Liquida una multa pendiente de cancelación
   */
  async liquidarMulta(
    reservacionId: string | number,
    payload: { monto: number; metodo_pago: 'card' | 'transfer'; transaccion_id?: string }
  ) {
    const response = await api.post(`/reservaciones/${reservacionId}/liquidar-multa`, payload);
    return response.data;
  },

  /**
   * Obtiene reservaciones por fecha
   */
  async getByDate(date: string): Promise<Reservacion[]> {
    const response = await api.get(`/reservaciones/by-date?date=${date}`);
    return response.data.data;
  },
};
