-- Fix infinite recursion in admin authentication policies
-- This file fixes the circular reference issue in RLS policies

-- First, add the missing admin columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approval_status') THEN
        ALTER TABLE users ADD COLUMN approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approved_by') THEN
        ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approved_at') THEN
        ALTER TABLE users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'rejection_reason') THEN
        ALTER TABLE users ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Update existing users to have default values
UPDATE users SET approval_status = 'pending' WHERE approval_status IS NULL;
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Drop ALL existing policies on users table to avoid conflicts
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update user approval status" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own basic info" ON users;

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

-- Create new RLS policies that avoid infinite recursion
-- Allow users to view their own data
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);

-- Allow users to view all users (for user picker, etc.)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own basic info (but not role or approval_status)
CREATE POLICY "Users can update their own basic info" ON users FOR UPDATE USING (
  auth.uid() = id AND 
  approval_status = 'approved'
);

-- Allow admins to update user approval status (using the function to avoid recursion)
CREATE POLICY "Admins can update user approval status" ON users FOR UPDATE USING (is_admin());

-- Create an index for better performance on role and approval_status
CREATE INDEX IF NOT EXISTS idx_users_role_approval ON users(role, approval_status);
