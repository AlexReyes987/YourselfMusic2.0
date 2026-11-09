import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomCard } from '../components/booking/RoomCard';
import { TimeSlotPicker } from '../components/booking/TimeSlotPicker';
import { Sala, RangoLibre } from '../types';
import { roomService } from '../services/roomService';
import { reservationService } from '../services/reservationService';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Estados principales
  const [salas, setSalas] = useState<Sala[]>([]);
  const [selectedSalaId, setSelectedSalaId] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [startHour, setStartHour] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(1);
  const [numMiembros, setNumMiembros] = useState<number>(4);

  // Estados de disponibilidad en tiempo real (12:00 PM a 23:00 PM Lunes a Sábado)
  const [horasLibres, setHorasLibres] = useState<number[]>([]);
  const [rangosLibres, setRangosLibres] = useState<RangoLibre[]>([]);
  const [horaApertura, setHoraApertura] = useState<string>('12:00:00');
  const [horaCierre, setHoraCierre] = useState<string>('23:00:00');
  const [isLoadingDisponibilidad, setIsLoadingDisponibilidad] = useState<boolean>(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState<string | null>(null);

  // 1. Cargar las 4 salas de ensayo
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

  // 2. Consultar disponibilidad cada vez que cambia la sala o la fecha
  useEffect(() => {
    async function fetchDisponibilidad() {
      if (!selectedSalaId || !selectedDate) return;

      setIsLoadingDisponibilidad(true);
      setErrorDisponibilidad(null);

      try {
        const resp = await reservationService.getDisponibilidad(selectedSalaId, selectedDate);
        setHorasLibres(resp.horas_libres || []);
        setRangosLibres(resp.rangos_libres || []);
        setHoraApertura(resp.horario_operativo?.hora_apertura || '12:00:00');
        setHoraCierre(resp.horario_operativo?.hora_cierre || '23:00:00');

        if (resp.horas_libres && resp.horas_libres.length > 0) {
          if (startHour === null || !resp.horas_libres.includes(startHour)) {
            setStartHour(resp.horas_libres[0]);
          }
        } else {
          setStartHour(null);
        }
      } catch (err: any) {
        console.warn('Fallo consultando disponibilidad, usando horario predeterminado 12:00 a 23:00:', err);
        const demoLibres = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
        setHorasLibres(demoLibres);
        setRangosLibres([{ hora_inicio: '12:00:00', hora_fin: '23:00:00' }]);
        if (startHour === null) setStartHour(16);
      } finally {
        setIsLoadingDisponibilidad(false);
      }
    }

    fetchDisponibilidad();
  }, [selectedSalaId, selectedDate]);

  const selectedSala = salas.find((s) => s.sala_id === selectedSalaId);
  const maxCapacidad = selectedSala?.capacidad || 9;

  // Lógica oficial de cobro: $35 por persona / miembro que asistirá
  const precioPorPersona = selectedSala?.precio_por_hora || 35;
  const totalPrice = selectedSala && startHour !== null ? numMiembros * precioPorPersona * duration : 0;

  const handleContinueToPayment = () => {
    if (!selectedSala || startHour === null) return;

    const startTimeFormatted = `${String(startHour).padStart(2, '0')}:00:00`;
    const endTimeFormatted = `${String(startHour + duration).padStart(2, '0')}:00:00`;

    const bookingPayload = {
      salaId: selectedSala.sala_id,
      nombreSala: selectedSala.nombre_sala,
      descripcion: selectedSala.descripcion,
      precioPorHora: precioPorPersona,
      capacidad: maxCapacidad,
      fecha: selectedDate,
      horaInicio: startTimeFormatted,
      horaFin: endTimeFormatted,
      startHour,
      duration,
      numMiembros,
      totalPrice,
    };

    if (!isAuthenticated) {
      try {
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingPayload));
      } catch (e) {
        console.warn('Error guardando en sessionStorage:', e);
      }

      navigate('/login', {
        state: {
          from: '/payment',
          bookingData: bookingPayload,
          message: 'Inicia sesión o crea tu cuenta para continuar con tu reservación.',
        },
      });
      return;
    }

    navigate('/payment', {
      state: bookingPayload,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Reserva tu sala de ensayo
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
          Elige la fecha, la sala, el número de integrantes y el horario para tu ensayo ($35 MXN por persona por hora).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Columna Principal: Selección de Sala, Fecha, Miembros y Horarios */}
        <div className="lg:col-span-2 space-y-8">
          {/* Paso 1: Selección de Fecha */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <label className="block text-sm font-bold text-white">
              1. Selecciona la fecha del ensayo
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              />
              <span className="text-xs text-zinc-400">
                Horario de servicio: lunes a sábado de 12:00 a 23:00 hrs.
              </span>
            </div>
          </div>

          {/* Paso 2: Catálogo de las 4 Salas Físicas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                2. Selecciona una sala
              </h2>
              <span className="text-xs text-zinc-400">$35 MXN por persona / hora</span>
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

          {/* Paso 3: Especificar Integrantes / Miembros Asistentes */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white">
                3. Número de integrantes que asistirán
              </label>
              <span className="text-xs text-zinc-400">
                Máximo {maxCapacidad} músicos
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              La tarifa es de <strong className="text-zinc-200">$35 MXN por persona por hora</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-zinc-700 bg-zinc-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setNumMiembros((prev) => Math.max(1, prev - 1))}
                  disabled={numMiembros <= 1}
                  className="px-3.5 py-2.5 text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-5 py-2.5 text-base font-extrabold text-white min-w-[3.5rem] text-center">
                  {numMiembros}
                </span>
                <button
                  type="button"
                  onClick={() => setNumMiembros((prev) => Math.min(maxCapacidad, prev + 1))}
                  disabled={numMiembros >= maxCapacidad}
                  className="px-3.5 py-2.5 text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, maxCapacidad).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumMiembros(n)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      numMiembros === n
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700'
                    }`}
                  >
                    {n} {n === 1 ? 'persona' : 'pers.'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Tarifa por hora ({numMiembros} × $35 MXN):
              </span>
              <span className="font-semibold text-zinc-200">
                ${numMiembros * precioPorPersona} MXN / hora
              </span>
            </div>
          </div>

          {/* Paso 4: Selección de Horario */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            {errorDisponibilidad && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorDisponibilidad}
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
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Resumen de reservación</h3>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between items-start">
                <span className="text-zinc-400">Sala:</span>
                <span className="font-semibold text-white text-right">
                  {selectedSala ? selectedSala.nombre_sala : 'Cargando...'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Integrantes:</span>
                <span className="text-white font-semibold">
                  {numMiembros} {numMiembros === 1 ? 'persona' : 'personas'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Tarifa por persona:</span>
                <span className="text-zinc-200">
                  ${precioPorPersona} MXN / h
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Fecha:</span>
                <span className="font-medium text-white">{selectedDate}</span>
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
                <span className="text-white font-medium">
                  {duration} {duration === 1 ? 'hora' : 'horas'}
                </span>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-white block">Total a pagar:</span>
                  <span className="text-[11px] text-zinc-500">
                    {numMiembros} pers. × ${precioPorPersona} × {duration} h
                  </span>
                </div>
                <span className="text-2xl font-black text-white">${totalPrice} MXN</span>
              </div>
            </div>

            {isAuthenticated ? (
              <p className="text-xs text-zinc-400">
                Sesión iniciada como <strong className="text-zinc-200">{user?.name || user?.nombre || user?.email}</strong>
              </p>
            ) : (
              <p className="text-xs text-zinc-400">
                Se te solicitará iniciar sesión en el siguiente paso para confirmar tu reservación.
              </p>
            )}

            <button
              type="button"
              disabled={startHour === null || !selectedSala}
              onClick={handleContinueToPayment}
              className="w-full py-3.5 bg-wine-500 hover:bg-wine-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl border border-wine-400/20 flex items-center justify-center shadow-md shadow-black/40 transition-all cursor-pointer text-sm"
            >
              {isAuthenticated ? 'Continuar al pago' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
