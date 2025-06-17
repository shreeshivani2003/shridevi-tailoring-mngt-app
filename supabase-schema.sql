-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('regular', 'emergency')),
  material_type TEXT NOT NULL CHECK (material_type IN ('blouse', 'chudi', 'saree', 'works', 'others')),
  size_book_no TEXT NOT NULL,
  hint TEXT NOT NULL,
  description TEXT NOT NULL,
  sizes JSONB DEFAULT '{}',
  reference_image TEXT,
  notes TEXT,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  given_date TIMESTAMP WITH TIME ZONE NOT NULL,
  approximate_amount DECIMAL(10,2) DEFAULT 0,
  current_status TEXT NOT NULL,
  status_history JSONB DEFAULT '[]',
  is_delivered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default users
INSERT INTO users (id, username, password, role) VALUES
  ('1', 'superadmin', 'admin123', 'super_admin'),
  ('2', 'admin', 'admin123', 'admin'),
  ('3', 'user', 'user123', 'user')
ON CONFLICT (username) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_is_delivered ON orders(is_delivered);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your security requirements)
CREATE POLICY "Allow public access to customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow public access to orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow public access to users" ON users FOR ALL USING (true); 