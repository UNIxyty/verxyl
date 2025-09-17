-- Ensure webhook settings exist in the database
-- This script will create the webhook settings if they don't exist

-- Insert webhook domain if it doesn't exist
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
SELECT 'webhook_domain', 'https://n8n.fluntstudios.com', 'Base domain for webhook URLs', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'webhook_domain'
);

-- Insert webhook path for tickets if it doesn't exist
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
SELECT 'webhook_path_tickets', '/webhook/tickets', 'Path for ticket-related webhooks', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'webhook_path_tickets'
);

-- Insert webhook path for users if it doesn't exist
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
SELECT 'webhook_path_users', '/webhook/users', 'Path for user-related webhooks', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'webhook_path_users'
);

-- Insert webhook path for mails if it doesn't exist
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
SELECT 'webhook_path_mails', '/webhook/mails', 'Path for mail-related webhooks', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'webhook_path_mails'
);

-- Insert webhook path for projects if it doesn't exist
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
SELECT 'webhook_path_projects', '/webhook/projects', 'Path for project-related webhooks', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'webhook_path_projects'
);

-- Insert webhook path for invoices if it doesn't exist
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
SELECT 'webhook_path_invoices', '/webhook/invoices', 'Path for invoice-related webhooks', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'webhook_path_invoices'
);

-- Insert webhook path for notifications if it doesn't exist
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
SELECT 'webhook_path_notifications', '/webhook/notifications', 'Path for notification-related webhooks', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings WHERE setting_key = 'webhook_path_notifications'
);

-- Show the created/updated webhook settings
SELECT 
    setting_key,
    setting_value,
    description,
    created_at,
    updated_at
FROM system_settings 
WHERE setting_key LIKE 'webhook_%'
ORDER BY setting_key;
