-- Enable RLS on analysis_records table to be sure
ALTER TABLE "public"."analysis_records" ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting or broad policies for authenticated users to ensure a clean slate
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."analysis_records";
DROP POLICY IF EXISTS "Allow authenticated insert" ON "public"."analysis_records";
DROP POLICY IF EXISTS "Allow authenticated update" ON "public"."analysis_records";
DROP POLICY IF EXISTS "Allow authenticated delete" ON "public"."analysis_records";
DROP POLICY IF EXISTS "Allow authenticated select" ON "public"."analysis_records";

-- Explicitly allow authenticated users to INSERT records
-- This allows any company_id, as we don't have a user-company mapping table yet
CREATE POLICY "Allow authenticated insert"
ON "public"."analysis_records"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Explicitly allow authenticated users to UPDATE records
-- Required for the bulk upsert (ON CONFLICT DO UPDATE) operation
CREATE POLICY "Allow authenticated update"
ON "public"."analysis_records"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Explicitly allow authenticated users to DELETE records
-- Useful for managing data they imported
CREATE POLICY "Allow authenticated delete"
ON "public"."analysis_records"
FOR DELETE
TO authenticated
USING (true);

-- Explicitly allow authenticated users to SELECT records
-- Ensures they can see what they are importing/updating
CREATE POLICY "Allow authenticated select"
ON "public"."analysis_records"
FOR SELECT
TO authenticated
USING (true);
