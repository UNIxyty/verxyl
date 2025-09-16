-- Script to create sharing tables for AI prompt backups and N8N workflows

-- Create AI backup shares table
CREATE TABLE IF NOT EXISTS public.ai_backup_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID NOT NULL REFERENCES public.ai_prompt_backups(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(backup_id, recipient_id)
);

-- Create N8N backup shares table
CREATE TABLE IF NOT EXISTS public.n8n_backup_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID NOT NULL REFERENCES public.n8n_project_backups(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(backup_id, recipient_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_backup_shares_owner ON public.ai_backup_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_backup_shares_recipient ON public.ai_backup_shares(recipient_id);
CREATE INDEX IF NOT EXISTS idx_ai_backup_shares_backup ON public.ai_backup_shares(backup_id);

CREATE INDEX IF NOT EXISTS idx_n8n_backup_shares_owner ON public.n8n_backup_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_n8n_backup_shares_recipient ON public.n8n_backup_shares(recipient_id);
CREATE INDEX IF NOT EXISTS idx_n8n_backup_shares_backup ON public.n8n_backup_shares(backup_id);

-- Disable RLS for sharing tables (as requested)
ALTER TABLE public.ai_backup_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_backup_shares DISABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ Created AI backup shares table with indexes and disabled RLS.';
RAISE NOTICE '✅ Created N8N backup shares table with indexes and disabled RLS.';
RAISE NOTICE '🎉 Sharing tables setup completed successfully.';
