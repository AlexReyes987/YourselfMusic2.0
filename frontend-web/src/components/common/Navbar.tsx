import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Calendar, User, LogIn } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-zinc-800 bg-brand-dark/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white hover:text-orange-500 transition-colors">
            <Music className="w-6 h-6 text-orange-500" />
            <span>YourSelf <span className="text-orange-500">Music</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/booking" className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>Reservar Sala</span>
            </Link>
            <Link to="/my-reservations" className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              <User className="w-4 h-4 text-orange-400" />
              <span>Mis Reservas</span>
            </Link>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

