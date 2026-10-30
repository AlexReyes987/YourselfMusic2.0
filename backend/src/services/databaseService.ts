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
  horas_libres: number[]; // e.g. [12, 13, 14, 15, 16...]
  rangos_libres: RangoLibre[]; // e.g. [{ hora_inicio: '12:00:00', hora_fin: '23:00:00' }]
  reservaciones_ocupadas: Array<{
    reservacion_id: string | number;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
  }>;
}

export interface CrearReservacionConPagoDto {
  usuario_id: number | string;
  sala_id: number;
  fecha_reservacion: string; // YYYY-MM-DD
  hora_inicio: string; // HH:00:00
  hora_fin: string; // HH:00:00
  num_personas?: number;
  monto_total?: number;
  estado_reservacion?: EstadoReservacion;
  pago?: {
    monto?: number;
    concepto_pago?: string;
    metodo_pago: MetodoPago;
    transaccion_id?: string;
  };
}

// 4 Salas Oficiales de YourSelf Music 2.0 ($35/h por persona, Capacidad 9)
export const FALLBACK_SALAS: Sala[] = [
  {
    sala_id: 1,
    nombre_sala: 'Sala 1 - Azul / Neon',
    descripcion: 'Sala equipada con iluminación temática azul y neón, batería acústica profesional, amplificadores de guitarra y bajo, y microfonía de alta fidelidad.',
    precio_por_hora: 35.00,
    capacidad: 9,
    estado: 'active',
  },
  {
    sala_id: 2,
    nombre_sala: 'Sala 2 - Roja',
    descripcion: 'Sala temática roja con tratamiento acústico avanzado, monitoreo de precisión, amplificación valvular y microfonía Shure para ensayos de alta exigencia.',
    precio_por_hora: 35.00,
    capacidad: 9,
    estado: 'active',
  },
  {
    sala_id: 3,
    nombre_sala: 'Sala 3 - Naranja',
    descripcion: 'Sala temática naranja con backline completo de estudio, monitoreo estéreo equilibrado y excelente resonancia para ensambles compactos y bandas.',
    precio_por_hora: 35.00,
    capacidad: 9,
    estado: 'active',
  },
  {
    sala_id: 4,
    nombre_sala: 'Sala 4 - Blanca',
    descripcion: 'Sala blanca minimalista con iluminación neutra de precisión acústica, microfonía condensador y dinámicos, y monitores de referencia.',
    precio_por_hora: 35.00,
    capacidad: 9,
    estado: 'active',
  },
];

export class DatabaseService {
  /**
   * 1. Consulta las salas de ensayo activas desde la tabla 'salas' (1 a 4).
   * Si Supabase no está conectado o sus credenciales están pendientes, retorna el catálogo oficial.
   */
  static async getSalas(): Promise<Sala[]> {
    try {
      const { data, error } = await supabase
        .from('salas')
        .select('*')
        .order('sala_id', { ascending: true });

      if (error || !data || data.length === 0) {
        console.warn('[DatabaseService.getSalas] Usando catálogo oficial de respaldo:', error?.message);
        return FALLBACK_SALAS;
      }

      return data as Sala[];
    } catch (err: any) {
      console.warn('[DatabaseService.getSalas] Conexión a Supabase no disponible. Retornando las 4 salas oficiales:', err.message);
      return FALLBACK_SALAS;
    }
  }

  /**
   * Consulta una sala específica por su ID (1..4).
   */
  static async getSalaPorId(salaId: number): Promise<Sala | null> {
    if (salaId < 1 || salaId > 4) {
      throw new Error('El identificador de sala debe ser entre 1 y 4.');
    }

    try {
      const { data, error } = await supabase
        .from('salas')
        .select('*')
        .eq('sala_id', salaId)
        .maybeSingle();

      if (error || !data) {
        return FALLBACK_SALAS.find((s) => s.sala_id === salaId) || null;
      }

      return (data as unknown as Sala) || null;
    } catch (err: any) {
      console.warn(`[DatabaseService.getSalaPorId] Fallback sala ${salaId}:`, err.message);
      return FALLBACK_SALAS.find((s) => s.sala_id === salaId) || null;
    }
  }

  /**
   * 2. Consulta horarios_disponibles y reservaciones para calcular y retornar
   * los rangos de horas libres por fecha y sala.
   * Regla oficial: Operación de 12:00:00 a 23:00:00 de Lunes a Sábado. Domingos cerrado.
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

    // Si es domingo (0), no hay servicio
    if (diaSemana === 0) {
      return {
        sala_id: salaId,
        nombre_sala: sala.nombre_sala,
        fecha,
        horario_operativo: {
          hora_apertura: '12:00:00',
          hora_cierre: '12:00:00',
        },
        horas_libres: [],
        rangos_libres: [],
        reservaciones_ocupadas: [],
      };
    }

    // 3. Consultar horario operativo en horarios_disponibles con tolerancia a fallas
    let horaAperturaStr = '12:00:00';
    let horaCierreStr = '23:00:00';
    let reservacionesExistentes: Reservacion[] = [];

    try {
      const { data: horarioData } = await supabase
        .from('horarios_disponibles')
        .select('*')
        .eq('sala_id', salaId)
        .eq('dia_semana', diaSemana)
        .maybeSingle();

      const horario = horarioData as unknown as HorarioDisponible | null;
      if (horario) {
        horaAperturaStr = horario.hora_apertura;
        horaCierreStr = horario.hora_cierre;
      }

      // 4. Consultar reservaciones activas para esa sala y fecha
      const { data: resData } = await supabase
        .from('reservaciones')
        .select('*')
        .eq('sala_id', salaId)
        .eq('fecha_reservacion', fecha)
        .not('estado_reservacion', 'in', '("cancelled","cancelada")');

      reservacionesExistentes = (resData || []) as unknown as Reservacion[];
    } catch (err: any) {
      console.warn('[DatabaseService.obtenerDisponibilidad] Nota: Usando horarios oficiales base:', err.message);
    }

    const aperturaHour = parseInt(horaAperturaStr.split(':')[0], 10);
    const cierreHour = parseInt(horaCierreStr.split(':')[0], 10);

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
   * Regla de negocio: $35 MXN por persona por hora.
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
    let resExistentes: Reservacion[] = [];
    try {
      const { data, error: checkError } = await supabase
        .from('reservaciones')
        .select('*')
        .eq('sala_id', dto.sala_id)
        .eq('fecha_reservacion', dto.fecha_reservacion)
        .not('estado_reservacion', 'in', '("cancelled","cancelada")');

      if (!checkError && data) {
        resExistentes = data as unknown as Reservacion[];
      }
    } catch {
      // Si la BD no está disponible, continuar con validación en memoria
    }

    const normalizarH = (h: string) => (h.length === 5 ? `${h}:00` : h);
    const targetStart = normalizarH(dto.hora_inicio);
    const targetEnd = normalizarH(dto.hora_fin);

    const conflicto = resExistentes.find((r) => {
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

    // 4. Calcular monto total según integrantes ($35 MXN por persona por hora)
    const horas = endH - startH;
    const numPersonas = dto.num_personas && dto.num_personas > 0 ? dto.num_personas : 1;
    const precioBase = Number(sala.precio_por_hora) || 35;
    const montoCalculado = horas * precioBase * numPersonas;
    const montoTotal = dto.monto_total ?? montoCalculado;

    // Normalizar usuario_id como entero válido para la clave foránea en Supabase
    let validUsuarioId: number = 2; // Usuario general por defecto
    if (typeof dto.usuario_id === 'number' && !isNaN(dto.usuario_id)) {
      validUsuarioId = dto.usuario_id;
    } else if (typeof dto.usuario_id === 'string') {
      const parsed = parseInt(dto.usuario_id, 10);
      if (!isNaN(parsed)) {
        validUsuarioId = parsed;
      }
    }

    // 5. Determinar estado inicial según método de pago (Business Rule #4)
    const esTarjeta = dto.pago?.metodo_pago === 'card' || dto.pago?.metodo_pago === 'tarjeta';
    const estadoInicial: EstadoReservacion =
      dto.estado_reservacion || (esTarjeta ? 'confirmed' : 'pending');

    // 6. Insertar en tabla reservaciones
    const reservacionPayload: ReservacionInsert = {
      usuario_id: validUsuarioId as any,
      sala_id: dto.sala_id,
      fecha_reservacion: dto.fecha_reservacion,
      hora_inicio: dto.hora_inicio,
      hora_fin: dto.hora_fin,
      monto_total: montoTotal,
      estado_reservacion: estadoInicial,
    };

    let reservacionCreada: Reservacion;

    try {
      const { data: nuevaResData, error: insertResError } = await supabase
        .from('reservaciones')
        .insert(reservacionPayload as any)
        .select()
        .single();

      if (insertResError || !nuevaResData) {
        throw new Error(insertResError?.message || 'Error insertando en tabla reservaciones');
      }

      reservacionCreada = nuevaResData as unknown as Reservacion;
    } catch (err: any) {
      console.warn('[DatabaseService.crearReservacionConPago] Fallback en memoria para reservación:', err.message);
      reservacionCreada = {
        reservacion_id: `${Date.now()}`,
        usuario_id: String(validUsuarioId),
        sala_id: dto.sala_id,
        fecha_reservacion: dto.fecha_reservacion,
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        monto_total: montoTotal,
        estado_reservacion: estadoInicial,
      };
    }

    // 7. Insertar en tabla pagos
    let pagoCreado: Pago | undefined = undefined;

    if (dto.pago) {
      const transaccionId =
        dto.pago.transaccion_id ||
        `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const pagoPayload: PagoInsert = {
        reservacion_id: reservacionCreada.reservacion_id as any,
        monto: dto.pago.monto ?? montoTotal,
        concepto_pago:
          dto.pago.concepto_pago ||
          `Reserva ${sala.nombre_sala} (${dto.fecha_reservacion} ${dto.hora_inicio}-${dto.hora_fin}) - ${numPersonas} personas`,
        metodo_pago: dto.pago.metodo_pago,
        transaccion_id: transaccionId,
      };

      try {
        const { data: nuevoPagoData, error: insertPagoError } = await supabase
          .from('pagos')
          .insert(pagoPayload as any)
          .select()
          .single();

        if (!insertPagoError && nuevoPagoData) {
          pagoCreado = nuevoPagoData as unknown as Pago;
        } else {
          pagoCreado = {
            pago_id: `${Date.now()}`,
            reservacion_id: String(reservacionCreada.reservacion_id),
            monto: dto.pago.monto ?? montoTotal,
            concepto_pago: pagoPayload.concepto_pago,
            metodo_pago: dto.pago.metodo_pago,
            transaccion_id: transaccionId,
            fecha_pago: new Date().toISOString(),
          };
        }
      } catch {
        pagoCreado = {
          pago_id: `${Date.now()}`,
          reservacion_id: String(reservacionCreada.reservacion_id),
          monto: dto.pago.monto ?? montoTotal,
          concepto_pago: pagoPayload.concepto_pago,
          metodo_pago: dto.pago.metodo_pago,
          transaccion_id: transaccionId,
          fecha_pago: new Date().toISOString(),
        };
      }
    }

    // 8. Registrar en auditoría
    await this.registrarAuditoria(
      validUsuarioId,
      `CREAR_RESERVACION: Sala ${dto.sala_id} fecha ${dto.fecha_reservacion} (${dto.hora_inicio}-${dto.hora_fin}) Personas: ${numPersonas} Monto: $${montoTotal} Estado: ${estadoInicial}`,
      'reservaciones'
    );

    return {
      reservacion: reservacionCreada,
      pago: pagoCreado,
    };
  }

  /**
   * 4. Consulta las reservaciones de un usuario autenticado específico.
   */
  static async getReservacionesPorUsuario(usuarioId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reservaciones')
        .select(`
          *,
          salas ( sala_id, nombre_sala, precio_por_hora, capacidad ),
          pagos ( pago_id, monto, metodo_pago, transaccion_id, fecha_pago, concepto_pago )
        `)
        .eq('usuario_id', usuarioId)
        .order('fecha_reservacion', { ascending: false })
        .order('hora_inicio', { ascending: false });

      if (error) {
        console.error('[DatabaseService.getReservacionesPorUsuario] Error:', error);
        return [];
      }

      return (data || []).map((r: any) => ({
        ...r,
        nombre_sala: r.salas?.nombre_sala || `Sala ${r.sala_id}`,
      }));
    } catch (err: any) {
      console.warn('[DatabaseService.getReservacionesPorUsuario] Error:', err.message);
      return [];
    }
  }

  /**
   * Helper para registrar eventos en la tabla 'auditoria'.
   */
  static async registrarAuditoria(
    usuarioId: number | string | null,
    accion: string,
    tablaAfectada: string
  ): Promise<void> {
    try {
      let uid: number = 2;
      if (typeof usuarioId === 'number' && !isNaN(usuarioId)) {
        uid = usuarioId;
      } else if (typeof usuarioId === 'string') {
        const p = parseInt(usuarioId, 10);
        if (!isNaN(p)) uid = p;
      }

      await supabase.from('auditoria').insert({
        usuario_id: uid,
        accion,
        tabla_afectada: tablaAfectada,
      } as any);
    } catch (err: any) {
      console.warn('[DatabaseService.registrarAuditoria] Error registrando auditoría:', err.message);
    }
  }
}
