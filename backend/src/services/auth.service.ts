import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model.js';
import { ENV } from '../config/env.js';
import { User, UserRole } from '../types/index.js';

export class AuthService {
  static async register(data: { name: string; email: string; phone: string; password: string; role?: UserRole }) {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      throw { status: 400, message: 'El correo electrónico ya se encuentra registrado' };
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    const user = await UserModel.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role || 'client',
      password_hash,
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  static async login(email: string, password: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw { status: 401, message: 'Credenciales inválidas' };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw { status: 401, message: 'Credenciales inválidas' };
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  private static generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ENV.JWT.SECRET,
      { expiresIn: ENV.JWT.EXPIRES_IN as any }
    );
  }
}

