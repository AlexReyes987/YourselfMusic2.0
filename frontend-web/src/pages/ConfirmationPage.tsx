import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Clock, Calendar, MapPin, ArrowLeft, Volume2, CreditCard, ShieldCheck } from 'lucide-react';

export const ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as {
    folio?: string;
    roomName?: string;
    date?: string;
    hours?: string;
    paymentMethod?: string;
    totalPrice?: number;
    status?: string;
    cliente?: {
      nombre?: string;
      email?: string;
      telefono?: string;
    };
  } | undefined;

  const folio = state?.folio || 'YM-2026-0842';
  const isConfirmed = state?.status === 'confirmed' || state?.paymentMethod === 'card';

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 text-center space-y-6">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border ${
        isConfirmed
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}>
        {isConfirmed ? (
          <CheckCircle2 className="w-10 h-10" />
        ) : (
          <Clock className="w-10 h-10" />
        )}
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {isConfirmed ? '¡Reservación Confirmada!' : '¡Reservación Registrada con Éxito!'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          {isConfirmed
            ? 'Tu sala de ensayo ha quedado apartada y confirmada en Supabase. Te esperamos en YourSelf Music.'
            : 'Tu pago por transferencia SPEI está en proceso de validación administrativa. Recibirás confirmación pronto.'}
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl text-left space-y-3.5 text-xs sm:text-sm shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs text-zinc-400">Folio / ID de Reserva:</span>
          <span className="font-mono text-orange-400 font-bold">{folio}</span>
        </div>

        {state?.cliente?.nombre && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Titular:</span>
            <span className="font-bold text-white">{state.cliente.nombre}</span>
          </div>
        )}

        {state?.roomName && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Volume2 className="w-4 h-4 text-orange-400" />
            <span>Sala: <strong className="text-white">{state.roomName}</strong></span>
          </div>
        )}

        <div className="flex items-center gap-2 text-zinc-300">
          <Calendar className="w-4 h-4 text-orange-400" />
          <span>Fecha y Bloque: <strong className="text-white">{state?.date || 'Fecha'}</strong> {state?.hours && `(${state.hours})`}</span>
        </div>

        {state?.totalPrice && (
          <div className="flex items-center gap-2 text-zinc-300">
            <CreditCard className="w-4 h-4 text-orange-400" />
            <span>Monto: <strong className="text-emerald-400">${state.totalPrice} MXN</strong> ({state.paymentMethod === 'card' ? 'Tarjeta Bancaria' : 'Transferencia SPEI'})</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-xs text-zinc-400">Estado en Supabase:</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isConfirmed
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isConfirmed ? 'Confirmada (confirmed)' : 'Por Validar (pending)'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-zinc-400 text-xs pt-1">
          <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
          <span>YourSelf Music Estudio — Durango, Dgo., México</span>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </Link>
        <Link
          to="/my-reservations"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Ver Mis Reservaciones</span>
        </Link>
      </div>
    </div>
  );
};
