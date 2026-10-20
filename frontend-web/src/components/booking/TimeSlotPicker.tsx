import React from 'react';
import { Clock, AlertCircle, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { RangoLibre } from '../../types';

interface TimeSlotPickerProps {
  selectedStartHour: number | null;
  selectedDuration: number;
  onSelectSlot: (startHour: number, duration: number) => void;
  horasLibres: number[];
  rangosLibres: RangoLibre[];
  horaApertura?: string;
  horaCierre?: string;
  isLoading?: boolean;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedStartHour,
  selectedDuration,
  onSelectSlot,
  horasLibres,
  rangosLibres,
  horaApertura = '10:00:00',
  horaCierre = '22:00:00',
  isLoading = false,
}) => {
  const aperturaHour = parseInt(horaApertura.split(':')[0], 10);
  const cierreHour = parseInt(horaCierre.split(':')[0], 10);

  // Generar lista de horas operativas
  const allHours: number[] = [];
  for (let h = aperturaHour; h < cierreHour; h++) {
    allHours.push(h);
  }

  // Verifica si un bloque continuo [startHour, startHour + duration) está 100% libre
  const canBookDuration = (start: number, dur: number): boolean => {
    if (start + dur > cierreHour) return false;
    for (let h = start; h < start + dur; h++) {
      if (!horasLibres.includes(h)) return false;
    }
    return true;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Clock className="w-4 h-4 text-orange-400" />
          <span>Disponibilidad en Tiempo Real</span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-1.5 text-xs text-orange-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Consultando Supabase...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {horasLibres.length} horas libres
            </span>
          </div>
        )}
      </div>

      {/* Rangos Libres Sugeridos */}
      {rangosLibres.length > 0 && !isLoading && (
        <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-xs text-zinc-300 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-orange-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rangos continuos libres:</span>
          </div>
          {rangosLibres.map((r, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-white font-mono text-[11px]"
            >
              {r.hora_inicio.slice(0, 5)} - {r.hora_fin.slice(0, 5)}
            </span>
          ))}
        </div>
      )}

      {/* Cuadrícula de Bloques Horarios */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-300 block">
          1. Selecciona la hora de inicio:
        </label>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {allHours.map((h) => (
              <div
                key={h}
                className="py-3 rounded-xl bg-zinc-800/40 border border-zinc-800 animate-pulse text-center"
              >
                <div className="h-4 w-12 bg-zinc-700/40 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {allHours.map((hour) => {
              const isFree = horasLibres.includes(hour);

              // Determinar si esta hora está dentro del bloque seleccionado [start, start + duration)
              const isInSelectedBlock =
                selectedStartHour !== null &&
                hour >= selectedStartHour &&
                hour < selectedStartHour + selectedDuration;

              const isStartOfSelected = selectedStartHour === hour;

              return (
                <button
                  key={hour}
                  type="button"
                  disabled={!isFree}
                  onClick={() => {
                    // Si el start seleccionado no puede cubrir la duración actual, ajustar duración
                    const validDuration = canBookDuration(hour, selectedDuration)
                      ? selectedDuration
                      : 1;
                    onSelectSlot(hour, validDuration);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                    !isFree
                      ? 'border-zinc-800 bg-zinc-900/40 text-zinc-600 cursor-not-allowed line-through'
                      : isStartOfSelected
                      ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20 ring-2 ring-orange-400'
                      : isInSelectedBlock
                      ? 'border-orange-500/50 bg-orange-500/20 text-orange-200'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:border-orange-500/50 hover:bg-zinc-800 cursor-pointer'
                  }`}
                >
                  <span className="font-mono text-xs">{hour}:00</span>
                  <span className="text-[9px] font-normal tracking-tight">
                    {isFree ? (isStartOfSelected ? 'Inicio' : isInSelectedBlock ? 'Reservado' : 'Disponible') : 'Ocupada'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selector de Duración (1 a 4 horas) */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-semibold text-zinc-300 block">
          2. Duración del ensayo (bloques de 1 hora):
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((dur) => {
            const isPossible = selectedStartHour !== null
              ? canBookDuration(selectedStartHour, dur)
              : true;

            const isSelected = selectedDuration === dur;

            return (
              <button
                key={dur}
                type="button"
                disabled={!isPossible}
                onClick={() => selectedStartHour && onSelectSlot(selectedStartHour, dur)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  !isPossible
                    ? 'border-zinc-800 bg-zinc-900/40 text-zinc-600 cursor-not-allowed line-through'
                    : isSelected
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400 ring-1 ring-orange-500 font-bold'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white cursor-pointer'
                }`}
              >
                {isSelected ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                <span>{dur} {dur === 1 ? 'Hora' : 'Horas'}</span>
              </button>
            );
          })}
        </div>

        {selectedStartHour !== null && !canBookDuration(selectedStartHour, selectedDuration) && (
          <p className="text-[11px] text-amber-400 flex items-center gap-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>La duración seleccionada se solapa con una reservación posterior. Selecciona un bloque menor.</span>
          </p>
        )}
      </div>

      {/* Resumen del bloque */}
      {selectedStartHour !== null && (
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
          <span className="text-zinc-400">Horario definido:</span>
          <span className="font-mono font-bold text-orange-400">
            {String(selectedStartHour).padStart(2, '0')}:00 -{' '}
            {String(selectedStartHour + selectedDuration).padStart(2, '0')}:00 ({selectedDuration} hrs)
          </span>
        </div>
      )}
    </div>
  );
};
