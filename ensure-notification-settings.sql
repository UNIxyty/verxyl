-- Ensure all users have notification settings
-- This script will create default notification settings for users who don't have them

INSERT INTO notification_settings (user_id, "newTicket", deleted_ticket, in_work_ticket, "updatetTicket", "solvedTicket", "sharedWorkflow", "sharedPrompt")
SELECT 
    u.id,
    true,  -- newTicket
    true,  -- deleted_ticket
    true,  -- in_work_ticket
    true,  -- updatetTicket
    true,  -- solvedTicket
    true,  -- sharedWorkflow
    true   -- sharedPrompt
FROM users u
LEFT JOIN notification_settings ns ON u.id = ns.user_id
WHERE ns.user_id IS NULL;

-- Show how many users now have notification settings
SELECT 
    COUNT(*) as total_users,
    (SELECT COUNT(*) FROM notification_settings) as users_with_settings
FROM users;
