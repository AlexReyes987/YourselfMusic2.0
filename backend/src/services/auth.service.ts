import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model.js';
import { DatabaseService } from './databaseService.js';
import { ENV } from '../config/env.js';
import { User, UserRole } from '../types/index.js';

export class AuthService {
  static async register(data: { name: string; email: string; phone: string; password: string; role?: UserRole }) {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const cleanName = (data.name || '').trim();
    const cleanPhone = (data.phone || '').trim();

    // 1. Validaciones estrictas de datos del usuario
    if (!cleanName || cleanName.length < 3) {
      throw { status: 400, message: 'El nombre completo o nombre de la banda debe tener al menos 3 caracteres.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw { status: 400, message: 'Debes proporcionar un correo electrónico válido.' };
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || digitsOnly.length !== 10) {
      throw {
        status: 400,
        message: 'El teléfono celular debe tener exactamente 10 dígitos (ej. 6181234567).',
      };
    }

    // Validar que inicie con un prefijo LADA mexicano real (Plan Nacional de Numeración IFT, ej. 618 Durango)
    const regexPrefijoMexicano =
      /^(?:33|55|56|81|22[0-9]|23[1-8]|24[1-9]|27[1-9]|28[1-8]|29[467]|31[1-79]|32[1-9]|34[1-9]|35[1-9]|37[1-8]|38[1-9]|39[1-5]|41[1-9]|42[1-9]|43[1-8]|44[1-9]|45[1-9]|46[1-9]|47[1-9]|48[1-9]|49[2-9]|588|59[1-79]|61[2-68]|62[124-9]|63[1-9]|64[1-9]|65[1-3689]|66[1-57-9]|67[1-7]|68[67]|69[4-8]|71[1-9]|72[1-9]|73[1-9]|74[1-9]|75[1-9]|76[1-9]|77[1-9]|78[1-69]|79[17]|82[13-689]|83[1-6]|84[124-6]|86[1246-9]|87[1-378]|89[12479]|91[346-9]|92[1-4]|93[2-46-8]|95[1348]|96[1-9]|97[12]|98[1-8]|99[1-9])/;

    if (!regexPrefijoMexicano.test(digitsOnly)) {
      throw {
        status: 400,
        message: `El prefijo "${digitsOnly.slice(0, 3)}" no corresponde a una clave LADA telefónica mexicana válida (ej. 618 para Durango, 871, 55, 33, 81).`,
      };
    }

    const esLada2 = /^(?:33|55|56|81)/.test(digitsOnly);
    const restoSuscriptor = esLada2 ? digitsOnly.slice(2) : digitsOnly.slice(3);
    if (/^(\d)\1+$/.test(restoSuscriptor)) {
      throw {
        status: 400,
        message: 'Por favor ingresa un número telefónico real (no se permiten secuencias de dígitos idénticos).',
      };
    }

    if (!data.password || data.password.length < 6) {
      throw { status: 400, message: 'La contraseña debe contener al menos 6 caracteres.' };
    }

    // 2. Verificar que no exista una cuenta previa con ese correo
    const existing = await UserModel.findByEmail(cleanEmail);
    if (existing) {
      throw { status: 400, message: 'El correo electrónico ya se encuentra registrado. Por favor inicia sesión.' };
    }

    // 3. Hashear la contraseña con BCrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    // 4. Crear el usuario en la tabla 'usuarios' de Supabase
    const user = await UserModel.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: data.role || 'client',
      password_hash,
    });

    // 5. Registrar en la tabla 'auditoria' de Supabase
    await DatabaseService.registrarAuditoria(
      user.id,
      `REGISTRO_CUENTA: Nuevo cliente ${user.name} (${user.email}) Tel: ${user.phone}`,
      'usuarios'
    );

    // 6. Generar token de sesión
    const token = this.generateToken(user);
    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  static async login(email: string, password: string) {
    if (!email || !password) {
      throw { status: 400, message: 'Correo y contraseña requeridos.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Cuenta única oficial de Administrador (yourself@gmail.com / Yussestudio6543)
    if (cleanEmail === 'yourself@gmail.com' && password === 'Yussestudio6543') {
      let adminUser = await UserModel.findByEmail(cleanEmail);
      if (!adminUser) {
        try {
          const salt = await bcrypt.genSalt(10);
          const password_hash = await bcrypt.hash(password, salt);
          adminUser = await UserModel.create({
            name: 'Administrador YourSelf Music',
            email: cleanEmail,
            phone: '6181133482',
            role: 'admin',
            password_hash,
          });
        } catch {
          adminUser = {
            id: '1',
            name: 'Administrador YourSelf Music',
            email: cleanEmail,
            phone: '6181133482',
            role: 'admin',
            password_hash: '',
          };
        }
      } else {
        adminUser.role = 'admin';
      }

      const token = this.generateToken(adminUser);
      const { password_hash: _, ...safeAdmin } = adminUser;
      return { user: { ...safeAdmin, role: 'admin' as UserRole }, token };
    }

    const user = await UserModel.findByEmail(cleanEmail);
    if (!user) {
      throw { status: 401, message: 'Credenciales inválidas: No existe una cuenta con este correo.' };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw { status: 401, message: 'Credenciales inválidas: Contraseña incorrecta.' };
    }

    if (cleanEmail === 'yourself@gmail.com') {
      user.role = 'admin';
    }

    const token = this.generateToken(user);
    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  static async getProfile(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw { status: 404, message: 'Usuario no encontrado.' };
    }
    const { password_hash: _, ...safeUser } = user;
    return safeUser;
  }

  private static generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        usuario_id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ENV.JWT.SECRET,
      { expiresIn: ENV.JWT.EXPIRES_IN as any }
    );
  }
}
