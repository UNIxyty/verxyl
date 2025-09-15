-- Temporarily disable RLS on users table for testing user profile APIs
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Check if RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'mails');
