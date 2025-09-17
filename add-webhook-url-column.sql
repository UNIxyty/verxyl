-- Add webhook_url column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Update existing users with default values
UPDATE public.users 
SET webhook_url = NULL 
WHERE webhook_url IS NULL;

-- Add comment to the column
COMMENT ON COLUMN public.users.webhook_url IS 'Webhook URL for receiving ticket notifications';
