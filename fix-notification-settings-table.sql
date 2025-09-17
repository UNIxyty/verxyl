-- Comprehensive script to fix notification_settings table structure
-- This script ensures the table has the correct camelCase column names

-- First, let's see what columns currently exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notification_settings' 
ORDER BY ordinal_position;

-- Add missing camelCase columns if they don't exist
DO $$
BEGIN
    -- Add newTicket column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'newTicket') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "newTicket" BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added newTicket column';
    ELSE
        RAISE NOTICE 'newTicket column already exists';
    END IF;

    -- Add updatetTicket column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'updatetTicket') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "updatetTicket" BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added updatetTicket column';
    ELSE
        RAISE NOTICE 'updatetTicket column already exists';
    END IF;

    -- Add solvedTicket column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'solvedTicket') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "solvedTicket" BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added solvedTicket column';
    ELSE
        RAISE NOTICE 'solvedTicket column already exists';
    END IF;

    -- Add sharedWorkflow column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'sharedWorkflow') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "sharedWorkflow" BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added sharedWorkflow column';
    ELSE
        RAISE NOTICE 'sharedWorkflow column already exists';
    END IF;

    -- Add sharedPrompt column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'sharedPrompt') THEN
        ALTER TABLE public.notification_settings ADD COLUMN "sharedPrompt" BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added sharedPrompt column';
    ELSE
        RAISE NOTICE 'sharedPrompt column already exists';
    END IF;
END $$;

-- Migrate data from old snake_case columns to new camelCase columns
DO $$
BEGIN
    -- Migrate new_ticket to newTicket
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'new_ticket') THEN
        UPDATE public.notification_settings SET "newTicket" = new_ticket WHERE "newTicket" IS NULL;
        RAISE NOTICE 'Migrated data from new_ticket to newTicket';
    END IF;

    -- Migrate updated_ticket to updatetTicket
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'updated_ticket') THEN
        UPDATE public.notification_settings SET "updatetTicket" = updated_ticket WHERE "updatetTicket" IS NULL;
        RAISE NOTICE 'Migrated data from updated_ticket to updatetTicket';
    END IF;

    -- Migrate solved_ticket to solvedTicket
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'solved_ticket') THEN
        UPDATE public.notification_settings SET "solvedTicket" = solved_ticket WHERE "solvedTicket" IS NULL;
        RAISE NOTICE 'Migrated data from solved_ticket to solvedTicket';
    END IF;

    -- Migrate shared_ai_backup to sharedPrompt
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'shared_ai_backup') THEN
        UPDATE public.notification_settings SET "sharedPrompt" = shared_ai_backup WHERE "sharedPrompt" IS NULL;
        RAISE NOTICE 'Migrated data from shared_ai_backup to sharedPrompt';
    END IF;

    -- Migrate shared_n8n_workflow to sharedWorkflow
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'shared_n8n_workflow') THEN
        UPDATE public.notification_settings SET "sharedWorkflow" = shared_n8n_workflow WHERE "sharedWorkflow" IS NULL;
        RAISE NOTICE 'Migrated data from shared_n8n_workflow to sharedWorkflow';
    END IF;
END $$;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notification_settings' 
ORDER BY ordinal_position;

-- Show sample data
SELECT * FROM notification_settings LIMIT 3;
