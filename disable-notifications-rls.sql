-- Script to disable Row Level Security (RLS) for notifications table

-- Disable RLS for 'notifications' table
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
RAISE NOTICE '✅ RLS disabled for notifications table.';

-- Drop all existing policies for notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.notifications;
RAISE NOTICE '✅ Dropped all RLS policies for notifications table.';

-- Also disable RLS for notification_settings table if it exists
DO $$
BEGIN
    ALTER TABLE public.notification_settings DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS disabled for notification_settings table.';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE '⚠️ notification_settings table does not exist, skipping.';
END $$;

-- Drop all existing policies for notification_settings table
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can create notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can view notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notification_settings;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.notification_settings;
DROP POLICY IF EXISTS "Enable update for all users" ON public.notification_settings;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.notification_settings;
RAISE NOTICE '✅ Dropped all RLS policies for notification_settings table.';

RAISE NOTICE '🎉 RLS configuration for notifications completed.';
RAISE NOTICE '📋 Notifications and notification_settings tables now have unrestricted access.';
