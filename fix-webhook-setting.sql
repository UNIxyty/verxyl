-- Fix webhook setting in system_settings table
-- This script ensures the webhook_url setting exists

-- First, check if the setting exists
SELECT 'Current webhook settings:' as status;
SELECT id, setting_key, setting_value, created_at FROM system_settings WHERE setting_key = 'webhook_url';

-- Insert webhook setting if it doesn't exist
INSERT INTO system_settings (setting_key, setting_value, setting_description, setting_type)
SELECT 
    'webhook_url',
    '',
    'Webhook URL for ticket notifications',
    'url'
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'webhook_url'
);

-- Update created_by and updated_by if they are null
UPDATE system_settings 
SET 
    created_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    updated_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE setting_key = 'webhook_url' 
AND (created_by IS NULL OR updated_by IS NULL);

-- Verify the setting was created/updated
SELECT 'Webhook setting status after fix:' as status;
SELECT id, setting_key, setting_value, created_by, updated_by, created_at FROM system_settings WHERE setting_key = 'webhook_url';

-- Show all settings in the table
SELECT 'All system settings:' as status;
SELECT id, setting_key, setting_value, setting_type, created_at FROM system_settings ORDER BY created_at;
