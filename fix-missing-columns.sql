-- Fix missing columns in orders table
-- Run this in your Supabase SQL Editor

-- Add missing columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS approximate_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS size_book_no TEXT,
ADD COLUMN IF NOT EXISTS hint TEXT,
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reference_image TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing orders to have default values for new columns
UPDATE orders 
SET 
  approximate_amount = 0,
  size_book_no = '',
  hint = '',
  sizes = '{}',
  notes = ''
WHERE approximate_amount IS NULL;

-- Make sure the columns are not null for future inserts
ALTER TABLE orders 
ALTER COLUMN approximate_amount SET NOT NULL,
ALTER COLUMN size_book_no SET NOT NULL,
ALTER COLUMN hint SET NOT NULL,
ALTER COLUMN notes SET NOT NULL;

-- Set default values for future inserts
ALTER TABLE orders 
ALTER COLUMN approximate_amount SET DEFAULT 0,
ALTER COLUMN size_book_no SET DEFAULT '',
ALTER COLUMN hint SET DEFAULT '',
ALTER COLUMN notes SET DEFAULT ''; 