-- Idempotent setup for mail attachments storage
-- This script can be run multiple times safely

-- Create mail_attachments table if it doesn't exist
CREATE TABLE IF NOT EXISTS mail_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mail_id UUID NOT NULL REFERENCES mails(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for mail attachments (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('mail-attachments', 'mail-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on mail_attachments table
ALTER TABLE mail_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view attachments for their mails" ON mail_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for mails they sent" ON mail_attachments;
DROP POLICY IF EXISTS "Users can delete attachments for mails they sent" ON mail_attachments;

-- Create RLS policies for mail_attachments table
CREATE POLICY "Users can view attachments for their mails" ON mail_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mails 
            WHERE mails.id = mail_attachments.mail_id 
            AND (mails.sender_id = auth.uid() OR mails.recipient_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert attachments for mails they sent" ON mail_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM mails 
            WHERE mails.id = mail_attachments.mail_id 
            AND mails.sender_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete attachments for mails they sent" ON mail_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM mails 
            WHERE mails.id = mail_attachments.mail_id 
            AND mails.sender_id = auth.uid()
        )
    );

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload mail attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view mail attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete mail attachments" ON storage.objects;

-- Create storage policies for mail-attachments bucket
CREATE POLICY "Users can upload mail attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'mail-attachments' 
        AND auth.uid()::text = (storage.foldername(name))[2]
    );

CREATE POLICY "Users can view mail attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'mail-attachments' 
        AND EXISTS (
            SELECT 1 FROM mail_attachments ma
            JOIN mails m ON m.id = ma.mail_id
            WHERE ma.file_path = name
            AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete mail attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'mail-attachments' 
        AND EXISTS (
            SELECT 1 FROM mail_attachments ma
            JOIN mails m ON m.id = ma.mail_id
            WHERE ma.file_path = name
            AND m.sender_id = auth.uid()
        )
    );

-- Create indexes for better performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_mail_attachments_mail_id ON mail_attachments(mail_id);
CREATE INDEX IF NOT EXISTS idx_mail_attachments_created_at ON mail_attachments(created_at);

-- Verify setup
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mail_attachments') THEN
        RAISE NOTICE '✅ mail_attachments table exists';
    ELSE
        RAISE NOTICE '❌ mail_attachments table missing';
    END IF;
    
    -- Check if bucket exists
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'mail-attachments') THEN
        RAISE NOTICE '✅ mail-attachments bucket exists';
    ELSE
        RAISE NOTICE '❌ mail-attachments bucket missing';
    END IF;
    
    -- Check if policies exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mail_attachments' AND policyname = 'Users can view attachments for their mails') THEN
        RAISE NOTICE '✅ RLS policies for mail_attachments exist';
    ELSE
        RAISE NOTICE '❌ RLS policies for mail_attachments missing';
    END IF;
    
    -- Check if storage policies exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload mail attachments') THEN
        RAISE NOTICE '✅ Storage policies for mail-attachments exist';
    ELSE
        RAISE NOTICE '❌ Storage policies for mail-attachments missing';
    END IF;
END $$;
