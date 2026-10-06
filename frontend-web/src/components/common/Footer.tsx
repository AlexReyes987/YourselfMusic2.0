import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800 bg-brand-dark py-8 text-center text-sm text-zinc-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <p className="font-medium text-zinc-400">YourSelf Music • Estudio de Ensayo</p>
        <p className="mt-1 text-xs">Durango, Dgo. — Sistema exclusivo de reserva de salas 1, 2, 3 y 4.</p>
        <p className="mt-2 text-[11px] text-zinc-600">© {new Date().getFullYear()} YourSelf Music. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

