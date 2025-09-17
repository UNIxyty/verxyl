-- Add notification preference columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS new_ticket BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_ticket BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS in_work_ticket BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_ticket BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS solved_ticket BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS shared_workflow BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS shared_prompt BOOLEAN DEFAULT true;

-- Update existing users with default values
UPDATE public.users 
SET 
    new_ticket = COALESCE(new_ticket, true),
    deleted_ticket = COALESCE(deleted_ticket, true),
    in_work_ticket = COALESCE(in_work_ticket, true),
    updated_ticket = COALESCE(updated_ticket, true),
    solved_ticket = COALESCE(solved_ticket, true),
    shared_workflow = COALESCE(shared_workflow, true),
    shared_prompt = COALESCE(shared_prompt, true)
WHERE 
    new_ticket IS NULL OR 
    deleted_ticket IS NULL OR 
    in_work_ticket IS NULL OR 
    updated_ticket IS NULL OR 
    solved_ticket IS NULL OR 
    shared_workflow IS NULL OR 
    shared_prompt IS NULL;
