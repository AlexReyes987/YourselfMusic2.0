/**
 * Tipos de datos para el Panel de Administración en Supabase
 * YourSelf Music 2.0
 */

export interface Sala {
  sala_id: number;
  nombre_sala: string;
  descripcion: string;
  precio_por_hora: number;
  capacidad: number;
  estado: 'active' | 'maintenance' | 'disponible' | 'mantenimiento' | string;
}

export interface Usuario {
  usuario_id: string | number;
  role_id: number;
  nombre: string;
  email: string;
  password_hash?: string;
  telefono: string;
}

export type EstadoReservacion =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'pendiente'
  | 'confirmada'
  | 'cancelada'
  | string;

export interface Reservacion {
  reservacion_id: string | number;
  usuario_id: string | number;
  sala_id: number;
  fecha_reservacion: string;
  hora_inicio: string;
  hora_fin: string;
  monto_total: number;
  estado_reservacion: EstadoReservacion;
  nombre_banda?: string;
}

export function extraerNombreBandaDeTexto(texto?: string | null): string | null {
  if (!texto) return null;
  const match = texto.match(/\[BANDA:\s*([^\]]+)\]/i);
  return match && match[1] ? match[1].trim() : null;
}

export function obtenerNombreBanda(res?: ReservacionCompleta | null): string {
  if (!res) return 'Banda';
  if (res.nombre_banda && res.nombre_banda.trim()) {
    return res.nombre_banda.trim();
  }
  if (res.pagos && res.pagos.length > 0) {
    for (const p of res.pagos) {
      const extraido = extraerNombreBandaDeTexto(p.concepto_pago);
      if (extraido) return extraido;
    }
  }
  return res.usuarios?.nombre || 'Banda sin nombre';
}

export interface ReservacionCompleta extends Reservacion {
  usuarios?: {
    usuario_id?: string | number;
    nombre: string;
    email: string;
    telefono: string;
  } | null;
  salas?: {
    sala_id?: number;
    nombre_sala: string;
    precio_por_hora: number;
    capacidad?: number;
  } | null;
  pagos?: Array<{
    pago_id: string | number;
    monto: number;
    metodo_pago: string;
    transaccion_id: string;
    concepto_pago?: string;
    fecha_pago?: string;
  }> | null;
}

export interface Pago {
  pago_id: string | number;
  reservacion_id: string | number;
  monto: number;
  concepto_pago: string;
  metodo_pago: 'card' | 'transfer' | 'tarjeta' | 'transferencia' | string;
  transaccion_id: string;
  fecha_pago?: string;
  reservaciones?: ReservacionCompleta | null;
}

export interface Cancelacion {
  cancelacion_id: string | number;
  reservacion_id: string | number;
  fecha_cancelacion?: string;
  tarifa_multa: number;
  es_mismo_dia: boolean;
  monto_reembolsado: number;
}
