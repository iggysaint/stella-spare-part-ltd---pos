import { supabase } from './supabaseClient';
import { UserSession } from '../types';

// Maps the two account cards on the login screen to their real Supabase login emails.
// Only these two accounts exist — enforced both here and by the database trigger.
const ACCOUNTS: Record<'stella' | 'admin', { email: string; name: string }> = {
  stella: { email: 'stellagyanfi2@gmail.com', name: 'Mama Stella' },
  admin: { email: 'mr.ignatiusarthur@gmail.com', name: 'Administrator' },
};

class AuthService {
  async login({
    account,
    password,
  }: {
    account: 'stella' | 'admin';
    password: string;
  }): Promise<UserSession> {
    const target = ACCOUNTS[account];
    if (!target) {
      throw new Error('Please select an account.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: target.email,
      password,
    });

    if (error) {
      // Don't leak whether the email exists or the password is wrong — same message either way.
      throw new Error('Incorrect password. Please try again.');
    }

    return {
      id: data.user.id,
      name: target.name,
      isLoggedIn: true,
    };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Called on app startup to restore a previous session (the "stay logged in" behaviour).
  // Always returns a UserSession object — isLoggedIn: false when there's no session —
  // to match how App.tsx already calls this (session.isLoggedIn with no null check).
  async getSession(): Promise<UserSession> {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user?.email) {
      return { id: '', name: '', isLoggedIn: false };
    }

    const matched = (Object.entries(ACCOUNTS) as [string, (typeof ACCOUNTS)['stella']][]).find(
      ([, v]) => v.email === user.email
    );
    if (!matched) {
      return { id: '', name: '', isLoggedIn: false }; // shouldn't happen, but fail safe
    }

    return {
      id: user.id,
      name: matched[1].name,
      isLoggedIn: true,
    };
  }
}

export const authService = new AuthService();