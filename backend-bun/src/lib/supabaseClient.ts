import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
  options?: {
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
  };
}

export const createSupabaseClient = ({
  supabaseUrl,
  supabaseKey,
  options = {}
}: SupabaseConfig): SupabaseClient => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      ...options.auth
    },
    global: {
      ...options.global
    }
  });
};