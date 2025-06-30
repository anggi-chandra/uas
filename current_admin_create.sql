-- Current recommended SQL script to create an admin user in Supabase
-- Run this in the Supabase SQL Editor

-- First, check if the user already exists and delete if necessary
DO $$
BEGIN
  -- Delete from public.users first (due to foreign key constraints)
  DELETE FROM public.users WHERE email = 'admin@cinema.com';
  
  -- Then delete from auth.users
  DELETE FROM auth.users WHERE email = 'admin@cinema.com';
END $$;

-- Create a new user with admin role using the current Supabase API
-- This is the most reliable method as it uses the current Supabase auth API
SELECT auth.create_user(
  email := 'admin@cinema.com',
  password := 'admin123',
  email_confirm := true,
  data := jsonb_build_object('full_name', 'Admin User', 'role', 'admin')
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