-- Fix material names to match the application constants (with accents)
UPDATE analysis_records 
SET material = 'farinha de vísceras' 
WHERE material = 'farinha de visceras';

-- Ensure all other materials are normalized just in case
UPDATE analysis_records SET material = 'farinha de peixe' WHERE material ILIKE 'farinha de peixe';
UPDATE analysis_records SET material = 'farinha de pena e sangue' WHERE material ILIKE 'farinha de pena%' OR material ILIKE 'farinha de penas%';
UPDATE analysis_records SET material = 'farinha de sangue' WHERE material ILIKE 'farinha de sangue';
UPDATE analysis_records SET material = 'sebo' WHERE material ILIKE 'sebo';
UPDATE analysis_records SET material = 'farinha de carne e osso' WHERE material = 'FCO' OR material ILIKE 'farinha de carne%';

-- Insert missing materials for existing companies if they don't exist yet (using the accented version)
DO $$
DECLARE
    r_company RECORD;
    t_material TEXT;
    materials TEXT[] := ARRAY[
        'farinha de peixe',
        'farinha de pena e sangue',
        'farinha de sangue',
        'sebo',
        'farinha de carne e osso',
        'farinha de vísceras'
    ];
BEGIN
    FOR r_company IN SELECT id FROM companies LOOP
        FOREACH t_material IN ARRAY materials LOOP
            -- Check if record exists for this company and material
            IF NOT EXISTS (
                SELECT 1 FROM analysis_records 
                WHERE company_id = r_company.id AND material = t_material
            ) THEN
                -- Insert a placeholder record for the material
                INSERT INTO analysis_records (company_id, material, date, created_at, updated_at)
                VALUES (r_company.id, t_material, CURRENT_DATE, NOW(), NOW());
            END IF;
        END LOOP;
    END LOOP;
END $$;
