-- Re-enable Row Level Security with proper policies
-- This script fixes the unrestricted database tables issue

-- First, enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;

DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets they created" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets assigned to them" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets assigned to them" ON tickets;
DROP POLICY IF EXISTS "Users can delete tickets they created" ON tickets;
DROP POLICY IF EXISTS "Admin can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admin can update all tickets" ON tickets;
DROP POLICY IF EXISTS "Admin can delete all tickets" ON tickets;

-- Create a function to check if current user is admin (avoids infinite recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND approval_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies (non-recursive)
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Admin policies for users (using the function to avoid recursion)
CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE USING (is_admin());

-- Tickets table policies
CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = created_by::uuid);

CREATE POLICY "Users can view tickets they created" ON tickets
    FOR SELECT USING (auth.uid() = created_by::uuid);

CREATE POLICY "Users can view tickets assigned to them" ON tickets
    FOR SELECT USING (auth.uid() = assigned_to::uuid);

CREATE POLICY "Users can update tickets assigned to them" ON tickets
    FOR UPDATE USING (auth.uid() = assigned_to::uuid);

CREATE POLICY "Users can delete tickets they created" ON tickets
    FOR DELETE USING (auth.uid() = created_by::uuid);

-- Admin policies for tickets
CREATE POLICY "Admin can view all tickets" ON tickets
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin can update all tickets" ON tickets
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete all tickets" ON tickets
    FOR DELETE USING (is_admin());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON tickets TO authenticated;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'tickets') 
AND schemaname = 'public';
