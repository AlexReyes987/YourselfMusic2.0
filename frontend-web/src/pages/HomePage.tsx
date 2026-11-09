import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Enfócate en tu música, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c45a6b] to-[#8a2232]">
            nosotros cuidamos tu sonido.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
          Reserva una de nuestras 4 salas completamente equipadas con backline profesional,
          aislamiento acústico y consulta de disponibilidad en tiempo real.
        </p>

        <div className="pt-4 flex items-center justify-center gap-4">
          <Link
            to="/booking"
            className="px-7 py-3.5 bg-wine-500 hover:bg-wine-600 text-white font-semibold rounded-xl border border-wine-400/20 shadow-md shadow-black/40 transition-all text-sm sm:text-base cursor-pointer"
          >
            Reservar sala ahora
          </Link>
        </div>
      </div>

      {/* Catálogo de las 4 Salas Físicas */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Nuestras salas de ensayo
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Equipamiento de alta gama, acústica tratada y ambiente climatizado.
            </p>
          </div>
          <Link
            to="/booking"
            className="text-xs sm:text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            Ver disponibilidad de horarios
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
                    Sala {sala.sala_id}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors">
                  {sala.nombre_sala}
                </h3>
                <p className="text-xs text-orange-400 font-bold mt-1">
                  ${sala.precio_por_hora} MXN <span className="text-zinc-500 font-normal">/ persona por hora</span>
                </p>

                <p className="mt-3 text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {sala.descripcion}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>Hasta {sala.capacidad} músicos</span>
                <Link
                  to="/booking"
                  className="text-orange-400 font-semibold hover:underline"
                >
                  Reservar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Características del Estudio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2">
          <h3 className="font-bold text-white text-base">Salas especializadas</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Desde espacios para proyectos solistas o tríos hasta salas amplias para ensambles y bandas completas.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2">
          <h3 className="font-bold text-white text-base">Disponibilidad inmediata</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Consulta los horarios libres al instante y aparta tus horas de ensayo sin contratiempos.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2">
          <h3 className="font-bold text-white text-base">Pago en línea seguro</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Confirma tu reservación al momento con tarjeta de crédito, débito o transferencia bancaria SPEI.
          </p>
        </div>
      </div>
    </div>
  );
};
