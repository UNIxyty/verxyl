-- Add telegram_id column to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'telegram_id') THEN
        ALTER TABLE users ADD COLUMN telegram_id TEXT;
    END IF;
END $$;
