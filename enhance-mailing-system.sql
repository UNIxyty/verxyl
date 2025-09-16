-- Enhance mailing system with Gmail-like features
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add new columns to mails table for Gmail-like features
ALTER TABLE mails ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;
ALTER TABLE mails ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE mails ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE;
ALTER TABLE mails ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT FALSE;
ALTER TABLE mails ADD COLUMN IF NOT EXISTS is_trash BOOLEAN DEFAULT FALSE;
ALTER TABLE mails ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE mails ADD COLUMN IF NOT EXISTS reply_to_mail_id UUID REFERENCES mails(id) ON DELETE SET NULL;
ALTER TABLE mails ADD COLUMN IF NOT EXISTS thread_id UUID DEFAULT gen_random_uuid();

-- Create mail_labels table for custom labels
CREATE TABLE IF NOT EXISTS mail_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Create mail_attachments table
CREATE TABLE IF NOT EXISTS mail_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_id UUID NOT NULL REFERENCES mails(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'ticket_created', 'ticket_assigned', 'role_changed', 'mail_received', 'project_created', 'invoice_created'
  related_id UUID, -- ID of related entity (ticket, mail, project, invoice)
  related_type VARCHAR(50), -- 'ticket', 'mail', 'project', 'invoice', 'user'
  is_read BOOLEAN DEFAULT FALSE,
  redirect_path VARCHAR(255), -- Path to redirect when clicked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'on_hold', 'cancelled'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  budget DECIMAL(10,2),
  progress INTEGER DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE mail_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mail_labels
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own mail labels' AND tablename = 'mail_labels') THEN
    CREATE POLICY "Users can manage their own mail labels" ON mail_labels
      FOR ALL USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

-- RLS Policies for mail_attachments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view attachments of their mails' AND tablename = 'mail_attachments') THEN
    CREATE POLICY "Users can view attachments of their mails" ON mail_attachments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM mails 
          WHERE mails.id = mail_attachments.mail_id 
          AND (mails.sender_id::text = auth.uid()::text OR mails.recipient_id::text = auth.uid()::text)
        )
      );
  END IF;
END $$;

-- RLS Policies for notifications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can view their own notifications" ON notifications
      FOR SELECT USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can update their own notifications" ON notifications
      FOR UPDATE USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

-- RLS Policies for projects
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view projects they created or are assigned to' AND tablename = 'projects') THEN
    CREATE POLICY "Users can view projects they created or are assigned to" ON projects
      FOR SELECT USING (
        auth.uid()::text = created_by::text OR 
        auth.uid()::text = assigned_to::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create projects' AND tablename = 'projects') THEN
    CREATE POLICY "Users can create projects" ON projects
      FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update projects they created or are assigned to' AND tablename = 'projects') THEN
    CREATE POLICY "Users can update projects they created or are assigned to" ON projects
      FOR UPDATE USING (
        auth.uid()::text = created_by::text OR 
        auth.uid()::text = assigned_to::text
      );
  END IF;
END $$;

-- RLS Policies for invoices
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view invoices they created or are client of' AND tablename = 'invoices') THEN
    CREATE POLICY "Users can view invoices they created or are client of" ON invoices
      FOR SELECT USING (
        auth.uid()::text = created_by::text OR 
        auth.uid()::text = client_id::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create invoices' AND tablename = 'invoices') THEN
    CREATE POLICY "Users can create invoices" ON invoices
      FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update invoices they created' AND tablename = 'invoices') THEN
    CREATE POLICY "Users can update invoices they created" ON invoices
      FOR UPDATE USING (auth.uid()::text = created_by::text);
  END IF;
END $$;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mails_is_draft ON mails(is_draft);
CREATE INDEX IF NOT EXISTS idx_mails_is_starred ON mails(is_starred);
CREATE INDEX IF NOT EXISTS idx_mails_thread_id ON mails(thread_id);
CREATE INDEX IF NOT EXISTS idx_mails_reply_to ON mails(reply_to_mail_id);
CREATE INDEX IF NOT EXISTS idx_mail_labels_user_id ON mail_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_attachments_mail_id ON mail_attachments(mail_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
