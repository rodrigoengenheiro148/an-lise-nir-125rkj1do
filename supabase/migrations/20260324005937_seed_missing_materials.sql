DO $
DECLARE
    r_company RECORD;
    t_material TEXT;
    materials TEXT[] := ARRAY[
        'gordura',
        'cinzas'
    ];
BEGIN
    FOR r_company IN SELECT id FROM companies LOOP
        FOREACH t_material IN ARRAY materials LOOP
            -- Check if record exists for this company and material
            IF NOT EXISTS (
                SELECT 1 FROM analysis_records 
                WHERE company_id = r_company.id AND material = t_material
            ) THEN
                -- Insert a placeholder record for the material to ensure it appears in dynamic lists
                INSERT INTO analysis_records (company_id, material, date, created_at, updated_at)
                VALUES (r_company.id, t_material, CURRENT_DATE, NOW(), NOW());
            END IF;
        END LOOP;
    END LOOP;
END $;
