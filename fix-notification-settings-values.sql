-- Fix notification settings values to ensure consistency
-- This script will update the camelCase columns to match the snake_case values

-- Update newTicket to match new_ticket
UPDATE notification_settings 
SET "newTicket" = new_ticket 
WHERE "newTicket" != new_ticket;

-- Update updatetTicket to match updated_ticket  
UPDATE notification_settings 
SET "updatetTicket" = updated_ticket 
WHERE "updatetTicket" != updated_ticket;

-- Update solvedTicket to match solved_ticket
UPDATE notification_settings 
SET "solvedTicket" = solved_ticket 
WHERE "solvedTicket" != solved_ticket;

-- Update sharedWorkflow to match shared_n8n_workflow
UPDATE notification_settings 
SET "sharedWorkflow" = shared_n8n_workflow 
WHERE "sharedWorkflow" != shared_n8n_workflow;

-- Update sharedPrompt to match shared_ai_backup
UPDATE notification_settings 
SET "sharedPrompt" = shared_ai_backup 
WHERE "sharedPrompt" != shared_ai_backup;

-- Show the updated values
SELECT 
    user_id,
    new_ticket,
    "newTicket",
    updated_ticket,
    "updatetTicket", 
    solved_ticket,
    "solvedTicket",
    shared_n8n_workflow,
    "sharedWorkflow",
    shared_ai_backup,
    "sharedPrompt"
FROM notification_settings;
