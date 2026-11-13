import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sala } from '../types';
import { roomService } from '../services/roomService';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  const handleGoToBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: '/booking',
          message: 'Inicia sesión o crea tu cuenta para reservar una sala de ensayo.',
        },
      });
      return;
    }
    navigate('/booking');
  };

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

        <p className="text-xs sm:text-sm text-zinc-400">
          Horario de servicio: <strong className="text-zinc-200">lunes a sábado de 12:00 PM a 11:00 PM</strong>
        </p>

        <div className="pt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleGoToBooking}
            className="px-7 py-3.5 bg-wine-500 hover:bg-wine-600 text-white font-semibold rounded-xl border border-wine-400/20 shadow-md shadow-black/40 transition-all text-sm sm:text-base cursor-pointer"
          >
            Reservar sala ahora
          </button>
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
          <button
            type="button"
            onClick={handleGoToBooking}
            className="text-xs sm:text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors text-left sm:text-right cursor-pointer"
          >
            Ver disponibilidad de horarios
          </button>
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
                <button
                  type="button"
                  onClick={handleGoToBooking}
                  className="text-orange-400 font-semibold hover:underline cursor-pointer"
                >
                  Reservar
                </button>
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
          <h3 className="font-bold text-white text-base">Horario de atención</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Servicio de lunes a sábado de 12:00 PM a 11:00 PM. Consulta los horarios libres al instante y aparta tus horas de ensayo.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2">
          <h3 className="font-bold text-white text-base">Pago en línea seguro</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Confirma tu reservación al momento con tarjeta de crédito, débito o transferencia bancaria SPEI.
          </p>
        </div>
      </div>

      {/* Sección de Contacto Directo */}
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            ¿Necesitas atención personalizada? Contáctanos directamente
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Si tienes dudas sobre equipamiento, horarios especiales o tus reservaciones, comunícate con nosotros por WhatsApp o correo electrónico.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <a
            href="https://wa.me/526181133482"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-xl bg-wine-500 hover:bg-wine-600 text-white text-xs sm:text-sm font-semibold text-center border border-wine-400/20 transition-colors"
          >
            WhatsApp
          </a>
          <a
            href="mailto:yourself_music@hotmail.com"
            className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs sm:text-sm font-semibold text-center border border-zinc-700 transition-colors"
          >
            yourself_music@hotmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
