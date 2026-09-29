import { UserSession } from '../types';
import { storage } from './storage';

export interface LoginRequest {
  account: 'stella' | 'admin';
  password: string;
}

class AuthService {
  async getSession(): Promise<UserSession> {
    return storage.getSession();
  }

  async login(creds: LoginRequest): Promise<{ user: UserSession; error?: string }> {
    const { account, password } = creds;

    if (!account) {
      return {
        user: { id: '', name: '', isLoggedIn: false },
        error: 'Please select an account (Mama Stella or Administrator).',
      };
    }

    if (!password || password.length < 6) {
      return {
        user: { id: '', name: '', isLoggedIn: false },
        error: 'Password must be at least 6 characters long.',
      };
    }

    const name = account === 'admin' ? 'Admin' : 'Mama Stella';

    const session: UserSession = {
      id: `usr_${account}`,
      name,
      isLoggedIn: true,
    };

    storage.saveSession(session);
    return { user: session };
  }

  async logout(): Promise<void> {
    const session: UserSession = {
      id: '',
      name: '',
      isLoggedIn: false,
    };
    storage.saveSession(session);
  }
}

export const authService = new AuthService();
