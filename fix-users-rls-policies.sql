-- Fix RLS policies on users table to allow service role to perform admin operations
-- The service role should be able to bypass RLS for admin functions

-- First, show current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Service role can bypass RLS" ON users;

-- Create new policies that allow service role to bypass RLS
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

-- Policy 3: Allow authenticated users to update their own profile (except role and approval_status)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        role = (SELECT role FROM users WHERE id = auth.uid()) AND
        approval_status = (SELECT approval_status FROM users WHERE id = auth.uid())
    );

-- Policy 4: Allow approved admins to view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

-- Policy 5: Allow approved admins to update user roles and approval status
CREATE POLICY "Admins can manage users" ON users
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

-- Show the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
