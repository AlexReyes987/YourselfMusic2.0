import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Calendar, User, LogIn, LogOut, UserPlus } from 'lucide-react';
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
    <nav className="border-b border-zinc-800 bg-brand-dark/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-black text-xl tracking-tight text-white hover:text-orange-500 transition-colors"
          >
            <img src="/logoyus.png" alt="Logo Yourself Music" className="h-8 w-auto" />
            <span>
              YourSelf <span className="text-orange-500">Music</span>
            </span>
          </Link>

          {/* Enlaces de Navegación */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              to="/booking"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>Reservar Sala</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-reservations"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
                >
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span>Mis Reservas</span>
                </Link>

                {/* Badge de Usuario Autenticado */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/80 text-xs text-zinc-200">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="font-semibold max-w-[130px] truncate" title={displayName}>
                    {displayName}
                  </span>
                </div>

                {/* Botón Salir */}
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors border border-zinc-700/60 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg transition-colors border border-zinc-700/80"
                >
                  <LogIn className="w-3.5 h-3.5 text-orange-400" />
                  <span>Ingresar</span>
                </Link>

                <Link
                  to="/register"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm shadow-orange-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Crear Cuenta</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
