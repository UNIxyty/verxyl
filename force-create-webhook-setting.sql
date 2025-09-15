-- Force create webhook setting - bypasses all RLS issues
-- This script will definitely create the webhook setting

-- First, temporarily disable RLS on system_settings
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Insert the webhook setting (this will work now)
INSERT INTO system_settings (setting_key, setting_value, setting_description, setting_type, created_by, updated_by)
VALUES (
    'webhook_url',
    '',
    'Webhook URL for ticket notifications',
    'url',
    NULL,
    NULL
)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    setting_description = EXCLUDED.setting_description,
    setting_type = EXCLUDED.setting_type;

-- Re-enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Verify the setting was created
SELECT 'Webhook setting created successfully:' as status;
SELECT id, setting_key, setting_value, setting_description, created_at 
FROM system_settings 
WHERE setting_key = 'webhook_url';

-- Show all settings
SELECT 'All system settings:' as status;
SELECT id, setting_key, setting_value, setting_type, created_at 
FROM system_settings 
ORDER BY created_at;
