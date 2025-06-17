import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are not set
const createMockClient = () => {
  const createMockQueryBuilder = () => ({
    select: () => createMockQueryBuilder(),
    insert: () => createMockQueryBuilder(),
    update: () => createMockQueryBuilder(),
    delete: () => createMockQueryBuilder(),
    eq: () => createMockQueryBuilder(),
    order: () => createMockQueryBuilder(),
    single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  });

  return {
    from: (table: string) => createMockQueryBuilder()
  };
};

// For development, if no environment variables are set, use mock client
// In production, you should always have these variables set
export const supabase = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient(); 