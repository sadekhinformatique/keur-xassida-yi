import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jfutcdemqkleebjicxpb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabase;
};

// Realtime subscriptions
export const subscribeToAttendance = (callback: (payload: any) => void) => {
  const sb = getSupabase();
  return sb
    .channel('attendance-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'attendance_attendance' },
      callback
    )
    .subscribe();
};

export const subscribeToDashboard = (callback: (payload: any) => void) => {
  const sb = getSupabase();
  return sb
    .channel('dashboard-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'attendance_attendance' },
      callback
    )
    .subscribe();
};

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<string | null> => {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Supabase upload error:', err);
    return null;
  }
};

export const getPublicUrl = (bucket: string, path: string): string => {
  const sb = getSupabase();
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
};

export default getSupabase;
