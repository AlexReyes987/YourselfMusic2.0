/**
 * Mapeo estricto del esquema de base de datos en Supabase (8 tablas)
 * YourSelf Music 2.0
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// 1. roles
export interface Role {
  role_id: number;
  nombre_rol: 'admin' | 'client' | string;
}

export type RoleInsert = {
  role_id?: number;
  nombre_rol: string;
};
export type RoleUpdate = Partial<RoleInsert>;

// 2. usuarios
export interface Usuario {
  usuario_id: string; // UUID
  role_id: number;
  nombre: string;
  email: string;
  password_hash: string;
  telefono: string;
}

export type UsuarioInsert = {
  usuario_id?: string;
  role_id: number;
  nombre: string;
  email: string;
  password_hash: string;
  telefono: string;
};
export type UsuarioUpdate = Partial<UsuarioInsert>;

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

export type SalaInsert = {
  sala_id: number;
  nombre_sala: string;
  descripcion: string;
  precio_por_hora: number;
  capacidad: number;
  estado: EstadoSala;
};
export type SalaUpdate = Partial<SalaInsert>;

// 4. horarios_disponibles
export interface HorarioDisponible {
  horario_id: number | string;
  sala_id: number;
  dia_semana: number; // 0 = Domingo, 1 = Lunes ... 6 = Sábado
  hora_apertura: string; // TIME ej: "10:00:00"
  hora_cierre: string; // TIME ej: "22:00:00"
}

export type HorarioDisponibleInsert = {
  horario_id?: number | string;
  sala_id: number;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
};
export type HorarioDisponibleUpdate = Partial<HorarioDisponibleInsert>;

// 5. reservaciones
export type EstadoReservacion =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'pendiente'
  | 'confirmada'
  | 'cancelada'
  | string;

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
export type ReservacionUpdate = Partial<ReservacionInsert>;

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

export type PagoInsert = {
  pago_id?: string;
  reservacion_id: string;
  monto: number;
  concepto_pago: string;
  metodo_pago: MetodoPago;
  transaccion_id: string;
  fecha_pago?: string;
};
export type PagoUpdate = Partial<PagoInsert>;

// 7. cancelaciones
export interface Cancelacion {
  cancelacion_id: string; // UUID
  reservacion_id: string; // UUID
  fecha_cancelacion: string; // ISO Timestamp
  tarifa_multa: number;
  es_mismo_dia: boolean;
  monto_reembolsado: number;
}

export type CancelacionInsert = {
  cancelacion_id?: string;
  reservacion_id: string;
  fecha_cancelacion?: string;
  tarifa_multa: number;
  es_mismo_dia: boolean;
  monto_reembolsado: number;
};
export type CancelacionUpdate = Partial<CancelacionInsert>;

// 8. auditoria
export interface Auditoria {
  auditoria_id: string | number;
  usuario_id: string | null; // UUID
  accion: string;
  tabla_afectada: string;
  fecha_hora: string; // ISO Timestamp
}

export type AuditoriaInsert = {
  auditoria_id?: string | number;
  usuario_id: string | null;
  accion: string;
  tabla_afectada: string;
  fecha_hora?: string;
};
export type AuditoriaUpdate = Partial<AuditoriaInsert>;

/**
 * Esquema completo de Supabase v2 para tipado genérico del cliente
 */
export interface Database {
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
        Relationships: [
          {
            foreignKeyName: "usuarios_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["role_id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "horarios_disponibles_sala_id_fkey";
            columns: ["sala_id"];
            isOneToOne: false;
            referencedRelation: "salas";
            referencedColumns: ["sala_id"];
          }
        ];
      };
      reservaciones: {
        Row: Reservacion;
        Insert: ReservacionInsert;
        Update: ReservacionUpdate;
        Relationships: [
          {
            foreignKeyName: "reservaciones_sala_id_fkey";
            columns: ["sala_id"];
            isOneToOne: false;
            referencedRelation: "salas";
            referencedColumns: ["sala_id"];
          },
          {
            foreignKeyName: "reservaciones_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["usuario_id"];
          }
        ];
      };
      pagos: {
        Row: Pago;
        Insert: PagoInsert;
        Update: PagoUpdate;
        Relationships: [
          {
            foreignKeyName: "pagos_reservacion_id_fkey";
            columns: ["reservacion_id"];
            isOneToOne: false;
            referencedRelation: "reservaciones";
            referencedColumns: ["reservacion_id"];
          }
        ];
      };
      cancelaciones: {
        Row: Cancelacion;
        Insert: CancelacionInsert;
        Update: CancelacionUpdate;
        Relationships: [
          {
            foreignKeyName: "cancelaciones_reservacion_id_fkey";
            columns: ["reservacion_id"];
            isOneToOne: false;
            referencedRelation: "reservaciones";
            referencedColumns: ["reservacion_id"];
          }
        ];
      };
      auditoria: {
        Row: Auditoria;
        Insert: AuditoriaInsert;
        Update: AuditoriaUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
