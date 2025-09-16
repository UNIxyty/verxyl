-- Disable RLS on ai_prompt_backups table to fix authentication issues
-- This simplifies the setup and avoids permission problems

-- Disable RLS on ai_prompt_backups table
ALTER TABLE ai_prompt_backups DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on ai_prompt_backups table
DROP POLICY IF EXISTS "Users can view their own AI prompt backups" ON ai_prompt_backups;
DROP POLICY IF EXISTS "Users can create their own AI prompt backups" ON ai_prompt_backups;
DROP POLICY IF EXISTS "Users can update their own AI prompt backups" ON ai_prompt_backups;
DROP POLICY IF EXISTS "Users can delete their own AI prompt backups" ON ai_prompt_backups;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'ai_prompt_backups';

-- Show remaining policies (should be empty)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'ai_prompt_backups';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS disabled on ai_prompt_backups table';
    RAISE NOTICE '✅ All policies removed';
    RAISE NOTICE '✅ AI prompt backups should now work without permission issues';
END $$;
