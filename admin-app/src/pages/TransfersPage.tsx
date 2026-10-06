import React, { useState } from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface TransferItem {
  id: string;
  reservationId: string;
  clientName: string;
  roomName: string;
  date: string;
  hours: string;
  amount: number;
  transactionRef: string;
  status: 'pending' | 'completed' | 'rejected';
}

const INITIAL_TRANSFERS: TransferItem[] = [
  {
    id: 'pay-001',
    reservationId: 'res-891',
    clientName: 'Carlos Mendoza (Banda Los Alacranes)',
    roomName: 'Sala 1 - Master Stage',
    date: '2026-10-07',
    hours: '16:00 - 18:00 (2 hrs)',
    amount: 500,
    transactionRef: 'SPEI-992140',
    status: 'pending',
  },
  {
    id: 'pay-002',
    reservationId: 'res-892',
    clientName: 'Mariana Ríos (Ensamble de Jazz)',
    roomName: 'Sala 3 - Acoustic & Jazz',
    date: '2026-10-08',
    hours: '18:00 - 20:00 (2 hrs)',
    amount: 440,
    transactionRef: 'SPEI-771239',
    status: 'pending',
  },
];

export const TransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<TransferItem[]>(INITIAL_TRANSFERS);
  const [message, setMessage] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'completed' } : t))
    );
    setMessage(`Transferencia ${id} aprobada con éxito. La reservación ha pasado a estado "Confirmada".`);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleReject = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'rejected' } : t))
    );
    setMessage(`Transferencia ${id} rechazada.`);
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Validación de Transferencias Bancarias</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Revisa los comprobantes SPEI y aprueba para cambiar las reservas a estado "Confirmada".
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="border border-[#2a3142] rounded-2xl bg-[#181b24] overflow-hidden">
        <div className="p-4 border-b border-[#2a3142] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Depósitos Pendientes por Verificar</h3>
          <span className="text-xs text-zinc-400">
            Total pendientes: <strong className="text-orange-400">{transfers.filter((t) => t.status === 'pending').length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#1f2430] border-b border-[#2a3142] text-zinc-400 font-semibold">
                <th className="p-3">Ref. Rastreo</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Sala & Fecha</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((item) => (
                <tr key={item.id} className="border-b border-[#2a3142]/60 hover:bg-zinc-800/20">
                  <td className="p-3 font-mono font-bold text-orange-400">{item.transactionRef}</td>
                  <td className="p-3 font-medium text-white">{item.clientName}</td>
                  <td className="p-3 text-zinc-300">
                    <div>{item.roomName}</div>
                    <div className="text-[11px] text-zinc-500">{item.date} — {item.hours}</div>
                  </td>
                  <td className="p-3 font-bold text-emerald-400">${item.amount} MXN</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : item.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {item.status === 'completed' ? 'Aprobada' : item.status === 'pending' ? 'Por Validar' : 'Rechazada'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {item.status === 'pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 font-semibold flex items-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">Procesado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
