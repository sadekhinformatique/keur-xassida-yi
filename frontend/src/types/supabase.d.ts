declare module '@supabase/supabase-js' {
  import { SupabaseClient as RealSupabaseClient } from '@supabase/supabase-js';
  export type SupabaseClient = RealSupabaseClient;
  export function createClient(url: string, key: string, options?: any): SupabaseClient;
}
