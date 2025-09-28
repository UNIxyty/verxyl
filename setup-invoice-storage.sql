-- Setup Supabase Storage for Invoice PDFs
-- Run this in your Supabase SQL Editor

-- Create storage bucket for invoices (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices', 
  true,  -- Public access for client viewing
  10485760,  -- 10MB file size limit
  ARRAY['application/pdf']::text[]  -- Only allow PDF files
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the invoices storage bucket
-- Allow public read access to invoice PDFs
CREATE POLICY "Public can view invoice PDFs" ON storage.objects
FOR SELECT USING (bucket_id = 'invoices');

-- Allow authenticated admins to upload invoice PDFs
CREATE POLICY "Admins can upload invoice PDFs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'invoices' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
    AND users.approval_status = 'approved'
  )
);

-- Allow authenticated admins to update invoice PDFs
CREATE POLICY "Admins can update invoice PDFs" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'invoices' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
    AND users.approval_status = 'approved'
  )
);

-- Allow authenticated admins to delete invoice PDFs
CREATE POLICY "Admins can delete invoice PDFs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'invoices' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
    AND users.approval_status = 'approved'
  )
);
