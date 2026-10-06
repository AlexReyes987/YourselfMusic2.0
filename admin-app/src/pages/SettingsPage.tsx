import React from 'react';
import { Sliders, Clock, MapPin } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white">Configuración del Estudio</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Parámetros operativos generales de YourSelf Music (Durango, Dgo.).
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Clock className="w-4 h-4 text-orange-400" />
            <span>Horarios de Operación</span>
          </div>
          <p className="text-xs text-zinc-400">
            Horario activo de reservaciones: <strong>10:00 AM a 10:00 PM (10:00 - 22:00)</strong> todos los días.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sliders className="w-4 h-4 text-orange-400" />
            <span>Reglas de Solapamiento y Cancelación</span>
          </div>
          <p className="text-xs text-zinc-400">
            Bloques indivisibles por hora cerrada. Cero reservaciones coincidentes en la misma sala física.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#181b24] border border-[#2a3142] space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <MapPin className="w-4 h-4 text-orange-400" />
            <span>Ubicación y Datos de Contacto</span>
          </div>
          <p className="text-xs text-zinc-400">
            YourSelf Music — Estudio de Ensayo Musical en Durango, Dgo., México.
          </p>
        </div>
      </div>
    </div>
  );
};
