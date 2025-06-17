-- Step 3: Enable Row Level Security and Create Policies
-- Run this after creating tables and indexes

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Enable read access for all users" ON customers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON customers
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON customers
  FOR DELETE USING (true);

-- Create policies for orders table
CREATE POLICY "Enable read access for all users" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON orders
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON orders
  FOR DELETE USING (true); 