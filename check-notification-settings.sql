-- Check if notification_settings table exists and has data
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_settings' 
ORDER BY ordinal_position;

-- Check if there are any records in notification_settings
SELECT COUNT(*) as total_records FROM notification_settings;

-- Check sample records
SELECT * FROM notification_settings LIMIT 5;
