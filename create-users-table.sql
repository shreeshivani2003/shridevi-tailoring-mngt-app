-- Create users table for authentication
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON users
  FOR DELETE USING (true);

-- Insert the super admin user (you)
-- Replace 'your_username' and 'your_password_hash' with your actual credentials
-- You can generate a password hash using bcrypt or similar
INSERT INTO users (id, username, password_hash, role) 
VALUES (
  'super_admin_001', 
  'your_username', 
  '$2a$10$your_password_hash_here', 
  'super_admin'
) ON CONFLICT (username) DO NOTHING; 