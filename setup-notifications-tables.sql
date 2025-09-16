-- Script to create both notifications and notification_settings tables

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    redirect_path TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);

-- Disable RLS for both tables
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings DISABLE ROW LEVEL SECURITY;
