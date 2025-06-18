import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseUrl !== '';

if (!isSupabaseConfigured) {
  throw new Error(
    'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables. ' +
    'Check SUPABASE_SETUP.md for setup instructions.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!); 