-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_company TEXT,
    project_description TEXT NOT NULL,
    project_points_problems TEXT NOT NULL,
    invoice_pdf TEXT, -- URL/path to the PDF file in Supabase Storage
    payment_link TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Public can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;

-- Create policies for invoices
-- Allow public read access for invoices (since these are client-facing)
CREATE POLICY "Public can view invoices" ON public.invoices
    FOR SELECT USING (true);

-- Only admins can insert, update, delete invoices
CREATE POLICY "Admins can manage invoices" ON public.invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.approval_status = 'approved'
        )
    );

-- Create an index for faster lookups by ID
CREATE INDEX IF NOT EXISTS idx_invoices_id ON public.invoices(id);

-- Create updated_at trigger function (replace if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

