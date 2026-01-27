ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS iodine_lab numeric;
ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS iodine_nir numeric;
ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS iodine_anl numeric;

ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS impurity_lab numeric;
ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS impurity_nir numeric;
ALTER TABLE public.analysis_records ADD COLUMN IF NOT EXISTS impurity_anl numeric;
