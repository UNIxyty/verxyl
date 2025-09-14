-- Fix RLS policies to work properly with service role operations
-- This ensures security while allowing API routes to function

-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets they created" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets assigned to them" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets assigned to them" ON tickets;
DROP POLICY IF EXISTS "Users can delete tickets they created" ON tickets;
DROP POLICY IF EXISTS "Admin can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admin can update all tickets" ON tickets;
DROP POLICY IF EXISTS "Admin can delete all tickets" ON tickets;

-- Create policies that work with both authenticated users and service role
-- Service role operations will bypass these policies automatically

-- Allow users to create tickets
CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT 
    WITH CHECK (
        auth.uid() = created_by::uuid OR 
        auth.role() = 'service_role'
    );

-- Allow users to view tickets they created or are assigned to
CREATE POLICY "Users can view their tickets" ON tickets
    FOR SELECT 
    USING (
        auth.uid() = created_by::uuid OR 
        auth.uid() = assigned_to::uuid OR
        auth.role() = 'service_role'
    );

-- Allow users to update tickets assigned to them
CREATE POLICY "Users can update assigned tickets" ON tickets
    FOR UPDATE 
    USING (
        auth.uid() = assigned_to::uuid OR
        auth.role() = 'service_role'
    );

-- Allow users to delete tickets they created
CREATE POLICY "Users can delete created tickets" ON tickets
    FOR DELETE 
    USING (
        auth.uid() = created_by::uuid OR
        auth.role() = 'service_role'
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON tickets TO authenticated;

-- Verify RLS is enabled and policies are created
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tickets' 
AND schemaname = 'public';

-- Show created policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tickets' 
AND schemaname = 'public';
