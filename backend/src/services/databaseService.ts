import { supabaseAdmin as supabase } from '../config/supabaseClient.js';
import {
  Sala,
  Reservacion,
  ReservacionInsert,
  Pago,
  PagoInsert,
  Cancelacion,
  CancelacionInsert,
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
  hora_inicio: string; // HH:00:00
  hora_fin: string; // HH:00:00
  monto_total?: number;
  estado_reservacion?: EstadoReservacion;
}

export interface RegistrarPagoDto {
  reservacion_id: string;
  monto: number;
  concepto_pago: string;
  metodo_pago: MetodoPago;
  transaccion_id: string;
}

export class DatabaseService {
  /**
   * 1. Consulta las salas activas en el catálogo (estrictamente salas 1 a 4).
   */
  static async getSalasActivas(): Promise<Sala[]> {
    const { data, error } = await supabase
      .from('salas')
      .select('*')
      .in('estado', ['active', 'disponible', 'Activa'])
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
      throw new Error('El identificador de sala debe ser entre 1 y 4.');
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

    return (data as Sala) || null;
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
    // Validación de sala física
    if (salaId < 1 || salaId > 4) {
      return {
        disponible: false,
        mensaje: 'La sala seleccionada debe estar entre 1 y 4.',
      };
    }

    // Validación de bloques por hora cerrada
    const [startH, startM] = horaInicio.split(':').map(Number);
    const [endH, endM] = horaFin.split(':').map(Number);
    if (startM !== 0 || endM !== 0 || endH <= startH) {
      return {
        disponible: false,
        mensaje: 'Las reservaciones deben ser en bloques de horas completas (ej. 14:00:00 a 16:00:00).',
      };
    }

    // Consulta de reservaciones activas para esa sala y fecha
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
    const normalizarHora = (h: string) => (h.length === 5 ? `${h}:00` : h);
    const targetStart = normalizarHora(horaInicio);
    const targetEnd = normalizarHora(horaFin);

    const conflicto = reservacionesExistentes.find((res) => {
      const resStart = normalizarHora(res.hora_inicio);
      const resEnd = normalizarHora(res.hora_fin);

      // No se solapan si termina antes o empieza después
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
   * 3. Inserta una nueva reservación con validación estricta de solapamiento y cálculo de monto.
   */
  static async insertarReservacion(dto: CrearReservacionDto): Promise<Reservacion> {
    // 1. Verificar sala y obtener tarifa
    const sala = await this.getSalaPorId(dto.sala_id);
    if (!sala) {
      throw new Error(`La sala ${dto.sala_id} no existe.`);
    }

    if (sala.estado === 'maintenance' || sala.estado === 'mantenimiento') {
      throw new Error(`La sala ${dto.sala_id} está en mantenimiento y no acepta reservaciones.`);
    }

    // 2. Verificar disponibilidad de horario
    const check = await this.verificarDisponibilidad(
      dto.sala_id,
      dto.fecha_reservacion,
      dto.hora_inicio,
      dto.hora_fin
    );

    if (!check.disponible) {
      throw new Error(check.mensaje || 'La sala no se encuentra disponible en el horario seleccionado.');
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
      estado_reservacion: dto.estado_reservacion || 'pending',
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

    // Registro en tabla de auditoría
    await this.registrarAuditoria(
      dto.usuario_id,
      `CREAR_RESERVACION: Sala ${dto.sala_id} fecha ${dto.fecha_reservacion} (${dto.hora_inicio}-${dto.hora_fin})`,
      'reservaciones'
    );

    return nuevaReservacion;
  }

  /**
   * 4. Inserta un nuevo pago y actualiza el estado de la reservación correspondiente.
   * Regla de Negocio: Si el pago se procesa con éxito (ej. tarjeta), la reservación pasa a 'confirmed'.
   * Si es transferencia, permanece 'pending' hasta aprobación de administración.
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

    // 2. Insertar pago
    const payload: PagoInsert = {
      reservacion_id: dto.reservacion_id,
      monto: dto.monto,
      concepto_pago: dto.concepto_pago,
      metodo_pago: dto.metodo_pago,
      transaccion_id: dto.transaccion_id,
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

    // 3. Si el método es tarjeta (pasarela inmediata), confirmar la reservación
    const esTarjeta = dto.metodo_pago === 'card' || dto.metodo_pago === 'tarjeta';
    if (esTarjeta) {
      await supabase
        .from('reservaciones')
        .update({ estado_reservacion: 'confirmed' })
        .eq('reservacion_id', dto.reservacion_id);
    }

    // Registro de auditoría
    await this.registrarAuditoria(
      reservacion.usuario_id,
      `REGISTRO_PAGO: Monto $${dto.monto} (${dto.metodo_pago}) Folio ${dto.transaccion_id}`,
      'pagos'
    );

    return nuevoPago;
  }

  /**
   * Consulta reservaciones por fecha con detalle del usuario y sala para la vista de calendario.
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
   * Consulta el historial de reservaciones de un usuario.
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
   * Cambia el estado de la reservación a 'confirmed'.
   */
  static async aprobarPagoTransferencia(
    reservacionId: string,
    adminUsuarioId?: string
  ): Promise<Reservacion> {
    const { data, error } = await supabase
      .from('reservaciones')
      .update({ estado_reservacion: 'confirmed' })
      .eq('reservacion_id', reservacionId)
      .select()
      .single();

    if (error) {
      console.error('[DatabaseService.aprobarPagoTransferencia] Error:', error);
      throw new Error(`Error al aprobar transferencia: ${error.message}`);
    }

    await this.registrarAuditoria(
      adminUsuarioId || null,
      `APROBAR_TRANSFERENCIA: Reservación ${reservacionId} marcada como confirmada`,
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
  ): Promise<{ reservacion: Reservacion; cancelacion: Cancelacion }> {
    // 1. Actualizar estado a 'cancelled'
    const { data: resData, error: resError } = await supabase
      .from('reservaciones')
      .update({ estado_reservacion: 'cancelled' })
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
      console.error('[DatabaseService.cancelarReservacion] Error registrando cancelación:', cancelError);
    }

    await this.registrarAuditoria(
      usuarioId || null,
      `CANCELAR_RESERVACION: Reservación ${reservacionId} cancelada (Multa: $${tarifaMulta})`,
      'cancelaciones'
    );

    return {
      reservacion: resData as Reservacion,
      cancelacion: cancelData as Cancelacion,
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
      await supabase.from('auditoria').insert({
        usuario_id: usuarioId,
        accion,
        tabla_afectada: tablaAfectada,
      });
    } catch (err: any) {
      console.warn('[DatabaseService.registrarAuditoria] Advertencia al registrar auditoría:', err.message);
    }
  }
}

