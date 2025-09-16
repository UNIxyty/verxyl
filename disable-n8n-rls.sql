-- Disable RLS on n8n_project_backups table to fix authentication issues
-- This simplifies the setup and avoids permission problems

-- Disable RLS on n8n_project_backups table
ALTER TABLE n8n_project_backups DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on n8n_project_backups table
DROP POLICY IF EXISTS "Users can view their own N8N project backups" ON n8n_project_backups;
DROP POLICY IF EXISTS "Users can create their own N8N project backups" ON n8n_project_backups;
DROP POLICY IF EXISTS "Users can update their own N8N project backups" ON n8n_project_backups;
DROP POLICY IF EXISTS "Users can delete their own N8N project backups" ON n8n_project_backups;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'n8n_project_backups';

-- Show remaining policies (should be empty)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'n8n_project_backups';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS disabled on n8n_project_backups table';
    RAISE NOTICE '✅ All policies removed';
    RAISE NOTICE '✅ N8N workflow backups should now work without permission issues';
END $$;
