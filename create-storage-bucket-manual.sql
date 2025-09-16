-- Manual storage bucket creation for mail attachments
-- Run this in Supabase SQL Editor if the automatic setup doesn't work

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mail-attachments', 'mail-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'mail-attachments';

-- Create storage policies (these will be created automatically, but we can set them explicitly)
-- Note: These might need to be created through the Supabase dashboard instead

-- Check if bucket exists and is accessible
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'mail-attachments') THEN
        RAISE NOTICE '✅ mail-attachments bucket created successfully';
    ELSE
        RAISE NOTICE '❌ Failed to create mail-attachments bucket';
    END IF;
END $$;
