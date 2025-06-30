-- Simple SQL script to create an admin user in Supabase
-- Run this in the Supabase SQL Editor

-- First, check if the user already exists and delete if necessary
DO $$
BEGIN
  -- Delete from public.users first (due to foreign key constraints)
  DELETE FROM public.users WHERE email = 'admin@cinema.com';
  
  -- Then delete from auth.users
  DELETE FROM auth.users WHERE email = 'admin@cinema.com';
END $$;

-- Create a new user with admin role
-- This uses Supabase's built-in function which handles password hashing correctly
SELECT supabase_auth.create_user(
  uid := gen_random_uuid(),
  email := 'admin@cinema.com',
  email_confirmed := true,
  password := 'admin123',
  data := '{"full_name":"Admin User","role":"admin"}'
);

-- Get the user ID that was just created
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@cinema.com';
  
  -- Insert the user into the public.users table with admin role
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    admin_user_id,
    'admin@cinema.com',
    'Admin User',
    'admin',
    now(),
    now()
  );
END $$;

-- After running this script, you can log in with:
-- Email: admin@cinema.com
-- Password: admin123