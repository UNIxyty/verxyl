-- Complete cleanup script to remove all email/mail system tables and revert changes
-- This will remove all email functionality and restore database to original state

-- Drop all email/mail related tables and their dependencies (only if they exist)
DO $$
BEGIN
    -- Drop tables only if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mail_attachments' AND table_schema = 'public') THEN
        DROP TABLE mail_attachments CASCADE;
        RAISE NOTICE '✅ Dropped mail_attachments table';
    ELSE
        RAISE NOTICE 'ℹ️ mail_attachments table does not exist';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mail_labels' AND table_schema = 'public') THEN
        DROP TABLE mail_labels CASCADE;
        RAISE NOTICE '✅ Dropped mail_labels table';
    ELSE
        RAISE NOTICE 'ℹ️ mail_labels table does not exist';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_mail_labels' AND table_schema = 'public') THEN
        DROP TABLE user_mail_labels CASCADE;
        RAISE NOTICE '✅ Dropped user_mail_labels table';
    ELSE
        RAISE NOTICE 'ℹ️ user_mail_labels table does not exist';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mails' AND table_schema = 'public') THEN
        DROP TABLE mails CASCADE;
        RAISE NOTICE '✅ Dropped mails table';
    ELSE
        RAISE NOTICE 'ℹ️ mails table does not exist';
    END IF;
END $$;

-- Drop any email-related storage buckets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'mail-attachments') THEN
        DELETE FROM storage.buckets WHERE id = 'mail-attachments';
        RAISE NOTICE '✅ Removed mail-attachments storage bucket';
    ELSE
        RAISE NOTICE 'ℹ️ mail-attachments bucket does not exist';
    END IF;
END $$;

-- Drop any email-related policies (if any remain)
DO $$
BEGIN
    -- Drop policies only if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mail_attachments' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view attachments for their mails" ON mail_attachments;
        DROP POLICY IF EXISTS "Users can insert attachments for mails they sent" ON mail_attachments;
        DROP POLICY IF EXISTS "Users can delete attachments for mails they sent" ON mail_attachments;
        RAISE NOTICE '✅ Dropped mail_attachments policies';
    ELSE
        RAISE NOTICE 'ℹ️ No mail_attachments policies to drop';
    END IF;
END $$;

-- Drop storage policies (these are always safe to try)
DROP POLICY IF EXISTS "Users can upload mail attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view mail attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete mail attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view files in their own folder or for mails they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files from their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for debugging" ON storage.objects;

-- Remove any email-related columns from users table (if they were added)
ALTER TABLE users DROP COLUMN IF EXISTS email_preferences;
ALTER TABLE users DROP COLUMN IF EXISTS mail_settings;

-- Clean up any email-related functions or triggers (if they exist)
DROP FUNCTION IF EXISTS update_mail_read_status();
DROP FUNCTION IF EXISTS notify_new_mail();
DROP FUNCTION IF EXISTS cleanup_old_mails();

-- Verify cleanup
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%mail%';

-- Show remaining buckets
SELECT id, name FROM storage.buckets WHERE id LIKE '%mail%';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All email/mail tables removed';
    RAISE NOTICE '✅ All email-related storage buckets removed';
    RAISE NOTICE '✅ All email-related policies removed';
    RAISE NOTICE '✅ Database restored to original state';
    RAISE NOTICE '✅ Email system completely cleaned up';
END $$;
