import { supabaseAdmin as supabase } from '../config/supabaseClient.js';
import {
  Sala,
  Reservacion,
  ReservacionInsert,
  Pago,
  PagoInsert,
  Cancelacion,
  CancelacionInsert,
  HorarioDisponible,
  AuditoriaInsert,
  EstadoReservacion,
  MetodoPago,
} from '../types/database.js';

export interface DisponibilidadResult {
  disponible: boolean;
  conflicto?: Reservacion;
  mensaje?: string;
}

export interface CrearReservacionDto {
  usuario_id: string;
  sala_id: number;
  fecha_reservacion: string; // YYYY-MM-DD
  hora_inicio: string; // HH:00:00 o HH:00
  hora_fin: string; // HH:00:00 o HH:00
  monto_total?: number;
  estado_reservacion?: EstadoReservacion;
}

export interface RegistrarPagoDto {
  reservacion_id: string;
  monto: number;
  concepto_pago: string;
  metodo_pago: MetodoPago;
  transaccion_id: string;
  fecha_pago?: string;
}

/**
 * Servicio centralizado con tipado estricto para operaciones en Supabase.
 * Implementa las reglas de negocio de YourSelf Music 2.0:
 * - 4 salas de ensayo físicas (sala_id: 1..4).
 * - Cero solapamiento de reservaciones en la misma sala/fecha/horario.
 * - Bloques de reserva por horas cerradas.
 * - Aprobación/confirmación automática o manual según método de pago.
 * - Registro automático en la tabla de auditoría.
 */
export class DatabaseService {
  /**
   * 1. Consulta las salas activas en el catálogo (estrictamente salas 1 a 4).
   */
  static async getSalasActivas(): Promise<Sala[]> {
    const { data, error } = await supabase
      .from('salas')
      .select('*')
      .in('estado', ['activa', 'active', 'disponible', 'Activa'])
      .order('sala_id', { ascending: true });

    if (error) {
      console.error('[DatabaseService.getSalasActivas] Error:', error);
      throw new Error(`Error al consultar salas activas: ${error.message}`);
    }

    return (data as Sala[]) || [];
  }

  /**
   * Consulta una sala específica por su ID (1..4).
   */
  static async getSalaPorId(salaId: number): Promise<Sala | null> {
    if (salaId < 1 || salaId > 4) {
      throw new Error('El identificador de sala debe estar entre 1 y 4.');
    }

    const { data, error } = await supabase
      .from('salas')
      .select('*')
      .eq('sala_id', salaId)
      .maybeSingle();

    if (error) {
      console.error(`[DatabaseService.getSalaPorId] Error para sala ${salaId}:`, error);
      throw new Error(`Error al consultar sala ${salaId}: ${error.message}`);
    }

    return (data as Sala | null) ?? null;
  }

  /**
   * Consulta los horarios operativos configurados para una sala física.
   */
  static async getHorariosPorSala(
    salaId: number,
    diaSemana?: number
  ): Promise<HorarioDisponible[]> {
    let query = supabase.from('horarios_disponibles').select('*').eq('sala_id', salaId);

    if (diaSemana !== undefined) {
      query = query.eq('dia_semana', diaSemana);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DatabaseService.getHorariosPorSala] Error:', error);
      throw new Error(`Error al consultar horarios de sala: ${error.message}`);
    }

    return (data as HorarioDisponible[]) || [];
  }

  /**
   * 2. Verifica la disponibilidad de una sala para una fecha y rango de horas.
   * Regla de Negocio Crítica: Cero solapamiento de reservaciones activas.
   * Dos intervalos [inicio, fin) y [r.inicio, r.fin) se solapan si:
   * NOT (r.hora_fin <= hora_inicio OR r.hora_inicio >= hora_fin)
   */
  static async verificarDisponibilidad(
    salaId: number,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    excludeReservacionId?: string
  ): Promise<DisponibilidadResult> {
    // Validación de sala física (1..4)
    if (salaId < 1 || salaId > 4) {
      return {
        disponible: false,
        mensaje: 'La sala seleccionada debe estar estrictamente entre 1 y 4.',
      };
    }

    // Normalización de horas a formato HH:MM:SS
    const normalizarHora = (h: string) => {
      const parts = h.split(':');
      const hh = parts[0].padStart(2, '0');
      const mm = (parts[1] || '00').padStart(2, '0');
      const ss = (parts[2] || '00').padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    };

    const targetStart = normalizarHora(horaInicio);
    const targetEnd = normalizarHora(horaFin);

    const [startH, startM] = targetStart.split(':').map(Number);
    const [endH, endM] = targetEnd.split(':').map(Number);

    // Validación de bloques por horas completas
    if (startM !== 0 || endM !== 0 || endH <= startH) {
      return {
        disponible: false,
        mensaje:
          'Las reservaciones deben ser en bloques de horas completas (ej. 14:00:00 a 16:00:00) y hora_fin debe ser posterior a hora_inicio.',
      };
    }

    // Verificar si existe horario operativo en horarios_disponibles
    try {
      const fechaObj = new Date(`${fecha}T12:00:00Z`);
      const diaSemana = fechaObj.getUTCDay(); // 0 = Domingo ... 6 = Sábado
      const horarios = await this.getHorariosPorSala(salaId, diaSemana);

      if (horarios.length > 0) {
        const dentroDeHorario = horarios.some((h) => {
          const apertura = normalizarHora(h.hora_apertura);
          const cierre = normalizarHora(h.hora_cierre);
          return targetStart >= apertura && targetEnd <= cierre;
        });

        if (!dentroDeHorario) {
          return {
            disponible: false,
            mensaje: `El horario solicitado (${targetStart} - ${targetEnd}) está fuera del horario operativo configurado para la sala.`,
          };
        }
      }
    } catch {
      // Si la fecha no es parseable o la tabla aún no tiene datos de horarios, continuamos con la validación de solapamiento
    }

    // Consulta de reservaciones existentes para esa sala y fecha
    let query = supabase
      .from('reservaciones')
      .select('*')
      .eq('sala_id', salaId)
      .eq('fecha_reservacion', fecha)
      .not('estado_reservacion', 'in', '("cancelled","cancelada")');

    if (excludeReservacionId) {
      query = query.neq('reservacion_id', excludeReservacionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DatabaseService.verificarDisponibilidad] Error en consulta:', error);
      throw new Error(`Error verificando disponibilidad: ${error.message}`);
    }

    const reservacionesExistentes = (data as Reservacion[]) || [];

    // Verificación estricta de solapamiento
    const conflicto = reservacionesExistentes.find((res) => {
      const resStart = normalizarHora(res.hora_inicio);
      const resEnd = normalizarHora(res.hora_fin);

      // No se solapan si resEnd <= targetStart o resStart >= targetEnd
      const noSeSolapa = resEnd <= targetStart || resStart >= targetEnd;
      return !noSeSolapa;
    });

    if (conflicto) {
      return {
        disponible: false,
        conflicto,
        mensaje: `Horario ocupado: Ya existe una reservación activa de ${conflicto.hora_inicio} a ${conflicto.hora_fin}.`,
      };
    }

    return {
      disponible: true,
      mensaje: 'Horario disponible para reserva.',
    };
  }

  /**
   * 3. Inserta una nueva reservación con validación estricta de solapamiento y cálculo automático de monto.
   */
  static async insertarReservacion(dto: CrearReservacionDto): Promise<Reservacion> {
    // 1. Verificar sala y estado operativo
    const sala = await this.getSalaPorId(dto.sala_id);
    if (!sala) {
      throw new Error(`La sala ${dto.sala_id} no existe en el catálogo.`);
    }

    const estadoLower = sala.estado.toLowerCase();
    if (
      estadoLower === 'maintenance' ||
      estadoLower === 'mantenimiento' ||
      estadoLower === 'inactiva'
    ) {
      throw new Error(
        `La sala ${dto.sala_id} se encuentra en mantenimiento y no acepta reservaciones.`
      );
    }

    // 2. Verificar disponibilidad de horario (Regla de negocio: Prevención estricta de solapamiento)
    const check = await this.verificarDisponibilidad(
      dto.sala_id,
      dto.fecha_reservacion,
      dto.hora_inicio,
      dto.hora_fin
    );

    if (!check.disponible) {
      throw new Error(
        check.mensaje || 'La sala no se encuentra disponible en el horario seleccionado.'
      );
    }

    // 3. Calcular monto total si no fue provisto
    let montoTotal = dto.monto_total;
    if (montoTotal === undefined || montoTotal === null) {
      const startH = parseInt(dto.hora_inicio.split(':')[0], 10);
      const endH = parseInt(dto.hora_fin.split(':')[0], 10);
      const horas = endH - startH;
      montoTotal = horas * Number(sala.precio_por_hora);
    }

    const payload: ReservacionInsert = {
      usuario_id: dto.usuario_id,
      sala_id: dto.sala_id,
      fecha_reservacion: dto.fecha_reservacion,
      hora_inicio: dto.hora_inicio,
      hora_fin: dto.hora_fin,
      monto_total: montoTotal,
      estado_reservacion: dto.estado_reservacion || 'pendiente',
    };

    const { data, error } = await supabase
      .from('reservaciones')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[DatabaseService.insertarReservacion] Error insertando reservación:', error);
      throw new Error(`Error al registrar reservación: ${error.message}`);
    }

    const nuevaReservacion = data as Reservacion;

    // Registro automático de auditoría
    await this.registrarAuditoria(
      dto.usuario_id,
      `CREAR_RESERVACION: Sala ${dto.sala_id} para ${dto.fecha_reservacion} (${dto.hora_inicio} - ${dto.hora_fin}), Monto: $${montoTotal}`,
      'reservaciones'
    );

    return nuevaReservacion;
  }

  /**
   * 4. Inserta un nuevo pago y actualiza el estado de la reservación correspondiente.
   * Regla de Negocio:
   * - Si el pago es con pasarela/tarjeta, la reservación se marca como confirmada automáticamente.
   * - Si es transferencia, permanece pendiente hasta aprobación del administrador.
   */
  static async insertarPago(dto: RegistrarPagoDto): Promise<Pago> {
    // 1. Verificar existencia de la reservación
    const { data: resData, error: resError } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('reservacion_id', dto.reservacion_id)
      .maybeSingle();

    if (resError || !resData) {
      throw new Error(`Reservación no encontrada para el ID: ${dto.reservacion_id}`);
    }

    const reservacion = resData as Reservacion;

    // 2. Insertar pago en tabla 'pagos'
    const payload: PagoInsert = {
      reservacion_id: dto.reservacion_id,
      monto: dto.monto,
      concepto_pago: dto.concepto_pago,
      metodo_pago: dto.metodo_pago,
      transaccion_id: dto.transaccion_id,
      ...(dto.fecha_pago ? { fecha_pago: dto.fecha_pago } : {}),
    };

    const { data: pagoData, error: pagoError } = await supabase
      .from('pagos')
      .insert(payload)
      .select()
      .single();

    if (pagoError) {
      console.error('[DatabaseService.insertarPago] Error insertando pago:', pagoError);
      throw new Error(`Error al registrar pago: ${pagoError.message}`);
    }

    const nuevoPago = pagoData as Pago;

    // 3. Confirmar la reservación si el pago es inmediato por tarjeta
    const metodoLower = dto.metodo_pago.toLowerCase();
    const esTarjeta = metodoLower === 'card' || metodoLower === 'tarjeta';
    if (esTarjeta) {
      await supabase
        .from('reservaciones')
        .update({ estado_reservacion: 'confirmada' })
        .eq('reservacion_id', dto.reservacion_id);
    }

    // Registro en auditoría
    await this.registrarAuditoria(
      reservacion.usuario_id,
      `REGISTRO_PAGO: Monto $${dto.monto} (${dto.metodo_pago}) Folio ${dto.transaccion_id} para Reservación ${dto.reservacion_id}`,
      'pagos'
    );

    return nuevoPago;
  }

  /**
   * Consulta reservaciones por fecha para la vista de calendario y control administrativo.
   */
  static async getReservacionesPorFecha(fecha: string): Promise<Reservacion[]> {
    const { data, error } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('fecha_reservacion', fecha)
      .order('hora_inicio', { ascending: true });

    if (error) {
      console.error('[DatabaseService.getReservacionesPorFecha] Error:', error);
      throw new Error(`Error consultando reservaciones: ${error.message}`);
    }

    return (data as Reservacion[]) || [];
  }

  /**
   * Consulta una reservación específica por su ID.
   */
  static async getReservacionPorId(reservacionId: string): Promise<Reservacion | null> {
    const { data, error } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('reservacion_id', reservacionId)
      .maybeSingle();

    if (error) {
      console.error(`[DatabaseService.getReservacionPorId] Error:`, error);
      throw new Error(`Error al consultar reservación ${reservacionId}: ${error.message}`);
    }

    return (data as Reservacion | null) ?? null;
  }

  /**
   * Consulta el historial de reservaciones de un usuario específico.
   */
  static async getReservacionesUsuario(usuarioId: string): Promise<Reservacion[]> {
    const { data, error } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha_reservacion', { ascending: false })
      .order('hora_inicio', { ascending: false });

    if (error) {
      console.error('[DatabaseService.getReservacionesUsuario] Error:', error);
      throw new Error(`Error consultando historial de usuario: ${error.message}`);
    }

    return (data as Reservacion[]) || [];
  }

  /**
   * Aprueba una transferencia bancaria manual (Acción Administrativa).
   * Cambia el estado de la reservación a 'confirmada'.
   */
  static async aprobarPagoTransferencia(
    reservacionId: string,
    adminUsuarioId?: string
  ): Promise<Reservacion> {
    const { data, error } = await supabase
      .from('reservaciones')
      .update({ estado_reservacion: 'confirmada' })
      .eq('reservacion_id', reservacionId)
      .select()
      .single();

    if (error) {
      console.error('[DatabaseService.aprobarPagoTransferencia] Error:', error);
      throw new Error(`Error al aprobar transferencia: ${error.message}`);
    }

    await this.registrarAuditoria(
      adminUsuarioId || null,
      `APROBAR_TRANSFERENCIA: Reservación ${reservacionId} marcada como confirmada por administración`,
      'reservaciones'
    );

    return data as Reservacion;
  }

  /**
   * Cancela una reservación y registra la multa/reembolso en la tabla 'cancelaciones'.
   */
  static async cancelarReservacion(
    reservacionId: string,
    tarifaMulta: number = 0,
    esMismoDia: boolean = false,
    montoReembolsado: number = 0,
    usuarioId?: string
  ): Promise<{ reservacion: Reservacion; cancelacion: Cancelacion | null }> {
    // 1. Actualizar estado a 'cancelada'
    const { data: resData, error: resError } = await supabase
      .from('reservaciones')
      .update({ estado_reservacion: 'cancelada' })
      .eq('reservacion_id', reservacionId)
      .select()
      .single();

    if (resError || !resData) {
      throw new Error(`Error al cancelar reservación: ${resError?.message || 'No encontrada'}`);
    }

    // 2. Registrar en tabla de cancelaciones
    const cancelPayload: CancelacionInsert = {
      reservacion_id: reservacionId,
      tarifa_multa: tarifaMulta,
      es_mismo_dia: esMismoDia,
      monto_reembolsado: montoReembolsado,
    };

    const { data: cancelData, error: cancelError } = await supabase
      .from('cancelaciones')
      .insert(cancelPayload)
      .select()
      .single();

    if (cancelError) {
      console.error(
        '[DatabaseService.cancelarReservacion] Error registrando cancelación:',
        cancelError
      );
    }

    await this.registrarAuditoria(
      usuarioId || null,
      `CANCELAR_RESERVACION: Reservación ${reservacionId} cancelada (Multa: $${tarifaMulta}, Reembolso: $${montoReembolsado})`,
      'cancelaciones'
    );

    return {
      reservacion: resData as Reservacion,
      cancelacion: (cancelData as Cancelacion | null) ?? null,
    };
  }

  /**
   * Helper para registrar eventos en la tabla 'auditoria'.
   */
  static async registrarAuditoria(
    usuarioId: string | null,
    accion: string,
    tablaAfectada: string
  ): Promise<void> {
    try {
      const payload: AuditoriaInsert = {
        usuario_id: usuarioId,
        accion,
        tabla_afectada: tablaAfectada,
      };
      await supabase.from('auditoria').insert(payload);
    } catch (err: any) {
      console.warn(
        '[DatabaseService.registrarAuditoria] Advertencia al registrar auditoría:',
        err?.message || err
      );
    }
  }
}

export default DatabaseService;
