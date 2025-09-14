-- Fix admin_settings table policies
-- This script handles existing policies gracefully

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage settings" ON admin_settings;
DROP POLICY IF EXISTS "Admin can view settings" ON admin_settings;

-- Create the admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Admin can view settings" ON admin_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can manage settings" ON admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Insert default webhook URL if it doesn't exist
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES (
    'webhook_url', 
    '', 
    'Webhook URL for sending ticket notifications'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
