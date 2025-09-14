-- Simple script to add the edited column to tickets table
-- This can be run safely multiple times

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'edited') THEN
        ALTER TABLE tickets ADD COLUMN edited BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added edited column to tickets table';
    ELSE
        RAISE NOTICE 'edited column already exists in tickets table';
    END IF;
END $$;
