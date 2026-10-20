import React, { useState, useEffect } from 'react';
import { Music, Users, DollarSign, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import { adminSupabaseService } from '../services/adminSupabaseService';
import { Sala } from '../types/database';

export const RoomsPage: React.FC = () => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarSalas = async () => {
    setLoading(true);
    try {
      const data = await adminSupabaseService.getSalas();
      setSalas(data);
    } catch (err) {
      console.error('Error cargando salas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSalas();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Music className="w-6 h-6 text-orange-500" />
            Catálogo Oficial de las 4 Salas de Ensayo
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Supervisión y especificaciones técnicas de las 4 salas físicas del estudio Yourself Music 2.0.
          </p>
        </div>

        <button
          onClick={() => cargarSalas()}
          className="p-2 rounded-xl bg-[#181b24] hover:bg-zinc-800 border border-[#2a3142] text-zinc-300 hover:text-white transition-colors"
          title="Recargar salas"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-400 border border-[#2a3142] rounded-2xl bg-[#181b24]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" />
          <p className="text-xs">Cargando salas desde la base de datos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {salas.map((room) => (
            <div
              key={room.sala_id}
              className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-4 hover:border-orange-500/40 transition-colors shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400 text-sm">
                    {room.sala_id}
                  </div>
                  <h3 className="font-bold text-white text-sm">{room.nombre_sala}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{room.estado === 'active' ? 'Activa' : room.estado}</span>
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-[#1f2430]/60 p-3 rounded-xl border border-[#2a3142]">
                {room.descripcion || 'Equipamiento profesional de audio e instrumentos.'}
              </p>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2a3142]/60">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <span>Capacidad: <strong className="text-white">{room.capacidad} músicos</strong></span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>${room.precio_por_hora} MXN / hora</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
