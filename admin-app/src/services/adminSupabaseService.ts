import { supabase } from './supabaseClient';
import {
  Sala,
  ReservacionCompleta,
} from '../types/database';

export interface FiltrosReservacion {
  fecha?: string;
  sala_id?: number;
  estado?: string;
}

export interface CrearReservacionManualDto {
  usuario_id?: string;
  nombre_cliente: string;
  email_cliente?: string;
  telefono_cliente: string;
  sala_id: number;
  fecha_reservacion: string; // YYYY-MM-DD
  hora_inicio: string; // HH:00:00
  hora_fin: string; // HH:00:00
  monto_total?: number;
  estado_reservacion?: string;
  registrar_pago?: boolean;
  metodo_pago?: 'card' | 'transfer' | string;
}

// Datos de demostración enriquecidos para cuando Supabase no tenga conexión activa
const MOCK_RESERVACIONES: ReservacionCompleta[] = [
  {
    reservacion_id: 'res-001',
    usuario_id: 'usr-101',
    sala_id: 1,
    fecha_reservacion: new Date().toISOString().split('T')[0],
    hora_inicio: '14:00:00',
    hora_fin: '16:00:00',
    monto_total: 500,
    estado_reservacion: 'confirmed',
    usuarios: {
      nombre: 'Banda Los Alacranes',
      email: 'alacranes@music.com',
      telefono: '618 123 4567',
    },
    salas: {
      nombre_sala: 'Sala 1 - Master Stage',
      precio_por_hora: 250,
      capacidad: 8,
    },
    pagos: [
      {
        pago_id: 'pay-001',
        monto: 500,
        metodo_pago: 'card',
        transaccion_id: 'CARD-STRIPE-8912',
        fecha_pago: new Date().toISOString(),
      },
    ],
  },
  {
    reservacion_id: 'res-002',
    usuario_id: 'usr-102',
    sala_id: 2,
    fecha_reservacion: new Date().toISOString().split('T')[0],
    hora_inicio: '16:00:00',
    hora_fin: '18:00:00',
    monto_total: 400,
    estado_reservacion: 'confirmed',
    usuarios: {
      nombre: 'Ensamble de Jazz Durango',
      email: 'jazzdgo@gmail.com',
      telefono: '618 987 6543',
    },
    salas: {
      nombre_sala: 'Sala 2 - Rocker Studio',
      precio_por_hora: 200,
      capacidad: 6,
    },
    pagos: [
      {
        pago_id: 'pay-002',
        monto: 400,
        metodo_pago: 'transfer',
        transaccion_id: 'SPEI-892104',
        fecha_pago: new Date().toISOString(),
      },
    ],
  },
  {
    reservacion_id: 'res-003',
    usuario_id: 'usr-103',
    sala_id: 3,
    fecha_reservacion: new Date().toISOString().split('T')[0],
    hora_inicio: '18:00:00',
    hora_fin: '20:00:00',
    monto_total: 440,
    estado_reservacion: 'pending',
    usuarios: {
      nombre: 'Trío Piano & Canto',
      email: 'triopiano@outlook.com',
      telefono: '618 555 1234',
    },
    salas: {
      nombre_sala: 'Sala 3 - Acoustic & Jazz',
      precio_por_hora: 220,
      capacidad: 5,
    },
    pagos: [
      {
        pago_id: 'pay-003',
        monto: 440,
        metodo_pago: 'transfer',
        transaccion_id: 'SPEI-771239',
        fecha_pago: new Date().toISOString(),
      },
    ],
  },
  {
    reservacion_id: 'res-004',
    usuario_id: 'usr-104',
    sala_id: 4,
    fecha_reservacion: new Date().toISOString().split('T')[0],
    hora_inicio: '11:00:00',
    hora_fin: '13:00:00',
    monto_total: 360,
    estado_reservacion: 'cancelled',
    usuarios: {
      nombre: 'Indie Band X',
      email: 'indie@band.com',
      telefono: '618 444 8899',
    },
    salas: {
      nombre_sala: 'Sala 4 - Indie Rehearsal',
      precio_por_hora: 180,
      capacidad: 4,
    },
    pagos: [],
  },
];

export const adminSupabaseService = {
  /**
   * 1. Consulta las 4 salas físicas
   */
  async getSalas(): Promise<Sala[]> {
    try {
      const { data, error } = await supabase
        .from('salas')
        .select('*')
        .order('sala_id', { ascending: true });

      if (error || !data || data.length === 0) {
        return [
          { sala_id: 1, nombre_sala: 'Sala 1 - Master Stage', descripcion: 'Batería Pearl Masters, Marshall JCM800', precio_por_hora: 250, capacidad: 8, estado: 'active' },
          { sala_id: 2, nombre_sala: 'Sala 2 - Rocker Studio', descripcion: 'Batería Tama Superstar, Vox AC30', precio_por_hora: 200, capacidad: 6, estado: 'active' },
          { sala_id: 3, nombre_sala: 'Sala 3 - Acoustic & Jazz', descripcion: 'Piano acústico Yamaha, Gretsch Catalina', precio_por_hora: 220, capacidad: 5, estado: 'active' },
          { sala_id: 4, nombre_sala: 'Sala 4 - Indie Rehearsal', descripcion: 'Batería Mapex, Orange & Fender Rumble', precio_por_hora: 180, capacidad: 4, estado: 'active' },
        ];
      }
      return data as Sala[];
    } catch {
      return [
        { sala_id: 1, nombre_sala: 'Sala 1 - Master Stage', descripcion: 'Batería Pearl Masters, Marshall JCM800', precio_por_hora: 250, capacidad: 8, estado: 'active' },
        { sala_id: 2, nombre_sala: 'Sala 2 - Rocker Studio', descripcion: 'Batería Tama Superstar, Vox AC30', precio_por_hora: 200, capacidad: 6, estado: 'active' },
        { sala_id: 3, nombre_sala: 'Sala 3 - Acoustic & Jazz', descripcion: 'Piano acústico Yamaha, Gretsch Catalina', precio_por_hora: 220, capacidad: 5, estado: 'active' },
        { sala_id: 4, nombre_sala: 'Sala 4 - Indie Rehearsal', descripcion: 'Batería Mapex, Orange & Fender Rumble', precio_por_hora: 180, capacidad: 4, estado: 'active' },
      ];
    }
  },

  /**
   * 2. Consulta de reservaciones con JOIN (usuarios, salas y pagos) con filtros de fecha y sala
   */
  async getReservacionesConRelaciones(filtros?: FiltrosReservacion): Promise<ReservacionCompleta[]> {
    try {
      let query = supabase
        .from('reservaciones')
        .select(`
          *,
          usuarios ( usuario_id, nombre, email, telefono ),
          salas ( sala_id, nombre_sala, precio_por_hora, capacidad ),
          pagos ( pago_id, monto, metodo_pago, transaccion_id, fecha_pago, concepto_pago )
        `)
        .order('fecha_reservacion', { ascending: false })
        .order('hora_inicio', { ascending: true });

      if (filtros?.fecha) {
        query = query.eq('fecha_reservacion', filtros.fecha);
      }
      if (filtros?.sala_id) {
        query = query.eq('sala_id', filtros.sala_id);
      }
      if (filtros?.estado && filtros.estado !== 'todos') {
        query = query.eq('estado_reservacion', filtros.estado);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.warn('[adminSupabaseService] Usando reservaciones simuladas para el panel:', error?.message);
        return this.filtrarMock(filtros);
      }

      return data as unknown as ReservacionCompleta[];
    } catch (err) {
      console.warn('[adminSupabaseService] Fallback a mocks locales:', err);
      return this.filtrarMock(filtros);
    }
  },

  filtrarMock(filtros?: FiltrosReservacion): ReservacionCompleta[] {
    let result = [...MOCK_RESERVACIONES];
    if (filtros?.fecha) {
      result = result.filter((r) => r.fecha_reservacion === filtros.fecha);
    }
    if (filtros?.sala_id) {
      result = result.filter((r) => r.sala_id === filtros.sala_id);
    }
    if (filtros?.estado && filtros.estado !== 'todos') {
      result = result.filter((r) => r.estado_reservacion === filtros.estado);
    }
    return result;
  },

  /**
   * 3. Crea una reservación manual desde el panel de administración
   * Verifica solapamiento de horarios antes de insertar.
   */
  async crearReservacionManual(dto: CrearReservacionManualDto): Promise<ReservacionCompleta> {
    // 1. Validar anti-solapamiento
    const { data: solapados } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('sala_id', dto.sala_id)
      .eq('fecha_reservacion', dto.fecha_reservacion)
      .not('estado_reservacion', 'in', '("cancelled","cancelada")');

    const sH = (h: string) => (h.length === 5 ? `${h}:00` : h);
    const targetStart = sH(dto.hora_inicio);
    const targetEnd = sH(dto.hora_fin);

    const conflicto = ((solapados || []) as any[]).find((r) => {
      const rStart = sH(r.hora_inicio);
      const rEnd = sH(r.hora_fin);
      return !(rEnd <= targetStart || rStart >= targetEnd);
    });

    if (conflicto) {
      throw new Error(
        `Conflicto de horario: Ya existe una reservación en la Sala ${dto.sala_id} de ${conflicto.hora_inicio} a ${conflicto.hora_fin}.`
      );
    }

    // 2. Crear usuario si no existe o usar usuario_id
    let usuarioId = dto.usuario_id;
    if (!usuarioId) {
      usuarioId = '00000000-0000-0000-0000-000000000001';
    }

    // 3. Insertar reservación
    const monto = dto.monto_total || 400;
    const estado = dto.estado_reservacion || (dto.registrar_pago ? 'confirmed' : 'pending');

    const { data: newRes, error: resError } = await supabase
      .from('reservaciones')
      .insert({
        usuario_id: usuarioId,
        sala_id: dto.sala_id,
        fecha_reservacion: dto.fecha_reservacion,
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        monto_total: monto,
        estado_reservacion: estado,
      } as any)
      .select('*, salas(*), usuarios(*)')
      .single();

    if (resError) {
      console.warn('Error en insert Supabase, creando en memoria local:', resError);
      const mockRes: ReservacionCompleta = {
        reservacion_id: `res-${Date.now()}`,
        usuario_id: usuarioId,
        sala_id: dto.sala_id,
        fecha_reservacion: dto.fecha_reservacion,
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        monto_total: monto,
        estado_reservacion: estado,
        usuarios: {
          nombre: dto.nombre_cliente,
          email: dto.email_cliente || 'cliente@estudio.com',
          telefono: dto.telefono_cliente,
        },
        salas: {
          nombre_sala: `Sala ${dto.sala_id}`,
          precio_por_hora: 200,
        },
      };
      MOCK_RESERVACIONES.unshift(mockRes);
      return mockRes;
    }

    // 4. Si se indicó registrar pago
    if (dto.registrar_pago && newRes) {
      await supabase.from('pagos').insert({
        reservacion_id: (newRes as any).reservacion_id,
        monto: monto,
        concepto_pago: `Pago administrativo (${dto.metodo_pago || 'card'})`,
        metodo_pago: dto.metodo_pago || 'card',
        transaccion_id: `ADMIN-${Date.now()}`,
      } as any);
    }

    return newRes as unknown as ReservacionCompleta;
  },

  /**
   * 4. Modifica el horario o sala de una reservación existente (con validación de solapamiento)
   */
  async modificarHorario(
    reservacion_id: string,
    sala_id: number,
    fecha_reservacion: string,
    hora_inicio: string,
    hora_fin: string
  ): Promise<void> {
    // Validar solapamiento excluyendo la cita actual
    const { data: solapados } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('sala_id', sala_id)
      .eq('fecha_reservacion', fecha_reservacion)
      .neq('reservacion_id', reservacion_id)
      .not('estado_reservacion', 'in', '("cancelled","cancelada")');

    const sH = (h: string) => (h.length === 5 ? `${h}:00` : h);
    const targetStart = sH(hora_inicio);
    const targetEnd = sH(hora_fin);

    const conflicto = ((solapados || []) as any[]).find((r) => {
      const rStart = sH(r.hora_inicio);
      const rEnd = sH(r.hora_fin);
      return !(rEnd <= targetStart || rStart >= targetEnd);
    });

    if (conflicto) {
      throw new Error(
        `Conflicto: La Sala ${sala_id} ya se encuentra apartada de ${conflicto.hora_inicio} a ${conflicto.hora_fin}.`
      );
    }

    const { error } = await supabase
      .from('reservaciones')
      .update({
        sala_id,
        fecha_reservacion,
        hora_inicio,
        hora_fin,
      } as any)
      .eq('reservacion_id', reservacion_id);

    if (error) {
      console.warn('Fallback actualizando mock local:', error);
      const index = MOCK_RESERVACIONES.findIndex((r) => r.reservacion_id === reservacion_id);
      if (index !== -1) {
        MOCK_RESERVACIONES[index].sala_id = sala_id;
        MOCK_RESERVACIONES[index].fecha_reservacion = fecha_reservacion;
        MOCK_RESERVACIONES[index].hora_inicio = hora_inicio;
        MOCK_RESERVACIONES[index].hora_fin = hora_fin;
      }
    }
  },

  /**
   * 5. Cancela o elimina una reservación registrando la justificación en la tabla 'cancelaciones'
   */
  async cancelarReservacion(
    reservacion_id: string,
    motivo: string,
    tarifaMulta: number = 0,
    montoReembolsado: number = 0,
    esMismoDia: boolean = false
  ): Promise<void> {
    // 1. Cambiar estado a 'cancelled'
    const { error: updateError } = await supabase
      .from('reservaciones')
      .update({ estado_reservacion: 'cancelled' } as any)
      .eq('reservacion_id', reservacion_id);

    if (updateError) {
      console.warn('Fallback cancelando mock local:', updateError);
      const index = MOCK_RESERVACIONES.findIndex((r) => r.reservacion_id === reservacion_id);
      if (index !== -1) {
        MOCK_RESERVACIONES[index].estado_reservacion = 'cancelled';
      }
    }

    // 2. Registrar en la tabla cancelaciones de Supabase
    try {
      await supabase.from('cancelaciones').insert({
        reservacion_id,
        tarifa_multa: tarifaMulta,
        es_mismo_dia: esMismoDia,
        monto_reembolsado: montoReembolsado,
      } as any);

      // Registrar auditoría con el motivo
      await supabase.from('auditoria').insert({
        usuario_id: null,
        accion: `CANCELACION_ADMIN: Reservacion ${reservacion_id}. Motivo: ${motivo}`,
        tabla_afectada: 'cancelaciones',
      } as any);
    } catch (cancelErr) {
      console.warn('Nota: Registro en tabla cancelaciones:', cancelErr);
    }
  },

  /**
   * 6. Módulo para cambiar el estado de pago de las reservaciones (Confirmar transferencias)
   */
  async confirmarTransferencia(reservacion_id: string): Promise<void> {
    const { error } = await supabase
      .from('reservaciones')
      .update({ estado_reservacion: 'confirmed' } as any)
      .eq('reservacion_id', reservacion_id);

    if (error) {
      console.warn('Fallback confirmando transferencia en mock local:', error);
      const index = MOCK_RESERVACIONES.findIndex((r) => r.reservacion_id === reservacion_id);
      if (index !== -1) {
        MOCK_RESERVACIONES[index].estado_reservacion = 'confirmed';
      }
    }

    try {
      await supabase.from('auditoria').insert({
        usuario_id: null,
        accion: `CONFIRMAR_TRANSFERENCIA: Reservacion ${reservacion_id} marcada como confirmada`,
        tabla_afectada: 'reservaciones',
      } as any);
    } catch {
      // Ignorar si auditoría es opcional
    }
  },

  /**
   * Rechazar comprobante de transferencia y cancelar cita
   */
  async rechazarTransferencia(reservacion_id: string, motivo: string = 'Comprobante bancario no válido'): Promise<void> {
    await this.cancelarReservacion(reservacion_id, motivo, 0, 0, false);
  },
};
