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

-- Create storage bucket for mail attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('mail-attachments', 'mail-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for mail_attachments table
ALTER TABLE mail_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments for mails they sent or received
CREATE POLICY "Users can view attachments for their mails" ON mail_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mails 
            WHERE mails.id = mail_attachments.mail_id 
            AND (mails.sender_id = auth.uid() OR mails.recipient_id = auth.uid())
        )
    );

-- Policy: Users can insert attachments for mails they sent
CREATE POLICY "Users can insert attachments for mails they sent" ON mail_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM mails 
            WHERE mails.id = mail_attachments.mail_id 
            AND mails.sender_id = auth.uid()
        )
    );

-- Policy: Users can delete attachments for mails they sent
CREATE POLICY "Users can delete attachments for mails they sent" ON mail_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM mails 
            WHERE mails.id = mail_attachments.mail_id 
            AND mails.sender_id = auth.uid()
        )
    );

-- Storage policies for mail-attachments bucket
-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload mail attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'mail-attachments' 
        AND auth.uid()::text = (storage.foldername(name))[2]
    );

-- Policy: Users can view files for mails they have access to
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

-- Policy: Users can delete files for mails they sent
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mail_attachments_mail_id ON mail_attachments(mail_id);
CREATE INDEX IF NOT EXISTS idx_mail_attachments_created_at ON mail_attachments(created_at);
