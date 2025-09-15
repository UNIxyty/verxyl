-- Fix the role constraint to allow the new roles: admin, worker, viewer
-- The current constraint only allows 'user' and 'admin'

-- First, let's see what roles currently exist in the database
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Show all current constraints on the users table
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'users' AND constraint_name LIKE '%role%';

-- Drop ALL existing role constraints (there might be multiple)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check2;

-- Update existing users with role 'user' to 'viewer' (since 'user' is no longer valid)
UPDATE users SET role = 'viewer' WHERE role = 'user';

-- Update any NULL roles to 'viewer' as well
UPDATE users SET role = 'viewer' WHERE role IS NULL;

-- Now add the new constraint that allows all three roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'worker', 'viewer'));

-- Verify the new constraint was added
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'users' AND constraint_name LIKE '%role%';

-- Show final role distribution
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Test that we can now update roles
UPDATE users SET role = 'admin' WHERE role = 'viewer' LIMIT 1;
UPDATE users SET role = 'viewer' WHERE role = 'admin' LIMIT 1;
