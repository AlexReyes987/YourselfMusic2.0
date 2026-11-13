import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayName = user?.name || user?.nombre || user?.email?.split('@')[0] || 'Cliente';

  return (
    <nav className="border-b border-zinc-800/80 bg-brand-dark/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-black text-xl tracking-tight text-white hover:text-orange-500 transition-colors"
          >
            <img src="/logoyus.png" alt="Logo Yourself Music" className="h-8 w-auto" />
            <span>
              YourSelf <span className="text-orange-500">Music</span>
            </span>
          </Link>

          {/* Enlaces de Navegación */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to={isAuthenticated ? '/booking' : '/login'}
              state={
                isAuthenticated
                  ? undefined
                  : {
                      from: '/booking',
                      message: 'Inicia sesión o crea tu cuenta para reservar una sala de ensayo.',
                    }
              }
              className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Reservar sala
            </Link>

            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-xs sm:text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20"
                  >
                    Panel de administración
                  </Link>
                )}
                <Link
                  to="/my-reservations"
                  className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Mis reservaciones
                </Link>

                {/* Usuario Autenticado */}
                <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                  <span className="font-medium max-w-[140px] truncate" title={displayName}>
                    {displayName}
                  </span>
                </div>

                {/* Botón Salir */}
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="text-xs font-medium px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors border border-zinc-700/60 cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium px-3.5 py-1.5 text-zinc-300 hover:text-white transition-colors"
                >
                  Iniciar sesión
                </Link>

                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-semibold px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
