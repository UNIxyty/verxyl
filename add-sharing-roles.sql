-- Script to add role-based sharing permissions to existing sharing tables

-- Add access_role column to AI backup shares table
ALTER TABLE public.ai_backup_shares 
ADD COLUMN IF NOT EXISTS access_role VARCHAR(20) DEFAULT 'viewer' CHECK (access_role IN ('viewer', 'editor'));

-- Add access_role column to N8N backup shares table  
ALTER TABLE public.n8n_backup_shares 
ADD COLUMN IF NOT EXISTS access_role VARCHAR(20) DEFAULT 'viewer' CHECK (access_role IN ('viewer', 'editor'));

-- Add comments for clarity
COMMENT ON COLUMN public.ai_backup_shares.access_role IS 'Access level: viewer (read-only) or editor (can modify)';
COMMENT ON COLUMN public.n8n_backup_shares.access_role IS 'Access level: viewer (read-only) or editor (can modify)';

-- Create indexes for better performance on role queries
CREATE INDEX IF NOT EXISTS idx_ai_backup_shares_role ON public.ai_backup_shares(access_role);
CREATE INDEX IF NOT EXISTS idx_n8n_backup_shares_role ON public.n8n_backup_shares(access_role);

RAISE NOTICE '✅ Added access_role columns to sharing tables.';
RAISE NOTICE '✅ Added role-based permissions: viewer (read-only) and editor (can modify).';
RAISE NOTICE '✅ Added indexes for role-based queries.';
RAISE NOTICE '🎉 Role-based sharing permissions setup completed.';
