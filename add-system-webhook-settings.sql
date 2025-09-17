-- Add system-wide webhook settings to system_settings table
-- This allows all admins to share the same webhook URLs

INSERT INTO public.system_settings (setting_key, setting_value, setting_description, setting_type, created_by, updated_by, created_at, updated_at)
VALUES 
  ('webhook_base_url', '', 'Base URL for all webhooks (e.g., https://your-domain.com)', 'string', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW(), NOW()),
  ('webhook_tickets_path', '', 'Path for ticket-related webhooks (e.g., /webhook/tickets)', 'string', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW(), NOW()),
  ('webhook_users_path', '', 'Path for user-related webhooks (e.g., /webhook/users)', 'string', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Add webhook timeout setting if it doesn't exist
INSERT INTO public.system_settings (setting_key, setting_value, setting_description, setting_type, created_by, updated_by, created_at, updated_at)
VALUES 
  ('webhook_timeout', '30', 'Timeout for webhook requests in seconds', 'number', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

RAISE NOTICE '✅ System-wide webhook settings added successfully.';
