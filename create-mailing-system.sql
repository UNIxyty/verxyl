-- Ensure required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create mails table
CREATE TABLE IF NOT EXISTS mails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  mail_type VARCHAR(50) DEFAULT 'message', -- 'message', 'ticket_notification', 'backup_share', 'system'
  related_id UUID, -- For ticket notifications, backup shares, etc.
  related_type VARCHAR(50), -- 'ticket', 'ai_backup', 'n8n_workflow'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  archived BOOLEAN DEFAULT FALSE
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_ticket BOOLEAN DEFAULT TRUE,
  updated_ticket BOOLEAN DEFAULT TRUE,
  deleted_ticket BOOLEAN DEFAULT TRUE,
  solved_ticket BOOLEAN DEFAULT TRUE,
  in_work_ticket BOOLEAN DEFAULT TRUE,
  shared_ai_backup BOOLEAN DEFAULT TRUE,
  shared_n8n_workflow BOOLEAN DEFAULT TRUE,
  new_mail BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Create backup_shares table for sharing AI backups and N8N workflows
CREATE TABLE IF NOT EXISTS backup_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID NOT NULL, -- References to ai_backups or n8n_backups
  backup_type VARCHAR(50) NOT NULL, -- 'ai_backup' or 'n8n_workflow'
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  message TEXT -- Optional message when sharing
);

-- Enable Row Level Security
ALTER TABLE mails ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_shares ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'mails' AND policyname = 'Users can view their own mails'
  ) THEN
    CREATE POLICY "Users can view their own mails" ON mails
      FOR SELECT USING (
        auth.uid()::text = sender_id::text OR 
        auth.uid()::text = recipient_id::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'mails' AND policyname = 'Users can send mails'
  ) THEN
    CREATE POLICY "Users can send mails" ON mails
      FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'mails' AND policyname = 'Users can update their received mails'
  ) THEN
    CREATE POLICY "Users can update their received mails" ON mails
      FOR UPDATE USING (auth.uid()::text = recipient_id::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notification_settings' AND policyname = 'Users can manage their own notification settings'
  ) THEN
    CREATE POLICY "Users can manage their own notification settings" ON notification_settings
      FOR ALL USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'backup_shares' AND policyname = 'Users can view backup shares they sent or received'
  ) THEN
    CREATE POLICY "Users can view backup shares they sent or received" ON backup_shares
      FOR SELECT USING (
        auth.uid()::text = shared_by::text OR 
        auth.uid()::text = shared_with::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'backup_shares' AND policyname = 'Users can create backup shares'
  ) THEN
    CREATE POLICY "Users can create backup shares" ON backup_shares
      FOR INSERT WITH CHECK (auth.uid()::text = shared_by::text);
  END IF;
END $$;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mails_recipient_id ON mails(recipient_id);
CREATE INDEX IF NOT EXISTS idx_mails_sender_id ON mails(sender_id);
CREATE INDEX IF NOT EXISTS idx_mails_created_at ON mails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mails_is_read ON mails(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_shares_shared_with ON backup_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_backup_shares_shared_by ON backup_shares(shared_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for notification_settings (create only if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_notification_settings_updated_at 
      BEFORE UPDATE ON notification_settings 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
