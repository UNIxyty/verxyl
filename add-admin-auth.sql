-- Add admin authentication columns to users table

-- Add approval status column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approval_status') THEN
        ALTER TABLE users ADD COLUMN approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';
    END IF;
END $$;

-- Add role column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user';
    END IF;
END $$;

-- Add approved_by column to track who approved the user
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approved_by') THEN
        ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Add approved_at column to track when the user was approved
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approved_at') THEN
        ALTER TABLE users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add rejection_reason column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'rejection_reason') THEN
        ALTER TABLE users ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Update existing users to have default values
UPDATE users SET approval_status = 'pending' WHERE approval_status IS NULL;
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update user approval status" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own basic info" ON users;

-- Create new RLS policies for admin access
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin' AND approval_status = 'approved'
  )
);

CREATE POLICY "Admins can update user approval status" ON users FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin' AND approval_status = 'approved'
  )
);

-- Allow users to view their own data
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own basic info (but not approval status or role)
CREATE POLICY "Users can update their own basic info" ON users FOR UPDATE USING (
  auth.uid() = id AND 
  approval_status = 'approved'
);