import React, { useState } from 'react';
import { ScheduleGrid } from '../components/calendar/ScheduleGrid';

export const CalendarViewPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const mockReservations = [
    {
      id: 'res-1',
      room_id: 1,
      startHour: 14,
      endHour: 16,
      clientName: 'Banda Los Alacranes',
      status: 'confirmed' as const,
    },
    {
      id: 'res-2',
      room_id: 2,
      startHour: 16,
      endHour: 18,
      clientName: 'Ensamble de Jazz Dgo',
      status: 'confirmed' as const,
    },
    {
      id: 'res-3',
      room_id: 3,
      startHour: 18,
      endHour: 20,
      clientName: 'Voz & Piano Trío',
      status: 'pending' as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Matriz de Ocupación por Sala</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Supervisión directa de las 4 salas de ensayo en intervalos de una hora.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#1f2430] border border-[#2a3142] text-xs text-white focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <ScheduleGrid
        date={currentDate}
        reservations={mockReservations}
        onSelectSlot={(roomId, hour) => {
          console.log(`Seleccionada Sala ${roomId} a las ${hour}:00`);
        }}
      />
    </div>
  );
};

