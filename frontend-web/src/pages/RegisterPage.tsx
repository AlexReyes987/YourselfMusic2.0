import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, Lock, UserPlus, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const state = location.state as {
    from?: string;
    bookingData?: any;
    message?: string;
  } | undefined;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir dígitos y máximo 10 caracteres
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Validaciones estrictas en el cliente
    if (!cleanName || cleanName.length < 3) {
      setErrorMessage('El nombre del titular o de la banda debe tener al menos 3 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Por favor introduce un correo electrónico válido (ej. banda@correo.com).');
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMessage('El teléfono de contacto debe tener exactamente 10 dígitos (ej. 5512345678).');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('La contraseña debe contener un mínimo de 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password,
      });

      // Iniciar sesión automáticamente tras el registro exitoso
      login(response.token, response.user);

      // Revisar si había una reservación pendiente
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
        navigate('/booking', { replace: true });
      }
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Ocurrió un error al registrar la cuenta. Inténtalo nuevamente.';
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Banner de aviso si viene de intentar reservar */}


        {/* Tarjeta de Registro */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Crear Cuenta de Cliente</h2>
            <p className="text-xs text-zinc-400">
              Regístrate en YourSelf Music para reservar salas oficiales de ensayo y gestionar tus ensayos.
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
                Nombre Completo o Nombre de la Banda <span className="text-orange-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Los Nocturnos / Carlos Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Correo Electrónico <span className="text-orange-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="banda@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Teléfono Celular (10 dígitos) <span className="text-orange-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="5512345678"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {phone.length}/10 dígitos requeridos para validación de reservas y contacto de emergencia.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Contraseña <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Mín. 6 car."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Confirmar Contraseña <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Repite la pass"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-zinc-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Tu cuenta quedará registrada y guardada de forma segura en nuestra base de datos.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Cuenta y Continuar</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-400">
              ¿Ya tienes una cuenta creada?{' '}
              <Link
                to="/login"
                state={state}
                className="font-bold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 transition-colors"
              >
                <span>Inicia sesión aquí</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
