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
  usuario_id: string;
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
  reservacion_id: string;
  usuario_id: string;
  sala_id: number;
  fecha_reservacion: string;
  hora_inicio: string;
  hora_fin: string;
  monto_total: number;
  estado_reservacion: EstadoReservacion;
}

export interface ReservacionCompleta extends Reservacion {
  usuarios?: {
    usuario_id?: string;
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
    pago_id: string;
    monto: number;
    metodo_pago: string;
    transaccion_id: string;
    concepto_pago?: string;
    fecha_pago?: string;
  }> | null;
}

export interface Pago {
  pago_id: string;
  reservacion_id: string;
  monto: number;
  concepto_pago: string;
  metodo_pago: 'card' | 'transfer' | 'tarjeta' | 'transferencia' | string;
  transaccion_id: string;
  fecha_pago?: string;
  reservaciones?: ReservacionCompleta | null;
}

export interface Cancelacion {
  cancelacion_id: string;
  reservacion_id: string;
  fecha_cancelacion?: string;
  tarifa_multa: number;
  es_mismo_dia: boolean;
  monto_reembolsado: number;
}

