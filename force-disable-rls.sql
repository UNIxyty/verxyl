-- Force disable RLS on tickets table to fix delete/edit operations
-- This is a more aggressive approach to ensure RLS is completely disabled

-- First, drop ALL policies on tickets table
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets they created" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets assigned to them" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets assigned to them" ON tickets;
DROP POLICY IF EXISTS "Users can delete tickets they created" ON tickets;
DROP POLICY IF EXISTS "Admin can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admin can update all tickets" ON tickets;
DROP POLICY IF EXISTS "Admin can delete all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view their tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update assigned tickets" ON tickets;
DROP POLICY IF EXISTS "Users can delete created tickets" ON tickets;

-- Disable RLS on tickets table
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON tickets TO authenticated;
GRANT ALL ON tickets TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tickets' 
AND schemaname = 'public';

-- Test that we can see all tickets
SELECT COUNT(*) as total_tickets FROM tickets;
