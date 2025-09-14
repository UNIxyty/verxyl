-- Enable RLS (Row Level Security)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT,
  telegram_username TEXT,
  telegram_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  details TEXT NOT NULL,
  status TEXT CHECK (status IN ('new', 'in_progress', 'completed')) DEFAULT 'new',
  assigned_to UUID REFERENCES users(id) NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  solution_type TEXT CHECK (solution_type IN ('prompt', 'n8n_workflow', 'other')),
  solution_data JSONB,
  output_result JSONB,
  user_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add edited column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'edited') THEN
        ALTER TABLE tickets ADD COLUMN edited BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add user_notified column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'user_notified') THEN
        ALTER TABLE tickets ADD COLUMN user_notified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add telegram_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'telegram_id') THEN
        ALTER TABLE users ADD COLUMN telegram_id TEXT;
    END IF;
END $$;

-- AI Prompt Backups table
CREATE TABLE IF NOT EXISTS ai_prompt_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  prompt_text TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  previous_version_id UUID REFERENCES ai_prompt_backups(id),
  output_logic JSONB,
  output_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- N8N Project Backups table
CREATE TABLE IF NOT EXISTS n8n_project_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  project_name TEXT NOT NULL,
  workflow_json JSONB NOT NULL,
  previous_version_id UUID REFERENCES n8n_project_backups(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_project_backups ENABLE ROW LEVEL SECURITY;

-- Users policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all users' AND tablename = 'users') THEN
        CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Tickets policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all tickets' AND tablename = 'tickets') THEN
        CREATE POLICY "Users can view all tickets" ON tickets FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create tickets' AND tablename = 'tickets') THEN
        CREATE POLICY "Users can create tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update tickets they created or are assigned to' AND tablename = 'tickets') THEN
        CREATE POLICY "Users can update tickets they created or are assigned to" ON tickets FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete tickets they created' AND tablename = 'tickets') THEN
        CREATE POLICY "Users can delete tickets they created" ON tickets FOR DELETE USING (auth.uid() = created_by);
    END IF;
END $$;

-- AI Prompt Backups policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own AI prompt backups' AND tablename = 'ai_prompt_backups') THEN
        CREATE POLICY "Users can view their own AI prompt backups" ON ai_prompt_backups FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own AI prompt backups' AND tablename = 'ai_prompt_backups') THEN
        CREATE POLICY "Users can create their own AI prompt backups" ON ai_prompt_backups FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own AI prompt backups' AND tablename = 'ai_prompt_backups') THEN
        CREATE POLICY "Users can update their own AI prompt backups" ON ai_prompt_backups FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own AI prompt backups' AND tablename = 'ai_prompt_backups') THEN
        CREATE POLICY "Users can delete their own AI prompt backups" ON ai_prompt_backups FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- N8N Project Backups policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own N8N project backups' AND tablename = 'n8n_project_backups') THEN
        CREATE POLICY "Users can view their own N8N project backups" ON n8n_project_backups FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own N8N project backups' AND tablename = 'n8n_project_backups') THEN
        CREATE POLICY "Users can create their own N8N project backups" ON n8n_project_backups FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own N8N project backups' AND tablename = 'n8n_project_backups') THEN
        CREATE POLICY "Users can update their own N8N project backups" ON n8n_project_backups FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own N8N project backups' AND tablename = 'n8n_project_backups') THEN
        CREATE POLICY "Users can delete their own N8N project backups" ON n8n_project_backups FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tickets_updated_at') THEN
        CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_prompt_backups_updated_at') THEN
        CREATE TRIGGER update_ai_prompt_backups_updated_at BEFORE UPDATE ON ai_prompt_backups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_n8n_project_backups_updated_at') THEN
        CREATE TRIGGER update_n8n_project_backups_updated_at BEFORE UPDATE ON n8n_project_backups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_backups_user_id ON ai_prompt_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_project_backups_user_id ON n8n_project_backups(user_id);
