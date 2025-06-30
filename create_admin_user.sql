-- SQL script to create an admin user directly in the database
-- Run this in the Supabase SQL Editor

-- Step 1: Create a user in auth.users table
-- Note: The password hash below is for the password 'admin123'
-- In a real application, you should use a more secure password
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(), -- id
  '00000000-0000-0000-0000-000000000000', -- instance_id
  'admin@cinema.com', -- email
  '$2a$10$Ql9XZz3NQxvWxMDfaXKJOeKzKNXAyHQEyXKR.8oO1NiEVZ5hxJqOa', -- encrypted_password (admin123)
  now(), -- email_confirmed_at
  null, -- recovery_sent_at
  now(), -- last_sign_in_at
  '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
  '{"full_name":"Admin User","role":"admin"}', -- raw_user_meta_data
  now(), -- created_at
  now(), -- updated_at
  'authenticated', -- role
  '', -- confirmation_token
  '', -- email_change
  '', -- email_change_token_new
  '' -- recovery_token
);

-- Step 2: Get the user ID that was just created
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@cinema.com';
  
  -- Step 3: Insert the user into the public.users table with admin role
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