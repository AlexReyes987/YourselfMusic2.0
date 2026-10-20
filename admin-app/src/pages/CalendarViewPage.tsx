import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, RotateCcw, Loader2 } from 'lucide-react';
import { ScheduleGrid } from '../components/calendar/ScheduleGrid';
import { adminSupabaseService } from '../services/adminSupabaseService';
import { ReservacionCompleta } from '../types/database';
import { CrearReservacionModal } from '../components/reservations/CrearReservacionModal';
import { ModificarHorarioModal } from '../components/reservations/ModificarHorarioModal';
import { CancelarReservacionModal } from '../components/reservations/CancelarReservacionModal';

export const CalendarViewPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reservaciones, setReservaciones] = useState<ReservacionCompleta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modales
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [crearInitialRoom, setCrearInitialRoom] = useState<number>(1);
  const [crearInitialHour, setCrearInitialHour] = useState<number>(14);

  const [isModificarOpen, setIsModificarOpen] = useState(false);
  const [isCancelarOpen, setIsCancelarOpen] = useState(false);
  const [resSeleccionada, setResSeleccionada] = useState<ReservacionCompleta | null>(null);

  const cargarReservaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSupabaseService.getReservacionesConRelaciones({
        fecha: currentDate,
      });
      setReservaciones(data);
    } catch (err) {
      console.error('Error al cargar reservaciones para calendario:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    cargarReservaciones();
  }, [cargarReservaciones]);

  const cambiarDia = (dias: number) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + dias);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleSelectSlot = (salaId: number, hour: number) => {
    setCrearInitialRoom(salaId);
    setCrearInitialHour(hour);
    setIsCrearOpen(true);
  };

  const handleSelectReservacion = (res: ReservacionCompleta) => {
    setResSeleccionada(res);
    setIsModificarOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-orange-500" />
            Matriz de Ocupación por Sala
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Supervisión directa de las 4 salas de ensayo de 10:00 a 22:00 hrs. Haz clic en un espacio para agendar o editar.
          </p>
        </div>

        {/* Controles de fecha y botón crear */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#181b24] border border-[#2a3142] rounded-xl p-1">
            <button
              onClick={() => cambiarDia(-1)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="px-2 py-1 bg-transparent text-xs text-white focus:outline-none font-medium text-center"
            />
            <button
              onClick={() => cambiarDia(1)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-xl bg-[#181b24] border border-[#2a3142] text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Hoy
          </button>

          <button
            onClick={() => cargarReservaciones()}
            className="p-2 rounded-xl bg-[#181b24] hover:bg-zinc-800 border border-[#2a3142] text-zinc-300 hover:text-white transition-colors"
            title="Recargar"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              setCrearInitialRoom(1);
              setCrearInitialHour(14);
              setIsCrearOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-400 border border-[#2a3142] rounded-2xl bg-[#181b24]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
          <p className="text-sm font-medium">Consultando ocupación de las 4 salas...</p>
        </div>
      ) : (
        <ScheduleGrid
          date={currentDate}
          reservaciones={reservaciones}
          onSelectSlot={handleSelectSlot}
          onSelectReservacion={handleSelectReservacion}
        />
      )}

      {/* Modales */}
      <CrearReservacionModal
        isOpen={isCrearOpen}
        onClose={() => setIsCrearOpen(false)}
        initialDate={currentDate}
        initialSalaId={crearInitialRoom}
        initialHour={crearInitialHour}
        onSuccess={() => {
          cargarReservaciones();
        }}
      />

      <ModificarHorarioModal
        isOpen={isModificarOpen}
        onClose={() => {
          setIsModificarOpen(false);
          setResSeleccionada(null);
        }}
        onSuccess={() => {
          cargarReservaciones();
        }}
        reservacion={resSeleccionada}
      />

      <CancelarReservacionModal
        isOpen={isCancelarOpen}
        onClose={() => {
          setIsCancelarOpen(false);
          setResSeleccionada(null);
        }}
        onSuccess={() => {
          cargarReservaciones();
        }}
        reservacion={resSeleccionada}
      />
    </div>
  );
};
