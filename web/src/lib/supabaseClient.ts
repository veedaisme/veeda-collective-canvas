import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Missing Supabase environment variables in frontend (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)");
  throw new Error("Supabase environment variables are not set in the frontend.");
}

// Create a single Supabase client instance for frontend use (primarily auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log("[Supabase FE] Client initialized."); 