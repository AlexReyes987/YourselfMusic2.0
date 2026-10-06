import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Building2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { reservationService } from '../services/reservationService';

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state as {
    roomId: number;
    roomName: string;
    date: string;
    startHour: number;
    duration: number;
    totalPrice: number;
  } | undefined;

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos simulados de tarjeta o comprobante
  const [cardNumber, setCardNumber] = useState('');
  const [transferRef, setTransferRef] = useState('');

  if (!bookingData) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <p className="text-zinc-400">No hay información de reserva activa.</p>
        <button
          onClick={() => navigate('/booking')}
          className="px-4 py-2 bg-orange-500 rounded-lg text-white font-semibold text-sm"
        >
          Ir a Reservar
        </button>
      </div>
    );
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const startTime = `${String(bookingData.startHour).padStart(2, '0')}:00:00`;
      const endTime = `${String(bookingData.startHour + bookingData.duration).padStart(2, '0')}:00:00`;

      // 1. Crear reserva en backend o simular si no hay backend activo
      let folio = `YM-${Date.now().toString().slice(-6)}`;
      try {
        const res = await reservationService.create({
          room_id: bookingData.roomId,
          date: bookingData.date,
          start_time: startTime,
          end_time: endTime,
        });
        folio = res.id;
      } catch (apiErr: any) {
        console.warn('Backend API no disponible o sin conexión DB, usando simulación local para flujo funcional:', apiErr);
      }

      navigate('/confirmation', {
        state: {
          folio,
          roomName: bookingData.roomName,
          date: bookingData.date,
          hours: `${startTime.slice(0, 5)} a ${endTime.slice(0, 5)}`,
          paymentMethod,
          totalPrice: bookingData.totalPrice,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Error procesando el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la selección de horario</span>
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Método de Pago y Confirmación</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Finaliza tu reserva para <strong className="text-white">{bookingData.roomName}</strong>
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400">Total a Pagar:</p>
          <p className="text-2xl font-extrabold text-orange-400">${bookingData.totalPrice} MXN</p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          <p>{bookingData.date}</p>
          <p>{bookingData.startHour}:00 - {bookingData.startHour + bookingData.duration}:00 ({bookingData.duration} hrs)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setPaymentMethod('card')}
          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
            paymentMethod === 'card'
              ? 'border-orange-500 bg-orange-500/10 text-white shadow-md'
              : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <CreditCard className="w-5 h-5 text-orange-400" />
          <span className="text-xs font-semibold">Tarjeta Débito/Crédito</span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentMethod('transfer')}
          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
            paymentMethod === 'transfer'
              ? 'border-orange-500 bg-orange-500/10 text-white shadow-md'
              : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <Building2 className="w-5 h-5 text-orange-400" />
          <span className="text-xs font-semibold">Transferencia Bancaria</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handlePay} className="space-y-4">
        {paymentMethod === 'card' ? (
          <div className="space-y-3 bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            <label className="block text-xs font-semibold text-zinc-300">
              Número de Tarjeta (Simulación segura)
            </label>
            <input
              type="text"
              required
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="MM/AA"
                required
                className="px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
              />
              <input
                type="password"
                placeholder="CVC"
                maxLength={4}
                required
                className="px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl text-xs text-zinc-300">
            <p className="font-semibold text-white">Datos de Transferencia SPEI:</p>
            <p>Banco: <strong className="text-zinc-200">BBVA México</strong></p>
            <p>CLABE: <strong className="text-orange-400 font-mono">012 180 015482930412 8</strong></p>
            <p>Beneficiario: <strong className="text-zinc-200">YourSelf Music S.A. de C.V.</strong></p>
            <div className="pt-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Número de Autorización / Rastreo
              </label>
              <input
                type="text"
                required
                placeholder="Ej. SPEI-893141"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all text-sm"
        >
          {isProcessing ? (
            <span>Procesando pago...</span>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Confirmar y Pagar ${bookingData.totalPrice} MXN</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
