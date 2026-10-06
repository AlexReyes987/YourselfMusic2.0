import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomCard } from '../components/booking/RoomCard';
import { TimeSlotPicker } from '../components/booking/TimeSlotPicker';
import { Room } from '../types';
import { Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

const MOCK_ROOMS: Room[] = [
  {
    id: 1,
    name: 'Sala 1 - Master Stage',
    equipment_description: 'Batería Pearl Masters, Amplificadores Marshall JCM800 y Fender Twin Reverb, PA Yamaha 2000W.',
    hourly_rate: 250,
    status: 'active',
  },
  {
    id: 2,
    name: 'Sala 2 - Rocker Studio',
    equipment_description: 'Batería Tama Superstar, Amplis Vox AC30 y Ampeg Bass, Microfonía Shure SM58.',
    hourly_rate: 200,
    status: 'active',
  },
  {
    id: 3,
    name: 'Sala 3 - Acoustic & Jazz',
    equipment_description: 'Piano acústico vertical Yamaha, Batería Gretsch Catalina Jazz, Monitoreo de precisión.',
    hourly_rate: 220,
    status: 'active',
  },
  {
    id: 4,
    name: 'Sala 4 - Indie Rehearsal',
    equipment_description: 'Batería Mapex, Amplis Orange y Fender Rumble Bass, ideal para ensambles compactos.',
    hourly_rate: 180,
    status: 'active',
  },
];

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState<number | null>(16);
  const [duration, setDuration] = useState<number>(2);

  const selectedRoom = MOCK_ROOMS.find((r) => r.id === selectedRoomId);
  const totalPrice = selectedRoom ? selectedRoom.hourly_rate * duration : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Reserva tu Sala de Ensayo</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configura fecha, sala y horario en bloques cerrados. Cero duplicidades de reservación.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Paso 1: Selección de Fecha */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <CalendarIcon className="w-4 h-4 text-orange-400" />
              <span>1. Selecciona la Fecha del Ensayo</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Paso 2: Selección de Sala (1 - 4) */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">
              2. Selecciona una de nuestras 4 Salas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_ROOMS.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  selected={selectedRoomId === room.id}
                  onSelect={setSelectedRoomId}
                />
              ))}
            </div>
          </div>

          {/* Paso 3: Selector de Horario */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            <TimeSlotPicker
              selectedStartHour={startHour}
              selectedDuration={duration}
              onSelectSlot={(sh, dur) => {
                setStartHour(sh);
                setDuration(dur);
              }}
            />
          </div>
        </div>

        {/* Resumen de Reserva Lateral */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl sticky top-24 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-3">
              Resumen de la Cita
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Sala:</span>
                <span className="font-semibold text-white">{selectedRoom?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fecha:</span>
                <span className="font-semibold text-white">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Horario:</span>
                <span className="font-semibold text-white">
                  {startHour}:00 - {startHour ? startHour + duration : 0}:00
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Duración:</span>
                <span className="font-semibold text-white">{duration} horas</span>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-white">Total:</span>
                <span className="text-2xl font-black text-orange-400">${totalPrice} MXN</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!startHour || !selectedRoom) return;
                navigate('/payment', {
                  state: {
                    roomId: selectedRoom.id,
                    roomName: selectedRoom.name,
                    date: selectedDate,
                    startHour,
                    duration,
                    totalPrice,
                  },
                });
              }}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <span>Continuar al Pago</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

