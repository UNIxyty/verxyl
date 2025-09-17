-- Script to delete all unused tables from the database
-- This script removes tables that are no longer needed after webhook system removal

-- Drop foreign key constraints first to avoid dependency issues
ALTER TABLE public.notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;
ALTER TABLE public.system_settings DROP CONSTRAINT IF EXISTS system_settings_user_id_fkey;
ALTER TABLE public.mails DROP CONSTRAINT IF EXISTS mails_user_id_fkey;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Drop unused tables (these were created for features that have been removed)
DROP TABLE IF EXISTS public.notification_settings CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.mails CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Drop any related RLS policies (if they were created)
DROP POLICY IF EXISTS "Users can manage notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can view notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can create notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete notification settings" ON public.notification_settings;

DROP POLICY IF EXISTS "Users can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can create system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can delete system settings" ON public.system_settings;

DROP POLICY IF EXISTS "Users can view their own mails" ON public.mails;
DROP POLICY IF EXISTS "Users can create mails" ON public.mails;
DROP POLICY IF EXISTS "Users can update their own mails" ON public.mails;
DROP POLICY IF EXISTS "Users can delete their own mails" ON public.mails;

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Drop any related functions or triggers
DROP FUNCTION IF EXISTS public.update_notification_settings_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_system_settings_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_mails_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_invoices_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_projects_updated_at() CASCADE;

-- Drop any related indexes
DROP INDEX IF EXISTS idx_notification_settings_user_id;
DROP INDEX IF EXISTS idx_notification_settings_key;
DROP INDEX IF EXISTS idx_system_settings_key;
DROP INDEX IF EXISTS idx_mails_user_id;
DROP INDEX IF EXISTS idx_mails_status;
DROP INDEX IF EXISTS idx_invoices_user_id;
DROP INDEX IF EXISTS idx_invoices_status;
DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_projects_status;

-- Drop any related types or enums if they were created
DROP TYPE IF EXISTS public.notification_key_enum;
DROP TYPE IF EXISTS public.mail_status_enum;
DROP TYPE IF EXISTS public.invoice_status_enum;
DROP TYPE IF EXISTS public.project_status_enum;

-- Show what tables remain (the ones that are actually being used)
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully deleted unused tables:';
    RAISE NOTICE '   - notification_settings';
    RAISE NOTICE '   - system_settings';
    RAISE NOTICE '   - mails';
    RAISE NOTICE '   - invoices';
    RAISE NOTICE '   - projects';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Remaining tables (actively used):';
    RAISE NOTICE '   - users (core user management)';
    RAISE NOTICE '   - tickets (main ticket system)';
    RAISE NOTICE '   - ai_prompt_backups (AI prompt backups)';
    RAISE NOTICE '   - n8n_project_backups (N8N workflow backups)';
    RAISE NOTICE '   - ai_backup_shares (AI prompt sharing)';
    RAISE NOTICE '   - n8n_backup_shares (N8N workflow sharing)';
    RAISE NOTICE '   - notifications (user notifications)';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Database cleanup completed successfully!';
END $$;
