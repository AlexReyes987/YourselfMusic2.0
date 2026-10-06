import React from 'react';
import { Clock } from 'lucide-react';

interface TimeSlotPickerProps {
  selectedStartHour: number | null;
  selectedDuration: number;
  onSelectSlot: (startHour: number, duration: number) => void;
  occupiedHours?: number[];
}

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedStartHour,
  selectedDuration,
  onSelectSlot,
  occupiedHours = [],
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <Clock className="w-4 h-4 text-orange-400" />
        <span>Selecciona la hora de inicio y duración</span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {HOURS.map((hour) => {
          const isOccupied = occupiedHours.includes(hour);
          const isSelected = selectedStartHour === hour;

          return (
            <button
              key={hour}
              disabled={isOccupied}
              onClick={() => onSelectSlot(hour, selectedDuration)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                isOccupied
                  ? 'border-zinc-800 bg-zinc-900/40 text-zinc-600 cursor-not-allowed line-through'
                  : isSelected
                  ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {hour}:00
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs text-zinc-400 font-medium">Duración:</span>
        {[1, 2, 3, 4].map((duration) => (
          <button
            key={duration}
            onClick={() => selectedStartHour && onSelectSlot(selectedStartHour, duration)}
            className={`px-3 py-1 rounded text-xs font-semibold border ${
              selectedDuration === duration
                ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            {duration} {duration === 1 ? 'hora' : 'horas'}
          </button>
        ))}
      </div>
    </div>
  );
};

