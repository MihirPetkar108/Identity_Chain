import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db, { UserRow, DIDRow } from '../db';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'identity-chain-prototype-jwt-secret-key-2026';
const COOKIE_NAME = 'idchain_session';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

export class AuthService {
  public hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  public verifyPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  public register(name: string, email: string, password: string): { user: UserSession; token: string } {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      throw new Error('User already exists with this email address');
    }

    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const passwordHash = this.hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, 'USER')
    `).run(userId, name, email.toLowerCase(), passwordHash);

    const user: UserSession = {
      id: userId,
      name,
      email: email.toLowerCase(),
      role: 'USER',
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    return { user, token };
  }

  public login(email: string, password: string): { user: UserSession; token: string } {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as UserRow | undefined;
    if (!row) {
      throw new Error('Invalid email or password');
    }

    const valid = this.verifyPassword(password, row.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const user: UserSession = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    return { user, token };
  }

  public verifyToken(token: string): UserSession | null {
    try {
      return jwt.verify(token, JWT_SECRET) as UserSession;
    } catch {
      return null;
    }
  }

  public async getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return this.verifyToken(token);
  }

  public getCookieName() {
    return COOKIE_NAME;
  }
}

export const authService = new AuthService();
