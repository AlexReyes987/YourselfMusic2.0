import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const state = location.state as {
    from?: string;
    bookingData?: any;
    message?: string;
  } | undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(cleanEmail, password);
      login(response.token, response.user);

      // Revisar si había una reservación pendiente en el state o en sessionStorage
      const savedBooking = state?.bookingData || (() => {
        try {
          const raw = sessionStorage.getItem('pendingBooking');
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

      if (savedBooking) {
        navigate('/payment', { state: savedBooking, replace: true });
      } else if (state?.from) {
        navigate(state.from, { replace: true });
      } else {
        navigate('/my-reservations', { replace: true });
      }
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Error al iniciar sesión. Verifica tus credenciales.';
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Banner de aviso si viene de intentar reservar */}
        {state?.message && (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-orange-200">
              <p className="font-semibold text-white mb-0.5">Identificación Requerida</p>
              {state.message}
            </div>
          </div>
        )}

        {/* Tarjeta de Inicio de Sesión */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Iniciar Sesión</h2>
            <p className="text-xs text-zinc-400">
              Accede con tu cuenta para gestionar tus reservaciones en las 4 salas de YourSelf Music.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="tu_correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar a mi Cuenta</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-400">
              ¿Aún no tienes cuenta?{' '}
              <Link
                to="/register"
                state={state}
                className="font-bold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 transition-colors"
              >
                <span>Crea tu cuenta aquí</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

