import React from 'react';
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
  horaApertura = '12:00:00',
  horaCierre = '23:00:00',
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
        <span className="text-sm font-bold text-white">4. Selecciona el horario</span>

        {isLoading ? (
          <span className="text-xs text-zinc-400">Consultando horarios...</span>
        ) : (
          <span className="text-xs text-zinc-400">
            {horasLibres.length} {horasLibres.length === 1 ? 'hora disponible' : 'horas disponibles'}
          </span>
        )}
      </div>

      {/* Horarios disponibles de forma natural y discreta */}
      {rangosLibres.length > 0 && !isLoading && (
        <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-1.5">
          <span>Horarios disponibles hoy:</span>
          {rangosLibres.map((r, idx) => (
            <span key={idx} className="text-zinc-200 font-medium">
              {r.hora_inicio.slice(0, 5)} a {r.hora_fin.slice(0, 5)} hrs
              {idx < rangosLibres.length - 1 ? ',' : ''}
            </span>
          ))}
        </div>
      )}

      {/* Cuadrícula de Bloques Horarios */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-300 block">
          Hora de inicio:
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
                    const validDuration = canBookDuration(hour, selectedDuration)
                      ? selectedDuration
                      : 1;
                    onSelectSlot(hour, validDuration);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                    !isFree
                      ? 'border-zinc-800 bg-zinc-900/40 text-zinc-600 cursor-not-allowed line-through'
                      : isStartOfSelected
                      ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : isInSelectedBlock
                      ? 'border-orange-500/50 bg-orange-500/20 text-orange-200'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 cursor-pointer'
                  }`}
                >
                  <span className="font-mono text-xs">{hour}:00</span>
                  <span className="text-[10px] font-normal tracking-tight">
                    {isFree
                      ? isStartOfSelected
                        ? 'Inicio'
                        : isInSelectedBlock
                        ? 'Seleccionado'
                        : 'Disponible'
                      : 'Ocupado'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selector de Duración (1 a 4 horas) */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-medium text-zinc-300 block">
          Duración del ensayo:
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((dur) => {
            const isPossible =
              selectedStartHour !== null ? canBookDuration(selectedStartHour, dur) : true;

            const isSelected = selectedDuration === dur;

            return (
              <button
                key={dur}
                type="button"
                disabled={!isPossible}
                onClick={() => selectedStartHour && onSelectSlot(selectedStartHour, dur)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center ${
                  !isPossible
                    ? 'border-zinc-800 bg-zinc-900/40 text-zinc-600 cursor-not-allowed line-through'
                    : isSelected
                    ? 'border-orange-500 bg-orange-500/15 text-orange-400 font-bold'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white cursor-pointer'
                }`}
              >
                <span>
                  {dur} {dur === 1 ? 'hora' : 'horas'}
                </span>
              </button>
            );
          })}
        </div>

        {selectedStartHour !== null && !canBookDuration(selectedStartHour, selectedDuration) && (
          <p className="text-xs text-amber-400 pt-1">
            La duración seleccionada coincide con un horario ocupado posterior. Elige una duración menor.
          </p>
        )}
      </div>

      {/* Resumen del bloque */}
      {selectedStartHour !== null && (
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span>Horario seleccionado:</span>
          <span className="font-medium text-zinc-200">
            {String(selectedStartHour).padStart(2, '0')}:00 a{' '}
            {String(selectedStartHour + selectedDuration).padStart(2, '0')}:00 hrs ({selectedDuration}{' '}
            {selectedDuration === 1 ? 'hora' : 'horas'})
          </span>
        </div>
      )}
    </div>
  );
};
