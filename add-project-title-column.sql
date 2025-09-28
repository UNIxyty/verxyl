-- Add project_title column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS project_title TEXT;

-- Make project_title required for new invoices (but allow existing ones to be null for backward compatibility)
-- We'll handle the requirement in the application layer
