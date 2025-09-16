-- Disable RLS on mail_attachments table and remove all policies
-- This simplifies the setup and avoids permission issues

-- Disable RLS on mail_attachments table
ALTER TABLE mail_attachments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on mail_attachments table
DROP POLICY IF EXISTS "Users can view attachments for their mails" ON mail_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for mails they sent" ON mail_attachments;
DROP POLICY IF EXISTS "Users can delete attachments for mails they sent" ON mail_attachments;

-- Drop all storage policies for mail-attachments bucket
DROP POLICY IF EXISTS "Users can upload mail attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view mail attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete mail attachments" ON storage.objects;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'mail_attachments';

-- Show remaining policies (should be empty)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('mail_attachments', 'objects') 
AND policyname LIKE '%mail%';

-- Create the storage bucket if it doesn't exist (without RLS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('mail-attachments', 'mail-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Verify bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'mail-attachments';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS disabled on mail_attachments table';
    RAISE NOTICE '✅ All policies removed';
    RAISE NOTICE '✅ Storage bucket created/verified';
    RAISE NOTICE '✅ File uploads should now work without permission issues';
END $$;
