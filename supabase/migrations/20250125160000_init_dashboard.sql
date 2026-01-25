CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE analysis_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Metrics (LAB and NIR)
  acidity_lab FLOAT DEFAULT 0,
  acidity_nir FLOAT DEFAULT 0,
  moisture_lab FLOAT DEFAULT 0,
  moisture_nir FLOAT DEFAULT 0,
  fco_lab FLOAT DEFAULT 0,
  fco_nir FLOAT DEFAULT 0,
  protein_lab FLOAT DEFAULT 0,
  protein_nir FLOAT DEFAULT 0,
  phosphorus_lab FLOAT DEFAULT 0,
  phosphorus_nir FLOAT DEFAULT 0,
  mineral_matter_lab FLOAT DEFAULT 0,
  mineral_matter_nir FLOAT DEFAULT 0,
  peroxide_lab FLOAT DEFAULT 0,
  peroxide_nir FLOAT DEFAULT 0,
  ether_extract_lab FLOAT DEFAULT 0,
  ether_extract_nir FLOAT DEFAULT 0,
  protein_digestibility_lab FLOAT DEFAULT 0,
  protein_digestibility_nir FLOAT DEFAULT 0,
  calcium_lab FLOAT DEFAULT 0,
  calcium_nir FLOAT DEFAULT 0
);

-- Indexes
CREATE INDEX idx_analysis_records_company_id ON analysis_records(company_id);
CREATE INDEX idx_analysis_records_date ON analysis_records(date);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_records ENABLE ROW LEVEL SECURITY;

-- Policies (Public access for simplicity in this migration context, but Auth is implemented)
CREATE POLICY "Enable read access for authenticated users" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON companies FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON analysis_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Data
INSERT INTO companies (name) VALUES 
('Brasmix'),
('Mar Reciclagem'),
('Farinorte'),
('Juina'),
('Nutrição'),
('Varzea')
ON CONFLICT (name) DO NOTHING;
