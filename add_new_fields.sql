-- Add new fields to the orders table
-- Run this script in your Supabase SQL Editor

-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS size_book_no TEXT,
ADD COLUMN IF NOT EXISTS blouse_material_category TEXT,
ADD COLUMN IF NOT EXISTS falls_details TEXT,
ADD COLUMN IF NOT EXISTS lining_cloth_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS falls_cloth_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS saree_service_type TEXT DEFAULT 'Falls Stitching',
ADD COLUMN IF NOT EXISTS number_of_items INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS batch_tag TEXT;

-- Create batches table if it doesn't exist
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  batch_tag TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, batch_tag)
);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_next_order_numbers(integer);

-- Create function to get next order numbers
CREATE OR REPLACE FUNCTION get_next_order_numbers(n INTEGER)
RETURNS TABLE(order_number INTEGER) 
LANGUAGE plpgsql
AS $$
DECLARE
    max_order_num INTEGER;
    i INTEGER;
BEGIN
    -- Get the maximum order number from existing orders (handle all prefixes: ORD, EMG, ALT)
    SELECT COALESCE(MAX(CAST(REPLACE(REPLACE(REPLACE(order_id, 'ORD', ''), 'EMG', ''), 'ALT', '') AS INTEGER)), 0)
    INTO max_order_num
    FROM orders
    WHERE order_id LIKE 'ORD%' OR order_id LIKE 'EMG%' OR order_id LIKE 'ALT%';
    
    -- Return n consecutive numbers starting from max_order_num + 1
    FOR i IN 1..n LOOP
        order_number := max_order_num + i;
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_batch_tag ON orders(batch_tag);
CREATE INDEX IF NOT EXISTS idx_batches_customer_id ON batches(customer_id);

-- Enable RLS for batches table
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Create policies for batches table
CREATE POLICY "Enable read access for all users" ON batches
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON batches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON batches
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON batches
  FOR DELETE USING (true); 