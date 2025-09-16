-- Complete script to fix sharing functionality

-- First, ensure the sharing tables exist with correct structure
CREATE TABLE IF NOT EXISTS public.ai_backup_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID REFERENCES public.ai_prompt_backups(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    access_role VARCHAR(10) NOT NULL DEFAULT 'viewer',
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (backup_id, recipient_id)
);

CREATE TABLE IF NOT EXISTS public.n8n_backup_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID REFERENCES public.n8n_project_backups(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    access_role VARCHAR(10) NOT NULL DEFAULT 'viewer',
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (backup_id, recipient_id)
);

-- Add access_role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_backup_shares' AND column_name = 'access_role') THEN
        ALTER TABLE public.ai_backup_shares ADD COLUMN access_role VARCHAR(10) NOT NULL DEFAULT 'viewer';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'n8n_backup_shares' AND column_name = 'access_role') THEN
        ALTER TABLE public.n8n_backup_shares ADD COLUMN access_role VARCHAR(10) NOT NULL DEFAULT 'viewer';
    END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_ai_access_role') THEN
        ALTER TABLE public.ai_backup_shares ADD CONSTRAINT chk_ai_access_role CHECK (access_role IN ('viewer', 'editor'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_n8n_access_role') THEN
        ALTER TABLE public.n8n_backup_shares ADD CONSTRAINT chk_n8n_access_role CHECK (access_role IN ('viewer', 'editor'));
    END IF;
END $$;

-- Disable RLS for sharing tables
ALTER TABLE public.ai_backup_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_backup_shares DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for sharing tables
DROP POLICY IF EXISTS "Users can view AI backup shares" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Users can create AI backup shares" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Users can update AI backup shares" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Users can delete AI backup shares" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Enable update for all users" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.ai_backup_shares;

DROP POLICY IF EXISTS "Users can view N8N backup shares" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Users can create N8N backup shares" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Users can update N8N backup shares" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Users can delete N8N backup shares" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Enable update for all users" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.n8n_backup_shares;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_backup_shares_backup_id ON public.ai_backup_shares (backup_id);
CREATE INDEX IF NOT EXISTS idx_ai_backup_shares_recipient_id ON public.ai_backup_shares (recipient_id);
CREATE INDEX IF NOT EXISTS idx_ai_backup_shares_owner_id ON public.ai_backup_shares (owner_id);
CREATE INDEX IF NOT EXISTS idx_n8n_backup_shares_backup_id ON public.n8n_backup_shares (backup_id);
CREATE INDEX IF NOT EXISTS idx_n8n_backup_shares_recipient_id ON public.n8n_backup_shares (recipient_id);
CREATE INDEX IF NOT EXISTS idx_n8n_backup_shares_owner_id ON public.n8n_backup_shares (owner_id);
