ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS sub_material TEXT;

-- Migrate existing data from submaterial to sub_material if needed
UPDATE public.analysis_records 
SET sub_material = submaterial 
WHERE sub_material IS NULL AND submaterial IS NOT NULL;
