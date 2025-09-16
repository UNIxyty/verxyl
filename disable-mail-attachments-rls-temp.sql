-- Temporarily disable RLS on mail_attachments for testing
-- WARNING: This reduces security - only use for debugging

-- Disable RLS on mail_attachments table
ALTER TABLE mail_attachments DISABLE ROW LEVEL SECURITY;

-- Drop all policies on mail_attachments
DROP POLICY IF EXISTS "Users can view attachments for their mails" ON mail_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for mails they sent" ON mail_attachments;
DROP POLICY IF EXISTS "Users can delete attachments for mails they sent" ON mail_attachments;

-- Drop storage policies for mail-attachments
DROP POLICY IF EXISTS "Users can upload mail attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view mail attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete mail attachments" ON storage.objects;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'mail_attachments';

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('mail_attachments', 'objects') 
AND policyname LIKE '%mail%';
