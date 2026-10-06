import React from 'react';

export const ReservationsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Gestión de Reservaciones (CRUD)</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Control de cancelaciones, reprogramación y consulta de reservas de clientes.
        </p>
      </div>

      <div className="border border-[#2a3142] rounded-2xl bg-[#181b24] p-4 text-xs text-zinc-400">
        Tabla administrativa con filtros por estado (Confirmada, Pendiente, Cancelada) y búsqueda por cliente.
      </div>
    </div>
  );
};

