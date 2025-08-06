-- Add serviceTypes field to orders table
ALTER TABLE orders ADD COLUMN service_types TEXT[] DEFAULT '{}';

-- Update RLS policies to include the new field
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON orders;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON orders;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON orders;

-- Recreate policies with the new field
CREATE POLICY "Enable read access for all users" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON orders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comment to document the field
COMMENT ON COLUMN orders.service_types IS 'Array of service types selected for this order (e.g., ["princess cut", "lining blouse"] for blouse)'; 