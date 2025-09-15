-- Clean setup for system_settings table
-- This script handles existing policies and creates everything from scratch

-- First, completely clean up any existing system_settings table and policies
DROP TABLE IF EXISTS system_settings CASCADE;

-- Create the table fresh
CREATE TABLE system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_description TEXT,
  setting_type TEXT CHECK (setting_type IN ('string', 'boolean', 'number', 'url')) DEFAULT 'string',
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (these are guaranteed to be new since we dropped the table)
CREATE POLICY "Admin can view system settings" ON system_settings
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admin can insert system settings" ON system_settings
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admin can update system settings" ON system_settings
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Admin can delete system settings" ON system_settings
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND approval_status = 'approved'
        )
    );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON system_settings TO authenticated;

-- Create the update function
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- Insert the default webhook setting
INSERT INTO system_settings (setting_key, setting_value, setting_description, setting_type, created_by, updated_by)
VALUES (
    'webhook_url',
    '',
    'Webhook URL for ticket notifications',
    'url',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- Verify everything worked
SELECT 'system_settings table created successfully' as status;
SELECT COUNT(*) as total_settings FROM system_settings;
SELECT setting_key, setting_value FROM system_settings WHERE setting_key = 'webhook_url';
