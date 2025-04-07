import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  // This error should ideally not be hit if --env-file works correctly
  console.error("Error: Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY). Ensure .env file is loaded via --env-file flag.");
  throw new Error("Supabase environment variables are not set.");
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("[Supabase] Client initialized."); 