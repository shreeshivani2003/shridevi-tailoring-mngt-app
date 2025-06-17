# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter a project name (e.g., "mom-tailoring")
6. Enter a database password (save this!)
7. Choose a region close to you
8. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Create Environment Variables

1. In your project root directory, create a file called `.env`
2. Add the following content (replace with your actual values):

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example
```

## Step 4: Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the following SQL code:

```sql
-- Create customers table
CREATE TABLE customers (
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

-- Create orders table
CREATE TABLE orders (
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

-- Create indexes for better performance
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_status ON orders(current_status);
```

3. Click "Run" to execute the SQL

## Step 5: Set Up Row Level Security (RLS)

1. In your Supabase dashboard, go to **Authentication** → **Policies**
2. For the `customers` table:
   - Click "New Policy"
   - Choose "Enable read access to everyone"
   - Click "Review" and "Save"
   - Click "New Policy" again
   - Choose "Enable insert access to everyone"
   - Click "Review" and "Save"
   - Click "New Policy" again
   - Choose "Enable update access to everyone"
   - Click "Review" and "Save"
   - Click "New Policy" again
   - Choose "Enable delete access to everyone"
   - Click "Review" and "Save"

3. Repeat the same process for the `orders` table

## Step 6: Test Your Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Open your app in the browser
3. Try adding a customer - it should work now!

## Troubleshooting

### If you see "Database not configured" error:
- Make sure your `.env` file exists in the project root
- Check that the environment variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Verify that your Supabase URL and key are correct
- Restart your development server after creating the `.env` file

### If you see "permission denied" errors:
- Make sure you've set up Row Level Security policies as described in Step 5
- Check that your anon key is correct

### If tables don't exist:
- Make sure you've run the SQL commands from Step 4
- Check the SQL Editor for any error messages

## Security Notes

- The `.env` file should never be committed to git (it's already in `.gitignore`)
- The anon key is safe to use in the frontend - it has limited permissions
- For production, consider setting up proper authentication

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify your Supabase project is active
3. Make sure you're using the correct region
4. Try creating a new Supabase project if needed 