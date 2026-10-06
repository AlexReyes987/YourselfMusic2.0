import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
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
          aislamiento acústico y disponibilidad en tiempo real.
        </p>

        <div className="pt-4 flex items-center justify-center gap-4">
          <Link
            to="/booking"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
          >
            <CalendarCheck className="w-5 h-5" />
            <span>Reservar Sala Ahora</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
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
            Paga en línea al instante con tarjeta bancaria o registra tu transferencia con validación manual.
          </p>
        </div>
      </div>
    </div>
  );
};

