-- Script to update notification_settings table columns to match new webhook structure

-- Add new columns if they don't exist
DO $$
BEGIN
    -- Add newTicket column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'newTicket') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "newTicket" BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add updatetTicket column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'updatetTicket') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "updatetTicket" BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add solvedTicket column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'solvedTicket') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "solvedTicket" BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add sharedWorkflow column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'sharedWorkflow') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "sharedWorkflow" BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add sharedPrompt column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'sharedPrompt') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "sharedPrompt" BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Migrate data from old columns to new columns (if old columns exist)
DO $$
BEGIN
    -- Migrate new_ticket to newTicket
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'new_ticket') THEN
        UPDATE public.notification_settings SET "newTicket" = new_ticket WHERE "newTicket" IS NULL;
    END IF;

    -- Migrate updated_ticket to updatetTicket
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'updated_ticket') THEN
        UPDATE public.notification_settings SET "updatetTicket" = updated_ticket WHERE "updatetTicket" IS NULL;
    END IF;

    -- Migrate solved_ticket to solvedTicket
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'solved_ticket') THEN
        UPDATE public.notification_settings SET "solvedTicket" = solved_ticket WHERE "solvedTicket" IS NULL;
    END IF;

    -- Migrate shared_ai_backup to sharedPrompt
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'shared_ai_backup') THEN
        UPDATE public.notification_settings SET "sharedPrompt" = shared_ai_backup WHERE "sharedPrompt" IS NULL;
    END IF;

    -- Migrate shared_n8n_workflow to sharedWorkflow
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'shared_n8n_workflow') THEN
        UPDATE public.notification_settings SET "sharedWorkflow" = shared_n8n_workflow WHERE "sharedWorkflow" IS NULL;
    END IF;
END $$;

-- Optional: Drop old columns after migration (uncomment if you want to remove old columns)
-- ALTER TABLE public.notification_settings DROP COLUMN IF EXISTS new_ticket;
-- ALTER TABLE public.notification_settings DROP COLUMN IF EXISTS updated_ticket;
-- ALTER TABLE public.notification_settings DROP COLUMN IF EXISTS solved_ticket;
-- ALTER TABLE public.notification_settings DROP COLUMN IF EXISTS shared_ai_backup;
-- ALTER TABLE public.notification_settings DROP COLUMN IF EXISTS shared_n8n_workflow;
