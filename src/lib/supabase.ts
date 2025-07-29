import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseUrl !== '';

console.log('🔧 Supabase Configuration Check:');
console.log('URL configured:', !!supabaseUrl);
console.log('Key configured:', !!supabaseAnonKey);
console.log('URL value:', supabaseUrl);
console.log('Is configured:', isSupabaseConfigured);

// Create Supabase client with fallback for build time
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Export configuration status for runtime checks
export const isSupabaseReady = isSupabaseConfigured;

// Test connection function
export const testSupabaseConnection = async () => {
  if (!isSupabaseReady) {
    console.error('❌ Supabase not configured properly');
    return false;
  }

  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err);
    return false;
  }
}; 