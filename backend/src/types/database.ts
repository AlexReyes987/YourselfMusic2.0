/**
 * Mapeo estricto del esquema de base de datos en Supabase (8 tablas)
 * YourSelf Music 2.0 - Sistema de Gestión y Reservaciones
 */

// ============================================================================
// Tipos auxiliares y enums de dominio
// ============================================================================

export type NombreRol = 'admin' | 'cliente' | 'client' | string;

export type EstadoSala =
  | 'activa'
  | 'mantenimiento'
  | 'inactiva'
  | 'active'
  | 'maintenance'
  | 'disponible'
  | string;

export type EstadoReservacion =
  | 'pendiente'
  | 'confirmada'
  | 'cancelada'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | string;

export type MetodoPago =
  | 'tarjeta'
  | 'transferencia'
  | 'efectivo'
  | 'card'
  | 'transfer'
  | string;

// ============================================================================
// 1. roles: role_id, nombre_rol
// ============================================================================
export type Role = {
  role_id: number;
  nombre_rol: NombreRol;
};

export type RoleInsert = {
  role_id?: number;
  nombre_rol: NombreRol;
};

export type RoleUpdate = {
  role_id?: number;
  nombre_rol?: NombreRol;
};

// ============================================================================
// 2. usuarios: usuario_id, role_id, nombre, email, password_hash, telefono
// ============================================================================
export type Usuario = {
  usuario_id: string; // UUID
  role_id: number;
  nombre: string;
  email: string;
  password_hash: string;
  telefono: string;
};

export type UsuarioInsert = {
  usuario_id?: string;
  role_id: number;
  nombre: string;
  email: string;
  password_hash: string;
  telefono: string;
};

export type UsuarioUpdate = {
  usuario_id?: string;
  role_id?: number;
  nombre?: string;
  email?: string;
  password_hash?: string;
  telefono?: string;
};

// ============================================================================
// 3. salas: sala_id, nombre_sala, descripcion, precio_por_hora, capacidad, estado
// Catálogo delimitado estrictamente a 4 salas físicas según PROJECT_CONTEXT.md
// ============================================================================
export type Sala = {
  sala_id: number; // 1, 2, 3 o 4
  nombre_sala: string;
  descripcion: string;
  precio_por_hora: number;
  capacidad: number;
  estado: EstadoSala;
};

export type SalaInsert = {
  sala_id: number;
  nombre_sala: string;
  descripcion: string;
  precio_por_hora: number;
  capacidad: number;
  estado?: EstadoSala;
};

export type SalaUpdate = {
  sala_id?: number;
  nombre_sala?: string;
  descripcion?: string;
  precio_por_hora?: number;
  capacidad?: number;
  estado?: EstadoSala;
};

// ============================================================================
// 4. horarios_disponibles: horario_id, sala_id, dia_semana, hora_apertura, hora_cierre
// ============================================================================
export type HorarioDisponible = {
  horario_id: number | string;
  sala_id: number;
  dia_semana: number; // 0 = Domingo ... 6 = Sábado
  hora_apertura: string; // TIME (ej. "09:00:00")
  hora_cierre: string; // TIME (ej. "22:00:00")
};

export type HorarioDisponibleInsert = {
  horario_id?: number | string;
  sala_id: number;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
};

export type HorarioDisponibleUpdate = {
  horario_id?: number | string;
  sala_id?: number;
  dia_semana?: number;
  hora_apertura?: string;
  hora_cierre?: string;
};

// ============================================================================
// 5. reservaciones: reservacion_id, usuario_id, sala_id, fecha_reservacion,
//    hora_inicio, hora_fin, monto_total, estado_reservacion
// ============================================================================
export type Reservacion = {
  reservacion_id: string; // UUID
  usuario_id: string; // UUID
  sala_id: number; // 1..4
  fecha_reservacion: string; // DATE YYYY-MM-DD
  hora_inicio: string; // TIME HH:00:00
  hora_fin: string; // TIME HH:00:00
  monto_total: number;
  estado_reservacion: EstadoReservacion;
};

export type ReservacionInsert = {
  reservacion_id?: string;
  usuario_id: string;
  sala_id: number;
  fecha_reservacion: string;
  hora_inicio: string;
  hora_fin: string;
  monto_total: number;
  estado_reservacion?: EstadoReservacion;
};

export type ReservacionUpdate = {
  reservacion_id?: string;
  usuario_id?: string;
  sala_id?: number;
  fecha_reservacion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  monto_total?: number;
  estado_reservacion?: EstadoReservacion;
};

// ============================================================================
// 6. pagos: pago_id, reservacion_id, monto, concepto_pago, metodo_pago,
//    transaccion_id, fecha_pago
// ============================================================================
export type Pago = {
  pago_id: string; // UUID
  reservacion_id: string; // UUID
  monto: number;
  concepto_pago: string;
  metodo_pago: MetodoPago;
  transaccion_id: string;
  fecha_pago: string; // ISO Timestamp
};

export type PagoInsert = {
  pago_id?: string;
  reservacion_id: string;
  monto: number;
  concepto_pago: string;
  metodo_pago: MetodoPago;
  transaccion_id: string;
  fecha_pago?: string;
};

export type PagoUpdate = {
  pago_id?: string;
  reservacion_id?: string;
  monto?: number;
  concepto_pago?: string;
  metodo_pago?: MetodoPago;
  transaccion_id?: string;
  fecha_pago?: string;
};

// ============================================================================
// 7. cancelaciones: cancelacion_id, reservacion_id, fecha_cancelacion,
//    tarifa_multa, es_mismo_dia, monto_reembolsado
// ============================================================================
export type Cancelacion = {
  cancelacion_id: string; // UUID
  reservacion_id: string; // UUID
  fecha_cancelacion: string; // ISO Timestamp
  tarifa_multa: number;
  es_mismo_dia: boolean;
  monto_reembolsado: number;
};

export type CancelacionInsert = {
  cancelacion_id?: string;
  reservacion_id: string;
  fecha_cancelacion?: string;
  tarifa_multa: number;
  es_mismo_dia: boolean;
  monto_reembolsado: number;
};

export type CancelacionUpdate = {
  cancelacion_id?: string;
  reservacion_id?: string;
  fecha_cancelacion?: string;
  tarifa_multa?: number;
  es_mismo_dia?: boolean;
  monto_reembolsado?: number;
};

// ============================================================================
// 8. auditoria: auditoria_id, usuario_id, accion, tabla_afectada, fecha_hora
// ============================================================================
export type Auditoria = {
  auditoria_id: string | number;
  usuario_id: string | null; // UUID o null si es acción de sistema
  accion: string;
  tabla_afectada: string;
  fecha_hora: string; // ISO Timestamp
};

export type AuditoriaInsert = {
  auditoria_id?: string | number;
  usuario_id?: string | null;
  accion: string;
  tabla_afectada: string;
  fecha_hora?: string;
};

export type AuditoriaUpdate = {
  auditoria_id?: string | number;
  usuario_id?: string | null;
  accion?: string;
  tabla_afectada?: string;
  fecha_hora?: string;
};

// ============================================================================
// Esquema global Database para @supabase/supabase-js
// ============================================================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: Role;
        Insert: RoleInsert;
        Update: RoleUpdate;
        Relationships: [];
      };
      usuarios: {
        Row: Usuario;
        Insert: UsuarioInsert;
        Update: UsuarioUpdate;
        Relationships: [];
      };
      salas: {
        Row: Sala;
        Insert: SalaInsert;
        Update: SalaUpdate;
        Relationships: [];
      };
      horarios_disponibles: {
        Row: HorarioDisponible;
        Insert: HorarioDisponibleInsert;
        Update: HorarioDisponibleUpdate;
        Relationships: [];
      };
      reservaciones: {
        Row: Reservacion;
        Insert: ReservacionInsert;
        Update: ReservacionUpdate;
        Relationships: [];
      };
      pagos: {
        Row: Pago;
        Insert: PagoInsert;
        Update: PagoUpdate;
        Relationships: [];
      };
      cancelaciones: {
        Row: Cancelacion;
        Insert: CancelacionInsert;
        Update: CancelacionUpdate;
        Relationships: [];
      };
      auditoria: {
        Row: Auditoria;
        Insert: AuditoriaInsert;
        Update: AuditoriaUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Helpers para tipado rápido de filas, inserciones y actualizaciones
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
