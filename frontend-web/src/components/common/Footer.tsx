import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800 bg-brand-dark py-8 text-center text-sm text-zinc-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 space-y-3">
        <p className="font-semibold text-zinc-300">YourSelf Music • Estudio de Ensayo</p>
        <p className="text-xs text-zinc-400">
          Durango, Dgo. — Horario de servicio: lunes a sábado de 12:00 PM a 11:00 PM.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-300 pt-1">
          <a
            href="https://wa.me/526181133482"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-400 transition-colors"
          >
            WhatsApp <strong className="font-mono text-white"></strong>
          </a>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <a
            href="mailto:yourself_music@hotmail.com"
            className="hover:text-orange-400 transition-colors"
          >
            Correo: <strong className="text-white">yourself_music@hotmail.com</strong>
          </a>
        </div>
        <p className="pt-2 text-[11px] text-zinc-600">
          © {new Date().getFullYear()} YourSelf Music. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};
