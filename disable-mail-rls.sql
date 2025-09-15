-- Disable RLS on mails table temporarily for testing
ALTER TABLE mails DISABLE ROW LEVEL SECURITY;

-- Check if RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'mails';
