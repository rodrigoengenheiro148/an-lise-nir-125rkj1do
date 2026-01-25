ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS sodium_lab numeric;
ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS sodium_nir numeric;
ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS sodium_anl numeric;
