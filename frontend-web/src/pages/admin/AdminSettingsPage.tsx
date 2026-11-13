import React from 'react';
import { Sliders, Clock, MapPin } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white">Configuración del Estudio</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Parámetros operativos generales de YourSelf Music (Durango, Dgo.).
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-[#141417] border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Clock className="w-4 h-4 text-orange-400" />
            <span>Horarios de Operación</span>
          </div>
          <p className="text-xs text-zinc-400">
            Horario activo de ensayos: <strong className="text-zinc-200">Lunes a sábado de 12:00 PM a 11:00 PM (12:00 a 23:00 hrs)</strong>. Los domingos el estudio permanece cerrado.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141417] border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sliders className="w-4 h-4 text-orange-400" />
            <span>Reglas de Solapamiento y Cancelación</span>
          </div>
          <p className="text-xs text-zinc-400">
            Bloques por hora cerrada (12:00 a 23:00 hrs). Cero reservaciones coincidentes en la misma sala física. Cancelaciones realizadas el mismo día del ensayo o 1 día antes generan una multa fija de $105.00 MXN por toda la banda; cancelaciones con 2 o más días de anticipación están libres de multa ($0.00 MXN).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141417] border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <MapPin className="w-4 h-4 text-orange-400" />
            <span>Ubicación y Datos de Contacto Oficiales</span>
          </div>
          <p className="text-xs text-zinc-400">
            YourSelf Music — Ubicados en Av. Gral. Lázaro Cárdenas 305, Guillermina, 34270 Durango, Dgo.
          </p>
          <p className="text-xs text-zinc-400">
            WhatsApp / Teléfono de contacto: <strong className="text-zinc-200">618 113 3482</strong>
          </p>
          <p className="text-xs text-zinc-400">
            Correo electrónico oficial: <strong className="text-zinc-200">yourself_music@hotmail.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
