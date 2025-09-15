-- Fix the role constraint to allow the new roles: admin, worker, viewer
-- The current constraint only allows 'user' and 'admin'

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint that allows all three roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'worker', 'viewer'));

-- Update existing users with role 'user' to 'viewer' (since 'user' is no longer valid)
UPDATE users SET role = 'viewer' WHERE role = 'user';

-- Verify the constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'users' AND constraint_name LIKE '%role%';
