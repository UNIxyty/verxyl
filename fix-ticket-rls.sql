-- Fix Row Level Security policies for tickets table
-- This script enables proper RLS policies for ticket creation and access

-- First, check if RLS is enabled on tickets table
-- If it's enabled but policies are too restrictive, we need to fix them

-- Enable RLS on tickets table (if not already enabled)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to start fresh)
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets assigned to them" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets assigned to them" ON tickets;
DROP POLICY IF EXISTS "Admin can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admin can update all tickets" ON tickets;

-- Create comprehensive RLS policies for tickets

-- Policy 1: Users can create tickets
CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = created_by
    );

-- Policy 2: Users can view tickets they created
CREATE POLICY "Users can view tickets they created" ON tickets
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = created_by
    );

-- Policy 3: Users can view tickets assigned to them
CREATE POLICY "Users can view tickets assigned to them" ON tickets
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = assigned_to
    );

-- Policy 4: Users can update tickets assigned to them (but not change assignment)
CREATE POLICY "Users can update tickets assigned to them" ON tickets
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND
        auth.uid()::text = assigned_to
    )
    WITH CHECK (
        auth.uid()::text = assigned_to AND
        created_by = (SELECT created_by FROM tickets WHERE id = tickets.id)
    );

-- Policy 5: Admins can view all tickets
CREATE POLICY "Admin can view all tickets" ON tickets
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 6: Admins can update all tickets
CREATE POLICY "Admin can update all tickets" ON tickets
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 7: Admins can delete tickets
CREATE POLICY "Admin can delete tickets" ON tickets
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Also ensure users table has proper RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing user policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;

-- Create user policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT
    USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE
    USING (auth.uid()::text = id);

CREATE POLICY "Admin can view all users" ON users
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON tickets TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
