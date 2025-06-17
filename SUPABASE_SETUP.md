# Supabase Setup Guide

This guide will help you set up Supabase for the Shri Devi Tailoring Management App.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js and npm installed on your machine

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "shri-devi-tailoring")
5. Enter a database password (save this securely)
6. Choose a region close to your users
7. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon (public) key

## Step 3: Set Up Environment Variables

1. Create a `.env` file in your project root
2. Add the following variables:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 2.

## Step 4: Set Up Database Tables

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the script

This will create:
- `customers` table for storing customer information
- `orders` table for storing order details
- `users` table for authentication
- Default users (superadmin, admin, user)
- Appropriate indexes for performance
- Row Level Security policies

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try creating a new customer or order
3. Check your Supabase dashboard > Table Editor to see if the data is being saved

## Troubleshooting

### Orders not saving?

1. Check your browser's developer console for errors
2. Verify your environment variables are correct
3. Ensure the database tables were created successfully
4. Check if Row Level Security policies are properly configured

### Common Issues

1. **CORS errors**: Make sure your Supabase project allows requests from your domain
2. **Authentication errors**: Check if your API keys are correct
3. **Database errors**: Verify the table schema matches the expected structure

## Security Notes

- The current setup allows public access to all tables for simplicity
- For production, you should implement proper authentication and authorization
- Consider using Supabase Auth for user management
- Review and modify the RLS policies based on your security requirements

## Support

If you encounter issues:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review the browser console for error messages
3. Check the Supabase dashboard logs 