-- Create system_settings table for storing system configuration
-- This replaces environment variable usage for webhook configuration

CREATE TABLE IF NOT EXISTS system_settings (
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

-- Enable RLS on system_settings table
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system_settings (admin only)
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

-- Insert default webhook setting (if it doesn't exist)
INSERT INTO system_settings (setting_key, setting_value, setting_description, setting_type, created_by, updated_by)
SELECT 
    'webhook_url',
    COALESCE(current_setting('app.webhook_url', true), ''),
    'Webhook URL for ticket notifications',
    'url',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'webhook_url'
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- Verify table creation
SELECT 'system_settings table created successfully' as status;
SELECT COUNT(*) as total_settings FROM system_settings;
