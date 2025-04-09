import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  // This error should ideally not be hit if --env-file works correctly
  console.error("Error: Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY). Ensure .env file is loaded via --env-file flag.");
  throw new Error("Supabase environment variables are not set.");
}

if (!supabaseServiceRoleKey) {
  console.error("Warning: Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Service role operations will not work.");
  console.error("Please add SUPABASE_SERVICE_ROLE_KEY to your .env file.");
}

// Regular client for user-authenticated operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role permissions for operations that need to bypass RLS
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || '', // Use empty string as fallback
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

console.log("[Supabase] Client initialized.");
console.log("[Supabase] Admin client " + (supabaseServiceRoleKey ? "initialized." : "NOT initialized (missing key)."));
