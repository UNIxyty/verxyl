-- Add enhanced webhook columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS webhook_base_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_tickets_path TEXT,
ADD COLUMN IF NOT EXISTS webhook_users_path TEXT;

-- Update existing users with default values (preserve existing webhook_url as base_url)
UPDATE public.users 
SET 
    webhook_base_url = COALESCE(webhook_base_url, webhook_url),
    webhook_tickets_path = COALESCE(webhook_tickets_path, ''),
    webhook_users_path = COALESCE(webhook_users_path, '')
WHERE 
    webhook_base_url IS NULL OR 
    webhook_tickets_path IS NULL OR 
    webhook_users_path IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.users.webhook_base_url IS 'Base URL for webhook endpoints (e.g., https://api.example.com)';
COMMENT ON COLUMN public.users.webhook_tickets_path IS 'Path for ticket webhooks (e.g., /webhooks/tickets)';
COMMENT ON COLUMN public.users.webhook_users_path IS 'Path for user webhooks (e.g., /webhooks/users)';

RAISE NOTICE '✅ Enhanced webhook columns added to users table.';
