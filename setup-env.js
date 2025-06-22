#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up environment for Mom Tailoring App\n');

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  console.log('📝 Current .env file contents:');
  console.log(fs.readFileSync(envPath, 'utf8'));
} else {
  console.log('❌ .env file not found');
  console.log('\n📋 To fix the "Error adding order" issue, you need to:');
  console.log('\n1. Create a Supabase project at https://supabase.com');
  console.log('2. Get your project URL and anon key from Settings → API');
  console.log('3. Create a .env file in the project root with:');
  console.log('\n   VITE_SUPABASE_URL=your_supabase_url');
  console.log('   VITE_SUPABASE_ANON_KEY=your_anon_key');
  console.log('\n4. Run the SQL schema from supabase-schema.sql in your Supabase SQL Editor');
  console.log('5. Set up Row Level Security policies as described in SUPABASE_SETUP.md');
  console.log('\n📖 See SUPABASE_SETUP.md for detailed instructions');
  
  // Create a template .env file
  const envTemplate = `# Supabase Configuration
# Replace these with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Instructions:
# 1. Go to https://supabase.com and create a new project
# 2. Go to Settings → API in your Supabase dashboard
# 3. Copy the Project URL and anon public key
# 4. Replace the values above with your actual credentials
# 5. Run the SQL schema from supabase-schema.sql in your Supabase SQL Editor
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('\n✅ Created .env template file');
  console.log('📝 Please edit .env with your actual Supabase credentials');
}

console.log('\n🔧 Common issues and solutions:');
console.log('- "Error adding order": Usually means Supabase is not configured');
console.log('- "Permission denied": Check Row Level Security policies');
console.log('- "Column does not exist": Run the updated schema from supabase-schema.sql');
console.log('\n📚 For more help, see SUPABASE_SETUP.md'); 