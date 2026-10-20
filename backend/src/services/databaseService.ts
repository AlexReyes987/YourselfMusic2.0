import { supabaseAdmin as supabase } from '../config/supabaseClient.js';
import {
  Sala,
  Reservacion,
  ReservacionInsert,
  Pago,
  PagoInsert,
  HorarioDisponible,
  EstadoReservacion,
  MetodoPago,
} from '../types/database.js';

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
  horas_libres: number[]; // e.g. [10, 11, 12, 16, 17...]
  rangos_libres: RangoLibre[]; // e.g. [{ hora_inicio: '10:00:00', hora_fin: '14:00:00' }]
  reservaciones_ocupadas: Array<{
    reservacion_id: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
  }>;
}

export interface CrearReservacionConPagoDto {
  usuario_id: string;
  sala_id: number;
  fecha_reservacion: string; // YYYY-MM-DD
  hora_inicio: string; // HH:00:00
  hora_fin: string; // HH:00:00
  monto_total?: number;
  estado_reservacion?: EstadoReservacion;
  pago?: {
    monto?: number;
    concepto_pago?: string;
    metodo_pago: MetodoPago;
    transaccion_id?: string;
  };
}

export class DatabaseService {
  /**
   * 1. Consulta las salas de ensayo activas desde la tabla 'salas' (1 a 4).
   */
  static async getSalas(): Promise<Sala[]> {
    const { data, error } = await supabase
      .from('salas')
      .select('*')
      .order('sala_id', { ascending: true });

    if (error) {
      console.error('[DatabaseService.getSalas] Error:', error);
      throw new Error(`Error al consultar salas: ${error.message}`);
    }

    return (data || []) as Sala[];
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

    return (data as unknown as Sala) || null;
  }

  /**
   * 2. Consulta horarios_disponibles y reservaciones para calcular y retornar
   * los rangos de horas libres por fecha y sala.
   */
  static async obtenerDisponibilidad(
    salaId: number,
    fecha: string
  ): Promise<DisponibilidadResponse> {
    if (salaId < 1 || salaId > 4) {
      throw new Error('La sala debe ser un número del 1 al 4.');
    }

    // 1. Obtener datos de la sala
    const sala = await this.getSalaPorId(salaId);
    if (!sala) {
      throw new Error(`La sala ${salaId} no fue encontrada.`);
    }

    // 2. Determinar día de la semana (0 = Domingo, 1 = Lunes ... 6 = Sábado)
    const fechaObj = new Date(`${fecha}T12:00:00Z`);
    if (isNaN(fechaObj.getTime())) {
      throw new Error('Formato de fecha inválido. Utilice YYYY-MM-DD.');
    }
    const diaSemana = fechaObj.getDay();

    // 3. Consultar horario operativo en horarios_disponibles
    const { data: horarioData } = await supabase
      .from('horarios_disponibles')
      .select('*')
      .eq('sala_id', salaId)
      .eq('dia_semana', diaSemana)
      .maybeSingle();

    const horario = horarioData as unknown as HorarioDisponible | null;
    const horaAperturaStr = horario?.hora_apertura || '10:00:00';
    const horaCierreStr = horario?.hora_cierre || '22:00:00';

    const aperturaHour = parseInt(horaAperturaStr.split(':')[0], 10);
    const cierreHour = parseInt(horaCierreStr.split(':')[0], 10);

    // 4. Consultar reservaciones activas para esa sala y fecha
    const { data: resData, error: resError } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('sala_id', salaId)
      .eq('fecha_reservacion', fecha)
      .not('estado_reservacion', 'in', '("cancelled","cancelada")');

    if (resError) {
      console.error('[DatabaseService.obtenerDisponibilidad] Error en reservaciones:', resError);
      throw new Error(`Error al consultar reservaciones: ${resError.message}`);
    }

    const reservacionesExistentes = (resData || []) as unknown as Reservacion[];

    // 5. Determinar bloques horarios ocupados y libres
    const normalizarH = (h: string) => parseInt(h.split(':')[0], 10);

    const horasOcupadas = new Set<number>();
    const reservacionesOcupadas = reservacionesExistentes.map((r) => {
      const startH = normalizarH(r.hora_inicio);
      const endH = normalizarH(r.hora_fin);
      for (let h = startH; h < endH; h++) {
        horasOcupadas.add(h);
      }
      return {
        reservacion_id: r.reservacion_id,
        hora_inicio: r.hora_inicio,
        hora_fin: r.hora_fin,
        estado: r.estado_reservacion,
      };
    });

    const horasLibres: number[] = [];
    for (let h = aperturaHour; h < cierreHour; h++) {
      if (!horasOcupadas.has(h)) {
        horasLibres.push(h);
      }
    }

    // 6. Construir rangos continuos de horas libres
    const rangosLibres: RangoLibre[] = [];
    if (horasLibres.length > 0) {
      let rangoInicio = horasLibres[0];
      let rangoFin = horasLibres[0] + 1;

      for (let i = 1; i < horasLibres.length; i++) {
        const hora = horasLibres[i];
        if (hora === rangoFin) {
          rangoFin = hora + 1;
        } else {
          rangosLibres.push({
            hora_inicio: `${String(rangoInicio).padStart(2, '0')}:00:00`,
            hora_fin: `${String(rangoFin).padStart(2, '0')}:00:00`,
          });
          rangoInicio = hora;
          rangoFin = hora + 1;
        }
      }

      rangosLibres.push({
        hora_inicio: `${String(rangoInicio).padStart(2, '0')}:00:00`,
        hora_fin: `${String(rangoFin).padStart(2, '0')}:00:00`,
      });
    }

    return {
      sala_id: salaId,
      nombre_sala: sala.nombre_sala,
      fecha,
      horario_operativo: {
        hora_apertura: horaAperturaStr,
        hora_cierre: horaCierreStr,
      },
      horas_libres: horasLibres,
      rangos_libres: rangosLibres,
      reservaciones_ocupadas: reservacionesOcupadas,
    };
  }

  /**
   * 3. Crea una reservación con validación estricta de solapamiento y registro de pago.
   */
  static async crearReservacionConPago(
    dto: CrearReservacionConPagoDto
  ): Promise<{ reservacion: Reservacion; pago?: Pago }> {
    // 1. Validar sala física 1 a 4
    if (dto.sala_id < 1 || dto.sala_id > 4) {
      throw { status: 400, message: 'La sala debe ser entre 1 y 4.' };
    }

    const sala = await this.getSalaPorId(dto.sala_id);
    if (!sala) {
      throw { status: 404, message: `Sala ${dto.sala_id} no encontrada.` };
    }

    if (sala.estado === 'maintenance' || sala.estado === 'mantenimiento') {
      throw { status: 400, message: `La sala ${dto.sala_id} se encuentra en mantenimiento.` };
    }

    // 2. Validar bloques de horas cerradas
    const [startH, startM] = dto.hora_inicio.split(':').map(Number);
    const [endH, endM] = dto.hora_fin.split(':').map(Number);

    if (startM !== 0 || endM !== 0 || endH <= startH) {
      throw {
        status: 400,
        message: 'Las reservaciones deben ser en bloques de horas completas (ej. 14:00:00 a 16:00:00).',
      };
    }

    // 3. Validación estricta anti-solapamiento (Business Rule #1)
    const { data: resExistentes, error: checkError } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('sala_id', dto.sala_id)
      .eq('fecha_reservacion', dto.fecha_reservacion)
      .not('estado_reservacion', 'in', '("cancelled","cancelada")');

    if (checkError) {
      console.error('[DatabaseService.crearReservacionConPago] Error en check solapamiento:', checkError);
      throw { status: 500, message: `Error validando disponibilidad: ${checkError.message}` };
    }

    const normalizarH = (h: string) => (h.length === 5 ? `${h}:00` : h);
    const targetStart = normalizarH(dto.hora_inicio);
    const targetEnd = normalizarH(dto.hora_fin);

    const conflicto = ((resExistentes || []) as unknown as Reservacion[]).find((r) => {
      const rStart = normalizarH(r.hora_inicio);
      const rEnd = normalizarH(r.hora_fin);
      return !(rEnd <= targetStart || rStart >= targetEnd);
    });

    if (conflicto) {
      throw {
        status: 409,
        message: `Solapamiento detectado: La sala ${dto.sala_id} ya está reservada de ${conflicto.hora_inicio} a ${conflicto.hora_fin} para la fecha ${dto.fecha_reservacion}.`,
      };
    }

    // 4. Calcular monto total
    const horas = endH - startH;
    const montoCalculado = horas * Number(sala.precio_por_hora);
    const montoTotal = dto.monto_total ?? montoCalculado;

    // 5. Determinar estado inicial según método de pago (Business Rule #4)
    const esTarjeta = dto.pago?.metodo_pago === 'card' || dto.pago?.metodo_pago === 'tarjeta';
    const estadoInicial: EstadoReservacion =
      dto.estado_reservacion || (esTarjeta ? 'confirmed' : 'pending');

    // 6. Insertar en tabla reservaciones
    const reservacionPayload: ReservacionInsert = {
      usuario_id: dto.usuario_id,
      sala_id: dto.sala_id,
      fecha_reservacion: dto.fecha_reservacion,
      hora_inicio: dto.hora_inicio,
      hora_fin: dto.hora_fin,
      monto_total: montoTotal,
      estado_reservacion: estadoInicial,
    };

    const { data: nuevaResData, error: insertResError } = await supabase
      .from('reservaciones')
      .insert(reservacionPayload as any)
      .select()
      .single();

    if (insertResError || !nuevaResData) {
      console.error('[DatabaseService.crearReservacionConPago] Error insertando reservacion:', insertResError);
      throw { status: 500, message: `Error al crear reservación: ${insertResError?.message}` };
    }

    const reservacionCreada = nuevaResData as unknown as Reservacion;

    // 7. Insertar en tabla pagos
    let pagoCreado: Pago | undefined = undefined;

    if (dto.pago) {
      const transaccionId =
        dto.pago.transaccion_id ||
        `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const pagoPayload: PagoInsert = {
        reservacion_id: reservacionCreada.reservacion_id,
        monto: dto.pago.monto ?? montoTotal,
        concepto_pago:
          dto.pago.concepto_pago ||
          `Reserva ${sala.nombre_sala} (${dto.fecha_reservacion} ${dto.hora_inicio}-${dto.hora_fin})`,
        metodo_pago: dto.pago.metodo_pago,
        transaccion_id: transaccionId,
      };

      const { data: nuevoPagoData, error: insertPagoError } = await supabase
        .from('pagos')
        .insert(pagoPayload as any)
        .select()
        .single();

      if (insertPagoError) {
        console.error('[DatabaseService.crearReservacionConPago] Error insertando pago:', insertPagoError);
      } else {
        pagoCreado = nuevoPagoData as unknown as Pago;
      }
    }

    // 8. Registrar en auditoría
    await this.registrarAuditoria(
      dto.usuario_id,
      `CREAR_RESERVACION: Sala ${dto.sala_id} fecha ${dto.fecha_reservacion} (${dto.hora_inicio}-${dto.hora_fin}) Estado: ${estadoInicial}`,
      'reservaciones'
    );

    return {
      reservacion: reservacionCreada,
      pago: pagoCreado,
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
      } as any);
    } catch (err: any) {
      console.warn('[DatabaseService.registrarAuditoria] Error registrando auditoría:', err.message);
    }
  }
}
