-- Enable Row Level Security (if not already enabled, though usually good practice to be explicit)
ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."analysis_records" ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to read companies data
CREATE POLICY "Allow public read access on companies"
ON "public"."companies"
FOR SELECT
TO public
USING (true);

-- Allow anonymous and authenticated users to read analysis records
CREATE POLICY "Allow public read access on analysis_records"
ON "public"."analysis_records"
FOR SELECT
TO public
USING (true);
