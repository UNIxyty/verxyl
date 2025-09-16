-- Script to ensure backup tables exist and have RLS disabled

-- Create ai_prompt_backups table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_prompt_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    prompt_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create n8n_project_backups table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.n8n_project_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    workflow_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for backup tables
ALTER TABLE public.ai_prompt_backups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_project_backups DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for backup tables
DROP POLICY IF EXISTS "Users can view their own AI prompt backups" ON public.ai_prompt_backups;
DROP POLICY IF EXISTS "Users can create AI prompt backups" ON public.ai_prompt_backups;
DROP POLICY IF EXISTS "Users can update their own AI prompt backups" ON public.ai_prompt_backups;
DROP POLICY IF EXISTS "Users can delete their own AI prompt backups" ON public.ai_prompt_backups;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_prompt_backups;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.ai_prompt_backups;
DROP POLICY IF EXISTS "Enable update for all users" ON public.ai_prompt_backups;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.ai_prompt_backups;

DROP POLICY IF EXISTS "Users can view their own N8N project backups" ON public.n8n_project_backups;
DROP POLICY IF EXISTS "Users can create N8N project backups" ON public.n8n_project_backups;
DROP POLICY IF EXISTS "Users can update their own N8N project backups" ON public.n8n_project_backups;
DROP POLICY IF EXISTS "Users can delete their own N8N project backups" ON public.n8n_project_backups;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.n8n_project_backups;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.n8n_project_backups;
DROP POLICY IF EXISTS "Enable update for all users" ON public.n8n_project_backups;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.n8n_project_backups;
