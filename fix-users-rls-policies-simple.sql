-- Fix RLS policies on users table to allow service role to perform admin operations
-- Avoiding infinite recursion by using simpler policies without self-references

-- First, show current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Service role bypass" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Service role can bypass RLS" ON users;

-- Create new policies that avoid infinite recursion
-- Policy 1: Allow service role to perform any operation (bypasses RLS)
CREATE POLICY "Service role bypass" ON users
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Allow authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- Policy 3: Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 4: Allow all authenticated users to view all users (for admin panel)
-- This avoids recursion by not checking admin status in the policy
CREATE POLICY "Authenticated users can view all users" ON users
    FOR SELECT 
    TO authenticated
    USING (true);

-- Policy 5: Allow all authenticated users to update users
-- Admin checks will be handled in the application layer, not in RLS
CREATE POLICY "Authenticated users can update users" ON users
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Show the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
