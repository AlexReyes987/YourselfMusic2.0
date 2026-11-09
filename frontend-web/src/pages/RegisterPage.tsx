import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

// Catálogo de prefijos telefónicos mexicanos válidos (Plan Nacional de Numeración IFT México)
const LADAS_2_DIGITOS: Record<string, string> = {
  '33': 'Guadalajara, Jal.',
  '55': 'Ciudad de México',
  '56': 'Ciudad de México / Área Metropolitana',
  '81': 'Monterrey, N.L.',
};

const LADAS_DESTACADAS_3_DIGITOS: Record<string, string> = {
  '618': 'Durango, Dgo.',
  '871': 'Gómez Palacio / Lerdo, Dgo.',
  '671': 'Durango',
  '672': 'Durango / Sinaloa',
  '673': 'Sinaloa',
  '674': 'Santiago Papasquiaro, Dgo.',
  '675': 'Vicente Guerrero, Dgo.',
  '676': 'Guadalupe Victoria, Dgo.',
  '677': 'Nuevo Ideal / Canatlán, Dgo.',
  '667': 'Culiacán, Sin.',
  '669': 'Mazatlán, Sin.',
  '492': 'Zacatecas, Zac.',
  '449': 'Aguascalientes, Ags.',
  '614': 'Chihuahua, Chih.',
  '656': 'Ciudad Juárez, Chih.',
  '844': 'Saltillo, Coah.',
  '442': 'Querétaro, Qro.',
  '477': 'León, Gto.',
  '444': 'San Luis Potosí, S.L.P.',
  '222': 'Puebla, Pue.',
  '664': 'Tijuana, B.C.',
  '999': 'Mérida, Yuc.',
  '998': 'Cancún, Q.R.',
};

// Expresión regular de prefijos NIR oficiales de México (2 y 3 dígitos del Plan Nacional IFT)
const REGEX_PREFIJO_MEXICANO =
  /^(?:33|55|56|81|22[0-9]|23[1-8]|24[1-9]|27[1-9]|28[1-8]|29[467]|31[1-79]|32[1-9]|34[1-9]|35[1-9]|37[1-8]|38[1-9]|39[1-5]|41[1-9]|42[1-9]|43[1-8]|44[1-9]|45[1-9]|46[1-9]|47[1-9]|48[1-9]|49[2-9]|588|59[1-79]|61[2-68]|62[124-9]|63[1-9]|64[1-9]|65[1-3689]|66[1-57-9]|67[1-7]|68[67]|69[4-8]|71[1-9]|72[1-9]|73[1-9]|74[1-9]|75[1-9]|76[1-9]|77[1-9]|78[1-69]|79[17]|82[13-689]|83[1-6]|84[124-6]|86[1246-9]|87[1-378]|89[12479]|91[346-9]|92[1-4]|93[2-46-8]|95[1348]|96[1-9]|97[12]|98[1-8]|99[1-9])/;

export function validarTelefonoMexicano(telefonoRaw: string): {
  valido: boolean;
  lada?: string;
  region?: string;
  error?: string;
} {
  const digits = telefonoRaw.replace(/\D/g, '');

  if (digits.length === 0) {
    return { valido: false, error: 'Ingresa un número telefónico de 10 dígitos.' };
  }

  if (digits.length >= 3 && !REGEX_PREFIJO_MEXICANO.test(digits)) {
    return {
      valido: false,
      error: `El prefijo "${digits.slice(0, 3)}" no corresponde a una clave LADA válida de México (ej. 618, 55, 33, 81).`,
    };
  }

  if (digits.length !== 10) {
    return {
      valido: false,
      error: 'El teléfono debe tener 10 dígitos con prefijo mexicano (ej. 6181234567).',
    };
  }

  if (!REGEX_PREFIJO_MEXICANO.test(digits)) {
    return {
      valido: false,
      error: 'El número debe iniciar con un prefijo telefónico mexicano válido (ej. 618).',
    };
  }

  const lada2 = digits.slice(0, 2);
  const lada3 = digits.slice(0, 3);
  const esLada2 = Boolean(LADAS_2_DIGITOS[lada2]);
  const ladaDetectada = esLada2 ? lada2 : lada3;
  const restoNumero = esLada2 ? digits.slice(2) : digits.slice(3);

  if (/^(\d)\1+$/.test(restoNumero)) {
    return {
      valido: false,
      error: 'Ingresa un número telefónico válido.',
    };
  }

  const region =
    LADAS_2_DIGITOS[lada2] ||
    LADAS_DESTACADAS_3_DIGITOS[lada3] ||
    'México';

  return {
    valido: true,
    lada: ladaDetectada,
    region,
  };
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const state = location.state as
    | {
        from?: string;
        bookingData?: any;
        message?: string;
      }
    | undefined;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
  };

  const validacionTelEnVivo = phone.length >= 3 ? validarTelefonoMexicano(phone) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName || cleanName.length < 3) {
      setErrorMessage('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    const checkTel = validarTelefonoMexicano(cleanPhone);
    if (!checkTel.valido) {
      setErrorMessage(
        checkTel.error ||
          'El número de teléfono debe iniciar con un prefijo mexicano válido (ej. 618) y tener 10 dígitos.'
      );
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
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

      login(response.token, response.user);

      const savedBooking =
        state?.bookingData ||
        (() => {
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
        'No fue posible crear la cuenta. Inténtalo nuevamente.';
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-white tracking-tight">Crear cuenta</h2>
            <p className="text-xs text-zinc-400">
              Completa tus datos para reservar salas de ensayo en YourSelf Music.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nombre completo o nombre de la banda
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Carlos Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Teléfono celular (10 dígitos)
              </label>
              <input
                type="tel"
                inputMode="numeric"
                required
                placeholder="6181234567"
                value={phone}
                onChange={handlePhoneChange}
                className={`w-full px-4 py-2.5 bg-zinc-800/80 border rounded-xl text-sm text-white font-mono placeholder-zinc-500 focus:outline-none transition-colors ${
                  phone.length >= 3 && validacionTelEnVivo && !validacionTelEnVivo.valido && phone.length === 10
                    ? 'border-red-500/70 focus:border-red-500'
                    : validacionTelEnVivo?.valido
                    ? 'border-emerald-500/60 focus:border-emerald-500'
                    : 'border-zinc-700 focus:border-orange-500'
                }`}
              />
              {phone.length >= 3 && validacionTelEnVivo && !REGEX_PREFIJO_MEXICANO.test(phone) && (
                <p className="mt-1 text-[11px] text-red-400">
                  Ingresa un número con clave LADA válida de México (ej. 618).
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                    title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <span>Crear cuenta</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-400">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                state={state}
                className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
