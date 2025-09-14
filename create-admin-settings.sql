-- Create admin settings table for webhook configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default webhook URL setting
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES ('webhook_url', '')
ON CONFLICT (setting_key) DO NOTHING;

-- Grant permissions
GRANT ALL ON admin_settings TO authenticated;
GRANT ALL ON admin_settings TO anon;

-- Enable RLS (optional, for security)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage settings
CREATE POLICY "Admin can manage settings" ON admin_settings
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::uuid = auth.uid() 
      AND users.role = 'admin'
    )
  );
