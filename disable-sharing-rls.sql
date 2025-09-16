-- Script to disable RLS for sharing tables

-- Disable RLS for ai_backup_shares table
ALTER TABLE public.ai_backup_shares DISABLE ROW LEVEL SECURITY;

-- Disable RLS for n8n_backup_shares table  
ALTER TABLE public.n8n_backup_shares DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies for ai_backup_shares table
DROP POLICY IF EXISTS "Users can view AI backup shares" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Users can create AI backup shares" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Users can update AI backup shares" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Users can delete AI backup shares" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Enable update for all users" ON public.ai_backup_shares;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.ai_backup_shares;

-- Drop any existing policies for n8n_backup_shares table
DROP POLICY IF EXISTS "Users can view N8N backup shares" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Users can create N8N backup shares" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Users can update N8N backup shares" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Users can delete N8N backup shares" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Enable update for all users" ON public.n8n_backup_shares;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.n8n_backup_shares;
