import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, Zap, Sparkles, ArrowRight, Volume2, Users } from 'lucide-react';
import { Sala } from '../types';
import { roomService } from '../services/roomService';

export const HomePage: React.FC = () => {
  const [salas, setSalas] = useState<Sala[]>([]);

  useEffect(() => {
    async function loadSalas() {
      try {
        const data = await roomService.getAll();
        setSalas(data);
      } catch (err) {
        console.error('Error cargando salas en home:', err);
      }
    }
    loadSalas();
  }, []);

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-20">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>Estudio de ensayo profesional en Durango, Dgo.</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Enfócate en tu música, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
            nosotros cuidamos tu sonido.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
          Reserva una de nuestras 4 salas completamente equipadas con backline profesional,
          aislamiento acústico y disponibilidad en tiempo real sincronizada con Supabase.
        </p>

        <div className="pt-4 flex items-center justify-center gap-4">
          <Link
            to="/booking"
            className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 text-sm sm:text-base cursor-pointer"
          >
            <CalendarCheck className="w-5 h-5" />
            <span>Reservar Sala Ahora</span>
          </Link>
        </div>
      </div>

      {/* Catálogo de las 4 Salas Físicas */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Nuestras 4 Salas de Ensayo
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Equipamiento de alta gama, acústica tratada y ambiente climatizado.
            </p>
          </div>
          <Link
            to="/booking"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            <span>Ver disponibilidad de horarios</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {salas.map((sala) => (
            <div
              key={sala.sala_id}
              className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-orange-400 border border-zinc-700">
                    Sala #{sala.sala_id}
                  </span>
                  <Volume2 className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors">
                  {sala.nombre_sala}
                </h3>
                <p className="text-xs text-orange-400 font-bold mt-1">
                  ${sala.precio_por_hora} MXN <span className="text-zinc-500 font-normal">/ h</span>
                </p>

                <p className="mt-3 text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {sala.descripcion}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{sala.capacidad} músicos</span>
                </span>
                <Link
                  to="/booking"
                  className="text-orange-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Reservar</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Características del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
          <Zap className="w-6 h-6 text-orange-400" />
          <h3 className="font-bold text-white text-base">4 Salas Especializadas</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Desde salas para tríos íntimos hasta salas amplias para orquestas o ensambles de rock completo.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
          <CalendarCheck className="w-6 h-6 text-orange-400" />
          <h3 className="font-bold text-white text-base">Cero Solapamientos</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Sistema automatizado que garantiza que tu sala esté 100% apartada sin duplicidades de horario.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
          <ShieldCheck className="w-6 h-6 text-orange-400" />
          <h3 className="font-bold text-white text-base">Pagos Seguros</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Paga en línea al instante con tarjeta bancaria o registra tu transferencia SPEI con validación manual.
          </p>
        </div>
      </div>
    </div>
  );
};
