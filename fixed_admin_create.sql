-- Fixed SQL script to create an admin user in Supabase
-- Run this in the Supabase SQL Editor

-- First, check if the user already exists and delete if necessary
DO $$
BEGIN
  -- Delete from public.users first (due to foreign key constraints)
  DELETE FROM public.users WHERE email = 'admin@cinema.com';
  
  -- Then delete from auth.users
  DELETE FROM auth.users WHERE email = 'admin@cinema.com';
END $$;

-- Create a new user with admin role using direct insertion
-- This approach manually creates the user with proper password hashing
DO $$
DECLARE
  user_id uuid;
  encrypted_pw text;
BEGIN
  -- Generate a UUID for the new user
  user_id := gen_random_uuid();
  
  -- Generate a properly hashed password using crypt and gen_salt
  -- This creates a bcrypt hash for 'admin123'
  encrypted_pw := crypt('admin123', gen_salt('bf'));
  
  -- Insert into auth.users table
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', -- instance_id
    user_id, -- id
    'authenticated', -- aud
    'authenticated', -- role
    'admin@cinema.com', -- email
    encrypted_pw, -- encrypted_password
    now(), -- email_confirmed_at
    now(), -- recovery_sent_at
    now(), -- last_sign_in_at
    '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
    '{"full_name":"Admin User","role":"admin"}', -- raw_user_meta_data
    now(), -- created_at
    now(), -- updated_at
    '', -- confirmation_token
    '', -- email_change
    '', -- email_change_token_new
    '' -- recovery_token
  );
  
  -- Insert into auth.identities table
  -- This is required for the user to be able to log in
  -- Added provider_id field to fix the not-null constraint error
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id, -- Added this field
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(), -- id
    user_id, -- user_id
    format('{"sub":"%s","email":"%s"}', user_id::text, 'admin@cinema.com')::jsonb, -- identity_data
    'email', -- provider
    'admin@cinema.com', -- provider_id (using email as provider_id)
    now(), -- last_sign_in_at
    now(), -- created_at
    now() -- updated_at
  );
  
  -- Insert the user into the public.users table with admin role
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    user_id,
    'admin@cinema.com',
    'Admin User',
    'admin',
    now(),
    now()
  );
  
  -- Output the created user ID
  RAISE NOTICE 'Created admin user with ID: %', user_id;
END $$;

-- After running this script, you can log in with:
-- Email: admin@cinema.com
-- Password: admin123