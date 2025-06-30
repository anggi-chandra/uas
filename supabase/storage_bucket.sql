-- Create storage bucket for images without RLS policies

-- Create the 'images' bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- This will allow anyone to access the storage bucket without restrictions
-- All users will be able to upload, view, update, and delete files in the 'images' bucket
-- This is suitable for development and testing purposes

-- Note: In a production environment, you might want to enable RLS and set up proper policies
-- to restrict access to files based on user roles and ownership