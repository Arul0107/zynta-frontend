// src/supabase.js
import { createClient } from '@supabase/supabase-js';

// Get the variables from the environment (Vite requires VITE_ prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log error if variables are missing (helpful for debugging)
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY) are missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);