-- Comprehensive diagnostic script for system_settings table
-- This will tell us exactly what's wrong

-- Step 1: Check if the table exists
SELECT 'STEP 1: Table existence check' as step;
SELECT 
    schemaname, 
    tablename, 
    tableowner,
    rowsecurity,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'system_settings';

-- Step 2: Check table structure
SELECT 'STEP 2: Table structure' as step;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'system_settings' 
ORDER BY ordinal_position;

-- Step 3: Check RLS status and policies
SELECT 'STEP 3: RLS status and policies' as step;
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'system_settings';

SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'system_settings';

-- Step 4: Check permissions
SELECT 'STEP 4: Table permissions' as step;
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'system_settings';

-- Step 5: Try to insert a test record
SELECT 'STEP 5: Test insert' as step;
INSERT INTO system_settings (setting_key, setting_value, setting_description, setting_type)
VALUES ('diagnostic_test', 'test_value', 'Diagnostic test setting', 'string')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'test_value_updated';

-- Step 6: Check if the test record was inserted
SELECT 'STEP 6: Verify test insert' as step;
SELECT * FROM system_settings WHERE setting_key = 'diagnostic_test';

-- Step 7: Try to insert webhook setting
SELECT 'STEP 7: Insert webhook setting' as step;
INSERT INTO system_settings (setting_key, setting_value, setting_description, setting_type)
VALUES ('webhook_url', '', 'Webhook URL for ticket notifications', 'url')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    setting_description = EXCLUDED.setting_description;

-- Step 8: Verify webhook setting
SELECT 'STEP 8: Verify webhook setting' as step;
SELECT * FROM system_settings WHERE setting_key = 'webhook_url';

-- Step 9: Show all settings
SELECT 'STEP 9: All settings' as step;
SELECT * FROM system_settings ORDER BY created_at;

-- Step 10: Clean up test record
SELECT 'STEP 10: Cleanup' as step;
DELETE FROM system_settings WHERE setting_key = 'diagnostic_test';
SELECT 'Diagnostic test record cleaned up' as status;
