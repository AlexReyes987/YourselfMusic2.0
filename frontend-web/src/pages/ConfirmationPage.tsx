import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Calendar, MapPin, ArrowLeft, Volume2, CreditCard } from 'lucide-react';

export const ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as {
    folio?: string;
    roomName?: string;
    date?: string;
    hours?: string;
    paymentMethod?: string;
    totalPrice?: number;
  } | undefined;

  const folio = state?.folio || 'YM-2026-0842';

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <h1 className="text-3xl font-extrabold text-white">¡Reservación Confirmada!</h1>
      <p className="text-sm text-zinc-400">
        Tu sala de ensayo ha quedado apartada exitosamente. Te esperamos en YourSelf Music.
      </p>

      <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl text-left space-y-3 text-sm">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="text-xs text-zinc-400">Folio:</span>
          <span className="font-mono text-orange-400 font-bold">{folio}</span>
        </div>
        {state?.roomName && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Volume2 className="w-4 h-4 text-orange-400" />
            <span>Sala: <strong className="text-white">{state.roomName}</strong></span>
          </div>
        )}
        <div className="flex items-center gap-2 text-zinc-300">
          <Calendar className="w-4 h-4 text-orange-400" />
          <span>Fecha: <strong className="text-white">{state?.date || 'Fecha agendada'}</strong> {state?.hours && `(${state.hours})`}</span>
        </div>
        {state?.totalPrice && (
          <div className="flex items-center gap-2 text-zinc-300">
            <CreditCard className="w-4 h-4 text-orange-400" />
            <span>Monto: <strong className="text-emerald-400">${state.totalPrice} MXN</strong> ({state.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia SPEI'})</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-zinc-300">
          <MapPin className="w-4 h-4 text-orange-400" />
          <span>YourSelf Music Estudio — Durango, Dgo.</span>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </Link>
        <Link
          to="/my-reservations"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
        >
          <span>Ver Mis Reservas</span>
        </Link>
      </div>
    </div>
  );
};
