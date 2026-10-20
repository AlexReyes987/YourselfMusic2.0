/**
 * Tipos de datos para el Frontend Web de YourSelf Music 2.0
 * Mapeo con el backend y las 8 tablas de Supabase
 */

export interface Sala {
  sala_id: number; // 1, 2, 3 o 4
  nombre_sala: string;
  descripcion: string;
  precio_por_hora: number;
  capacidad: number;
  estado: 'active' | 'maintenance' | 'disponible' | 'mantenimiento' | string;
}

// Alias para compatibilidad
export type Room = Sala;

export interface RangoLibre {
  hora_inicio: string;
  hora_fin: string;
}

export interface DisponibilidadResponse {
  sala_id: number;
  nombre_sala: string;
  fecha: string;
  horario_operativo: {
    hora_apertura: string;
    hora_cierre: string;
  };
  horas_libres: number[];
  rangos_libres: RangoLibre[];
  reservaciones_ocupadas: Array<{
    reservacion_id: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
  }>;
}

export interface Reservacion {
  reservacion_id: string;
  usuario_id: string;
  sala_id: number;
  fecha_reservacion: string;
  hora_inicio: string;
  hora_fin: string;
  monto_total: number;
  estado_reservacion: 'pending' | 'confirmed' | 'cancelled' | string;
  nombre_sala?: string;
}

// Alias para compatibilidad
export type Reservation = Reservacion;

export interface Pago {
  pago_id: string;
  reservacion_id: string;
  monto: number;
  concepto_pago: string;
  metodo_pago: 'card' | 'transfer' | 'tarjeta' | 'transferencia' | string;
  transaccion_id: string;
  fecha_pago: string;
}

export interface CreateReservationDto {
  usuario_id?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  sala_id: number;
  fecha_reservacion: string;
  hora_inicio: string;
  hora_fin: string;
  monto_total?: number;
  pago?: {
    metodo_pago: 'card' | 'transfer';
    monto?: number;
    concepto_pago?: string;
    transaccion_id?: string;
  };
}

export interface User {
  id: string;
  usuario_id?: string;
  name: string;
  nombre?: string;
  email: string;
  phone?: string;
  telefono?: string;
  role: 'client' | 'admin';
}
