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
    if (!cleanPhone || digitsOnly.length < 10) {
      throw { status: 400, message: 'El teléfono celular debe tener al menos 10 dígitos.' };
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
    const user = await UserModel.findByEmail(cleanEmail);
    if (!user) {
      throw { status: 401, message: 'Credenciales inválidas: No existe una cuenta con este correo.' };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw { status: 401, message: 'Credenciales inválidas: Contraseña incorrecta.' };
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
