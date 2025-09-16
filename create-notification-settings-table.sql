-- Script to create notification_settings table

-- Create notification_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    new_ticket BOOLEAN DEFAULT TRUE,
    updated_ticket BOOLEAN DEFAULT TRUE,
    deleted_ticket BOOLEAN DEFAULT TRUE,
    solved_ticket BOOLEAN DEFAULT TRUE,
    in_work_ticket BOOLEAN DEFAULT TRUE,
    shared_ai_backup BOOLEAN DEFAULT TRUE,
    shared_n8n_workflow BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);

-- Disable RLS for the table
ALTER TABLE public.notification_settings DISABLE ROW LEVEL SECURITY;
