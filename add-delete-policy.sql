-- Add DELETE policy for tickets table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete tickets they created' AND tablename = 'tickets') THEN
        CREATE POLICY "Users can delete tickets they created" ON tickets FOR DELETE USING (auth.uid() = created_by);
    END IF;
END $$;
