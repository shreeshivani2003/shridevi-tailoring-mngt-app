// Password Hash Generator for Super Admin
// Run this script to generate a password hash for your super admin account

import bcrypt from 'bcryptjs';

const username = 'shivani'; // Replace with your desired username
const password = 'Ponni@2358'; // Replace with your desired password

async function generateHash() {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('=== Super Admin Account Setup ===');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Password Hash: ${hash}`);
    console.log('\n=== SQL Command ===');
    console.log(`INSERT INTO users (id, username, password_hash, role) VALUES ('super_admin_001', '${username}', '${hash}', 'super_admin');`);
    console.log('\n=== Instructions ===');
    console.log('1. Copy the SQL command above');
    console.log('2. Go to your Supabase SQL Editor');
    console.log('3. Paste and run the command');
    console.log('4. Update your .env file with Supabase credentials');
    console.log('5. Restart your application');
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash(); 