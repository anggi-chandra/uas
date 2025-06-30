-- Create tables for the cinema ticket booking system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movies table
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  poster TEXT NOT NULL,
  backdrop TEXT NOT NULL,
  rating TEXT NOT NULL,
  duration TEXT NOT NULL,
  release_date TEXT NOT NULL,
  is_now_showing BOOLEAN NOT NULL DEFAULT FALSE,
  is_coming_soon BOOLEAN NOT NULL DEFAULT FALSE,
  genre TEXT[] NOT NULL,
  director TEXT NOT NULL,
  "cast" TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Theaters table
CREATE TABLE IF NOT EXISTS public.theaters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  image TEXT NOT NULL,
  facilities TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Showtimes table
CREATE TABLE IF NOT EXISTS public.showtimes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  theater_id UUID NOT NULL REFERENCES public.theaters(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seats table
CREATE TABLE IF NOT EXISTS public.seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theater_id UUID NOT NULL REFERENCES public.theaters(id) ON DELETE CASCADE,
  row TEXT NOT NULL,
  number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('standard', 'premium', 'vip')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(theater_id, row, number)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
  total_price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking Seats table (junction table for bookings and seats)
CREATE TABLE IF NOT EXISTS public.booking_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, seat_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'e_wallet')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_is_now_showing ON public.movies(is_now_showing);
CREATE INDEX IF NOT EXISTS idx_movies_is_coming_soon ON public.movies(is_coming_soon);
CREATE INDEX IF NOT EXISTS idx_showtimes_movie_id ON public.showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_theater_id ON public.showtimes(theater_id);
CREATE INDEX IF NOT EXISTS idx_seats_theater_id ON public.seats(theater_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_showtime_id ON public.bookings(showtime_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_booking_id ON public.booking_seats(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_seat_id ON public.booking_seats(seat_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);

-- Disable RLS (Row Level Security) on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.theaters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.showtimes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- Create admin user
-- This approach manually creates the user with proper password hashing and identities
DO $$
DECLARE
  user_id uuid;
  encrypted_pw text;
BEGIN
  -- First, check if the user already exists and delete if necessary
  DELETE FROM public.users WHERE email = 'admin@cinema.com';
  DELETE FROM auth.users WHERE email = 'admin@cinema.com';
  
  -- Generate a UUID for the new user
  user_id := gen_random_uuid();
  
  -- Generate a properly hashed password using crypt and gen_salt
  -- This creates a bcrypt hash for 'admin123'
  encrypted_pw := crypt('admin123', gen_salt('bf'));
  
  -- Step 1: Insert into auth.users table
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
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
    user_id, -- id
    '00000000-0000-0000-0000-000000000000', -- instance_id
    'authenticated', -- aud
    'authenticated', -- role
    'admin@cinema.com', -- email
    encrypted_pw, -- encrypted_password
    now(), -- email_confirmed_at
    now(), -- confirmed_at
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
  
  -- Step 2: Insert into auth.identities table
  -- This is required for the user to be able to log in
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(), -- id
    user_id, -- user_id
    format('{"sub":"%s","email":"%s"}', user_id::text, 'admin@cinema.com')::jsonb, -- identity_data
    'email', -- provider
    user_id::text, -- provider_id (using user_id as provider_id)
    now(), -- last_sign_in_at
    now(), -- created_at
    now() -- updated_at
  );
  
  -- Step 3: Insert the user into the public.users table with admin role
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