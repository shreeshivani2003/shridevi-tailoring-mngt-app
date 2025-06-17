-- Supabase SQL Schema for Mom Tailoring App
-- Run these statements one by one in the Supabase SQL Editor

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  material_type TEXT NOT NULL,
  description TEXT,
  order_type TEXT NOT NULL,
  given_date TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_status TEXT NOT NULL,
  status_history JSONB DEFAULT '[]',
  is_delivered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(current_status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for customers table
CREATE POLICY "Enable read access for all users" ON customers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON customers
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON customers
  FOR DELETE USING (true);

-- 6. Create policies for orders table
CREATE POLICY "Enable read access for all users" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON orders
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON orders
  FOR DELETE USING (true); 