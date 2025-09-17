-- Check what webhook settings exist in the database
SELECT 
    setting_key,
    setting_value,
    created_at,
    updated_at
FROM system_settings 
WHERE setting_key LIKE 'webhook_%'
ORDER BY setting_key;

-- Check if the table exists and has data
SELECT 
    COUNT(*) as total_settings,
    COUNT(CASE WHEN setting_key LIKE 'webhook_%' THEN 1 END) as webhook_settings
FROM system_settings;
