/**
 * Mapeo estricto del esquema de base de datos en Supabase (8 tablas)
 * YourSelf Music 2.0
 */

// 1. roles
export interface Role {
  role_id: number;
  nombre_rol: 'admin' | 'client' | string;
}

export type RoleInsert = Omit<Role, 'role_id'> & { role_id?: number };
export type RoleUpdate = Partial<Role>;

// 2. usuarios
export interface Usuario {
  usuario_id: string; // UUID
  role_id: number;
  nombre: string;
  email: string;
  password_hash: string;
  telefono: string;
}

export type UsuarioInsert = Omit<Usuario, 'usuario_id'> & { usuario_id?: string };
export type UsuarioUpdate = Partial<Omit<Usuario, 'usuario_id'>>;

// 3. salas (Catálogo limitado estrictamente a 4 salas físicas)
export type EstadoSala = 'active' | 'maintenance' | 'disponible' | 'mantenimiento' | string;

export interface Sala {
  sala_id: number; // 1, 2, 3 o 4
  nombre_sala: string;
  descripcion: string;
  precio_por_hora: number;
  capacidad: number;
  estado: EstadoSala;
}

export type SalaInsert = Sala;
export type SalaUpdate = Partial<Omit<Sala, 'sala_id'>>;

// 4. horarios_disponibles
export interface HorarioDisponible {
  horario_id: number | string;
  sala_id: number;
  dia_semana: number; // 0 = Domingo, 1 = Lunes ... 6 = Sábado (o 1 a 7)
  hora_apertura: string; // Formato TIME ej: "10:00:00"
  hora_cierre: string; // Formato TIME ej: "22:00:00"
}

export type HorarioDisponibleInsert = Omit<HorarioDisponible, 'horario_id'> & {
  horario_id?: number | string;
};
export type HorarioDisponibleUpdate = Partial<Omit<HorarioDisponible, 'horario_id'>>;

// 5. reservaciones
export type EstadoReservacion =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'pendiente'
  | 'confirmada'
  | 'cancelada';

export interface Reservacion {
  reservacion_id: string; // UUID
  usuario_id: string; // UUID
  sala_id: number; // 1..4
  fecha_reservacion: string; // YYYY-MM-DD
  hora_inicio: string; // HH:00:00
  hora_fin: string; // HH:00:00
  monto_total: number;
  estado_reservacion: EstadoReservacion;
}

export type ReservacionInsert = Omit<Reservacion, 'reservacion_id'> & {
  reservacion_id?: string;
};
export type ReservacionUpdate = Partial<Omit<Reservacion, 'reservacion_id'>>;

// 6. pagos
export type MetodoPago = 'card' | 'transfer' | 'tarjeta' | 'transferencia' | string;

export interface Pago {
  pago_id: string; // UUID
  reservacion_id: string; // UUID
  monto: number;
  concepto_pago: string;
  metodo_pago: MetodoPago;
  transaccion_id: string;
  fecha_pago: string; // ISO Timestamp
}

export type PagoInsert = Omit<Pago, 'pago_id' | 'fecha_pago'> & {
  pago_id?: string;
  fecha_pago?: string;
};
export type PagoUpdate = Partial<Omit<Pago, 'pago_id'>>;

// 7. cancelaciones
export interface Cancelacion {
  cancelacion_id: string; // UUID
  reservacion_id: string; // UUID
  fecha_cancelacion: string; // ISO Timestamp
  tarifa_multa: number;
  es_mismo_dia: boolean;
  monto_reembolsado: number;
}

export type CancelacionInsert = Omit<Cancelacion, 'cancelacion_id' | 'fecha_cancelacion'> & {
  cancelacion_id?: string;
  fecha_cancelacion?: string;
};
export type CancelacionUpdate = Partial<Omit<Cancelacion, 'cancelacion_id'>>;

// 8. auditoria
export interface Auditoria {
  auditoria_id: string | number;
  usuario_id: string | null; // UUID
  accion: string;
  tabla_afectada: string;
  fecha_hora: string; // ISO Timestamp
}

export type AuditoriaInsert = Omit<Auditoria, 'auditoria_id' | 'fecha_hora'> & {
  auditoria_id?: string | number;
  fecha_hora?: string;
};
export type AuditoriaUpdate = Partial<Omit<Auditoria, 'auditoria_id'>>;

/**
 * Esquema completo de Supabase para tipado genérico del cliente
 */
export interface Database {
  public: {
    Tables: {
      roles: {
        Row: Role;
        Insert: RoleInsert;
        Update: RoleUpdate;
      };
      usuarios: {
        Row: Usuario;
        Insert: UsuarioInsert;
        Update: UsuarioUpdate;
      };
      salas: {
        Row: Sala;
        Insert: SalaInsert;
        Update: SalaUpdate;
      };
      horarios_disponibles: {
        Row: HorarioDisponible;
        Insert: HorarioDisponibleInsert;
        Update: HorarioDisponibleUpdate;
      };
      reservaciones: {
        Row: Reservacion;
        Insert: ReservacionInsert;
        Update: ReservacionUpdate;
      };
      pagos: {
        Row: Pago;
        Insert: PagoInsert;
        Update: PagoUpdate;
      };
      cancelaciones: {
        Row: Cancelacion;
        Insert: CancelacionInsert;
        Update: CancelacionUpdate;
      };
      auditoria: {
        Row: Auditoria;
        Insert: AuditoriaInsert;
        Update: AuditoriaUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

