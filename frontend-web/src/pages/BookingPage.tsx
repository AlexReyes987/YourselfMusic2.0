import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomCard } from '../components/booking/RoomCard';
import { TimeSlotPicker } from '../components/booking/TimeSlotPicker';
import { Sala, RangoLibre } from '../types';
import { roomService } from '../services/roomService';
import { reservationService } from '../services/reservationService';
import { Calendar as CalendarIcon, ArrowRight, Music, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados principales
  const [salas, setSalas] = useState<Sala[]>([]);
  const [selectedSalaId, setSelectedSalaId] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [startHour, setStartHour] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(2);

  // Estados de disponibilidad en tiempo real
  const [horasLibres, setHorasLibres] = useState<number[]>([]);
  const [rangosLibres, setRangosLibres] = useState<RangoLibre[]>([]);
  const [horaApertura, setHoraApertura] = useState<string>('10:00:00');
  const [horaCierre, setHoraCierre] = useState<string>('22:00:00');
  const [isLoadingDisponibilidad, setIsLoadingDisponibilidad] = useState<boolean>(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState<string | null>(null);

  // 1. Cargar las 4 salas de ensayo desde Supabase/Backend (/api/salas)
  useEffect(() => {
    async function loadSalas() {
      try {
        const data = await roomService.getAll();
        setSalas(data);
        if (data.length > 0 && !data.some((s) => s.sala_id === selectedSalaId)) {
          setSelectedSalaId(data[0].sala_id);
        }
      } catch (err: any) {
        console.error('Error cargando salas:', err);
      }
    }
    loadSalas();
  }, []);

  // 2. Consultar disponibilidad en tiempo real cada vez que cambia la sala o la fecha
  useEffect(() => {
    async function fetchDisponibilidad() {
      if (!selectedSalaId || !selectedDate) return;

      setIsLoadingDisponibilidad(true);
      setErrorDisponibilidad(null);

      try {
        const resp = await reservationService.getDisponibilidad(selectedSalaId, selectedDate);
        setHorasLibres(resp.horas_libres || []);
        setRangosLibres(resp.rangos_libres || []);
        setHoraApertura(resp.horario_operativo?.hora_apertura || '10:00:00');
        setHoraCierre(resp.horario_operativo?.hora_cierre || '22:00:00');

        // Si la hora seleccionada no está en las horas libres, seleccionar la primera disponible
        if (resp.horas_libres && resp.horas_libres.length > 0) {
          if (startHour === null || !resp.horas_libres.includes(startHour)) {
            setStartHour(resp.horas_libres[0]);
          }
        } else {
          setStartHour(null);
        }
      } catch (err: any) {
        console.warn('Fallo consultando disponibilidad en backend, usando fallback:', err);
        // Fallback horario estándar (10:00 a 22:00 todas libres para demo si no hay backend activo)
        const demoLibres = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
        setHorasLibres(demoLibres);
        setRangosLibres([{ hora_inicio: '10:00:00', hora_fin: '22:00:00' }]);
        if (startHour === null) setStartHour(16);
      } finally {
        setIsLoadingDisponibilidad(false);
      }
    }

    fetchDisponibilidad();
  }, [selectedSalaId, selectedDate]);

  const selectedSala = salas.find((s) => s.sala_id === selectedSalaId);
  const totalPrice = selectedSala && startHour !== null ? selectedSala.precio_por_hora * duration : 0;

  const handleContinueToPayment = () => {
    if (!selectedSala || startHour === null) return;

    const startTimeFormatted = `${String(startHour).padStart(2, '0')}:00:00`;
    const endTimeFormatted = `${String(startHour + duration).padStart(2, '0')}:00:00`;

    navigate('/payment', {
      state: {
        salaId: selectedSala.sala_id,
        nombreSala: selectedSala.nombre_sala,
        descripcion: selectedSala.descripcion,
        precioPorHora: selectedSala.precio_por_hora,
        capacidad: selectedSala.capacidad,
        fecha: selectedDate,
        horaInicio: startTimeFormatted,
        horaFin: endTimeFormatted,
        startHour,
        duration,
        totalPrice,
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Encabezado */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Plataforma Oficial de Reservaciones YourSelf Music</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Reserva tu Sala de Ensayo
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
          Selecciona una de las 4 salas especializadas, verifica disponibilidad en tiempo real
          y asegura tu horario sin riesgo de solapamiento.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Columna Principal: Selección de Sala y Horarios */}
        <div className="lg:col-span-2 space-y-8">
          {/* Paso 1: Selección de Fecha */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-white">
              <CalendarIcon className="w-4 h-4 text-orange-400" />
              <span>1. Selecciona la Fecha del Ensayo</span>
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              />
              <span className="text-xs text-zinc-500">
                Horario de atención: 10:00 AM a 10:00 PM todos los días.
              </span>
            </div>
          </div>

          {/* Paso 2: Catálogo de las 4 Salas Físicas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-orange-400" />
                <span>2. Selecciona una de nuestras 4 Salas Físicas</span>
              </h2>
              <span className="text-xs text-zinc-400">4 salas disponibles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {salas.map((sala) => (
                <RoomCard
                  key={sala.sala_id}
                  sala={sala}
                  selected={selectedSalaId === sala.sala_id}
                  onSelect={(id) => setSelectedSalaId(id)}
                />
              ))}
            </div>
          </div>

          {/* Paso 3: Disponibilidad en Tiempo Real */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            {errorDisponibilidad && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorDisponibilidad}</span>
              </div>
            )}

            <TimeSlotPicker
              selectedStartHour={startHour}
              selectedDuration={duration}
              onSelectSlot={(sh, dur) => {
                setStartHour(sh);
                setDuration(dur);
              }}
              horasLibres={horasLibres}
              rangosLibres={rangosLibres}
              horaApertura={horaApertura}
              horaCierre={horaCierre}
              isLoading={isLoadingDisponibilidad}
            />
          </div>
        </div>

        {/* Columna Lateral: Resumen de Reserva Sticky */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl sticky top-24 space-y-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Resumen de tu Cita</h3>
              <ShieldCheck className="w-4 h-4 text-orange-400" />
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between items-start">
                <span className="text-zinc-400">Sala:</span>
                <span className="font-bold text-white text-right">
                  {selectedSala ? selectedSala.nombre_sala : 'Cargando...'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Capacidad:</span>
                <span className="text-zinc-200">
                  {selectedSala?.capacidad || 6} músicos
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Tarifa por hora:</span>
                <span className="text-zinc-200 font-semibold">
                  ${selectedSala?.precio_por_hora || 200} MXN
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Fecha:</span>
                <span className="font-semibold text-white">{selectedDate}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Horario:</span>
                <span className="font-semibold text-orange-400 font-mono">
                  {startHour !== null
                    ? `${String(startHour).padStart(2, '0')}:00 - ${String(startHour + duration).padStart(2, '0')}:00`
                    : 'Seleccionar hora'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Duración:</span>
                <span className="text-white font-medium">{duration} {duration === 1 ? 'hora' : 'horas'}</span>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-white block">Total a pagar:</span>
                  <span className="text-[10px] text-zinc-500">Impuestos y equipo incluidos</span>
                </div>
                <span className="text-2xl font-black text-orange-400">${totalPrice} MXN</span>
              </div>
            </div>

            <button
              type="button"
              disabled={startHour === null || !selectedSala}
              onClick={handleContinueToPayment}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer text-sm"
            >
              <span>Continuar al Pago</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-zinc-500 text-center space-y-1">
              <p>✓ Validación en tiempo real contra solapamientos.</p>
              <p>✓ Paga con tarjeta o transferencia SPEI.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
