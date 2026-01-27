-- Add owner_id to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
DROP POLICY IF EXISTS "Users can select their own companies" ON public.companies;
CREATE POLICY "Users can select their own companies" 
ON public.companies 
FOR SELECT 
TO authenticated 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies;
CREATE POLICY "Users can insert their own companies" 
ON public.companies 
FOR INSERT 
TO authenticated 
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
CREATE POLICY "Users can update their own companies" 
ON public.companies 
FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;
CREATE POLICY "Users can delete their own companies" 
ON public.companies 
FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid());

-- Update policies for analysis_records to respect company ownership
DROP POLICY IF EXISTS "Users can select records of their companies" ON public.analysis_records;
CREATE POLICY "Users can select records of their companies" 
ON public.analysis_records 
FOR SELECT 
TO authenticated 
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert records to their companies" ON public.analysis_records;
CREATE POLICY "Users can insert records to their companies" 
ON public.analysis_records 
FOR INSERT 
TO authenticated 
WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update records of their companies" ON public.analysis_records;
CREATE POLICY "Users can update records of their companies" 
ON public.analysis_records 
FOR UPDATE 
TO authenticated 
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete records of their companies" ON public.analysis_records;
CREATE POLICY "Users can delete records of their companies" 
ON public.analysis_records 
FOR DELETE 
TO authenticated 
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- Create function to handle new user signup and create company automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.companies (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'), 
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
