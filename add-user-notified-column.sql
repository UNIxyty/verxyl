-- Add user_notified column to tickets table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'user_notified') THEN
        ALTER TABLE tickets ADD COLUMN user_notified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
