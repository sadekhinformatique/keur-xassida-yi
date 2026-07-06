import { getSupabase } from './supabase';

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    role?: string;
    phone?: string;
  };
}

export const supabaseAuth = {
  login: async (email: string, password: string) => {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.session) {
      localStorage.setItem('supabase_token', data.session.access_token);
      localStorage.setItem('supabase_refresh', data.session.refresh_token);
    }

    return data;
  },

  logout: async () => {
    const sb = getSupabase();
    await sb.auth.signOut();
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_refresh');
  },

  getSession: async () => {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    return data.session;
  },

  getUser: async () => {
    const sb = getSupabase();
    const { data } = await sb.auth.getUser();
    return data.user as SupabaseUser | null;
  },

  resetPassword: async (email: string) => {
    const sb = getSupabase();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const sb = getSupabase();
    const { data } = sb.auth.onAuthStateChange(callback);
    return data.subscription;
  },
};
