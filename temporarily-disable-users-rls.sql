-- Temporarily disable RLS on users table to test if RLS policies are blocking updates
-- This will help us identify if the issue is RLS-related

-- Show current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Show current RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Show updated RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Test if updates work now (this will be done via the API)
-- After testing, re-enable RLS with:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
