-- Test script to verify order submission functionality
-- Run this in your Supabase SQL Editor

-- Test the get_next_order_numbers function
SELECT * FROM get_next_order_numbers(3);

-- Check if all required columns exist in orders table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('batch_tag', 'size_book_no', 'blouse_material_category', 'lining_cloth_given', 'falls_cloth_given', 'saree_service_type', 'number_of_items');

-- Check if batches table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'batches'
);

-- Check if the function exists
SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_name = 'get_next_order_numbers'
); 