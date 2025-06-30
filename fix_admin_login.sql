-- SQL script to fix admin user login issues
-- Run this in the Supabase SQL Editor

-- First, let's check if the admin user exists in auth.users
DO $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@cinema.com') INTO admin_exists;
  
  IF admin_exists THEN
    -- If admin exists, delete it first to avoid conflicts
    DELETE FROM auth.users WHERE email = 'admin@cinema.com';
    DELETE FROM public.users WHERE email = 'admin@cinema.com';
  END IF;
END $$;

-- Now let's create the admin user using Supabase's built-in function
-- This is more reliable than manually inserting into auth.users
SELECT
  auth.create_user(
    'admin@cinema.com',
    'admin123',
    '{"full_name":"Admin User","role":"admin"}'
  );

-- Get the user ID that was just created
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@cinema.com';
  
  -- Make sure the user is confirmed (can log in immediately)
  UPDATE auth.users 
  SET email_confirmed_at = now(),
      confirmed_at = now()
  WHERE id = admin_user_id;
  
  -- Insert the user into the public.users table with admin role
  -- First check if the user already exists in public.users
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE id = admin_user_id) THEN
    INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
    VALUES (
      admin_user_id,
      'admin@cinema.com',
      'Admin User',
      'admin',
      now(),
      now()
    );
  ELSE
    -- Update the existing user to have admin role
    UPDATE public.users
    SET role = 'admin'
    WHERE id = admin_user_id;
  END IF;
END $$;

-- After running this script, you can log in with:
-- Email: admin@cinema.com
-- Password: admin123