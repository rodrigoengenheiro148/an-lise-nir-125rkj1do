CREATE OR REPLACE FUNCTION bulk_upsert_analysis_records(records JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    record JSONB;
    rec_company_id UUID;
    rec_date DATE;
    rec_material TEXT;
    rec_submaterial TEXT;
    existing_id UUID;
BEGIN
    FOR record IN SELECT * FROM jsonb_array_elements(records)
    LOOP
        rec_company_id := (record->>'company_id')::UUID;
        rec_date := (record->>'date')::DATE;
        rec_material := record->>'material';
        rec_submaterial := record->>'sub_material';
        
        -- Try to find existing record
        -- matching company, date, material and submaterial (handling nulls)
        SELECT id INTO existing_id
        FROM analysis_records
        WHERE company_id = rec_company_id
          AND date = rec_date
          AND material = rec_material
          AND (sub_material IS NOT DISTINCT FROM rec_submaterial);
          
        IF existing_id IS NOT NULL THEN
            -- Update existing record
            UPDATE analysis_records
            SET
                acidity_lab = COALESCE((record->>'acidity_lab')::NUMERIC, acidity_lab),
                acidity_nir = COALESCE((record->>'acidity_nir')::NUMERIC, acidity_nir),
                acidity_anl = COALESCE((record->>'acidity_anl')::NUMERIC, acidity_anl),
                
                moisture_lab = COALESCE((record->>'moisture_lab')::NUMERIC, moisture_lab),
                moisture_nir = COALESCE((record->>'moisture_nir')::NUMERIC, moisture_nir),
                moisture_anl = COALESCE((record->>'moisture_anl')::NUMERIC, moisture_anl),
                
                fco_lab = COALESCE((record->>'fco_lab')::NUMERIC, fco_lab),
                fco_nir = COALESCE((record->>'fco_nir')::NUMERIC, fco_nir),
                fco_anl = COALESCE((record->>'fco_anl')::NUMERIC, fco_anl),
                
                protein_lab = COALESCE((record->>'protein_lab')::NUMERIC, protein_lab),
                protein_nir = COALESCE((record->>'protein_nir')::NUMERIC, protein_nir),
                protein_anl = COALESCE((record->>'protein_anl')::NUMERIC, protein_anl),
                
                phosphorus_lab = COALESCE((record->>'phosphorus_lab')::NUMERIC, phosphorus_lab),
                phosphorus_nir = COALESCE((record->>'phosphorus_nir')::NUMERIC, phosphorus_nir),
                phosphorus_anl = COALESCE((record->>'phosphorus_anl')::NUMERIC, phosphorus_anl),
                
                mineral_matter_lab = COALESCE((record->>'mineral_matter_lab')::NUMERIC, mineral_matter_lab),
                mineral_matter_nir = COALESCE((record->>'mineral_matter_nir')::NUMERIC, mineral_matter_nir),
                mineral_matter_anl = COALESCE((record->>'mineral_matter_anl')::NUMERIC, mineral_matter_anl),
                
                peroxide_lab = COALESCE((record->>'peroxide_lab')::NUMERIC, peroxide_lab),
                peroxide_nir = COALESCE((record->>'peroxide_nir')::NUMERIC, peroxide_nir),
                peroxide_anl = COALESCE((record->>'peroxide_anl')::NUMERIC, peroxide_anl),
                
                ether_extract_lab = COALESCE((record->>'ether_extract_lab')::NUMERIC, ether_extract_lab),
                ether_extract_nir = COALESCE((record->>'ether_extract_nir')::NUMERIC, ether_extract_nir),
                ether_extract_anl = COALESCE((record->>'ether_extract_anl')::NUMERIC, ether_extract_anl),
                
                protein_digestibility_lab = COALESCE((record->>'protein_digestibility_lab')::NUMERIC, protein_digestibility_lab),
                protein_digestibility_nir = COALESCE((record->>'protein_digestibility_nir')::NUMERIC, protein_digestibility_nir),
                protein_digestibility_anl = COALESCE((record->>'protein_digestibility_anl')::NUMERIC, protein_digestibility_anl),
                
                calcium_lab = COALESCE((record->>'calcium_lab')::NUMERIC, calcium_lab),
                calcium_nir = COALESCE((record->>'calcium_nir')::NUMERIC, calcium_nir),
                calcium_anl = COALESCE((record->>'calcium_anl')::NUMERIC, calcium_anl),
                
                sodium_lab = COALESCE((record->>'sodium_lab')::NUMERIC, sodium_lab),
                sodium_nir = COALESCE((record->>'sodium_nir')::NUMERIC, sodium_nir),
                sodium_anl = COALESCE((record->>'sodium_anl')::NUMERIC, sodium_anl),
                
                iodine_lab = COALESCE((record->>'iodine_lab')::NUMERIC, iodine_lab),
                iodine_nir = COALESCE((record->>'iodine_nir')::NUMERIC, iodine_nir),
                iodine_anl = COALESCE((record->>'iodine_anl')::NUMERIC, iodine_anl),
                
                impurity_lab = COALESCE((record->>'impurity_lab')::NUMERIC, impurity_lab),
                impurity_nir = COALESCE((record->>'impurity_nir')::NUMERIC, impurity_nir),
                impurity_anl = COALESCE((record->>'impurity_anl')::NUMERIC, impurity_anl),
                
                updated_at = NOW()
            WHERE id = existing_id;
        ELSE
            -- Insert new record
            INSERT INTO analysis_records (
                company_id, date, material, sub_material, created_at, updated_at,
                acidity_lab, acidity_nir, acidity_anl,
                moisture_lab, moisture_nir, moisture_anl,
                fco_lab, fco_nir, fco_anl,
                protein_lab, protein_nir, protein_anl,
                phosphorus_lab, phosphorus_nir, phosphorus_anl,
                mineral_matter_lab, mineral_matter_nir, mineral_matter_anl,
                peroxide_lab, peroxide_nir, peroxide_anl,
                ether_extract_lab, ether_extract_nir, ether_extract_anl,
                protein_digestibility_lab, protein_digestibility_nir, protein_digestibility_anl,
                calcium_lab, calcium_nir, calcium_anl,
                sodium_lab, sodium_nir, sodium_anl,
                iodine_lab, iodine_nir, iodine_anl,
                impurity_lab, impurity_nir, impurity_anl
            ) VALUES (
                rec_company_id, rec_date, rec_material, rec_submaterial, NOW(), NOW(),
                (record->>'acidity_lab')::NUMERIC, (record->>'acidity_nir')::NUMERIC, (record->>'acidity_anl')::NUMERIC,
                (record->>'moisture_lab')::NUMERIC, (record->>'moisture_nir')::NUMERIC, (record->>'moisture_anl')::NUMERIC,
                (record->>'fco_lab')::NUMERIC, (record->>'fco_nir')::NUMERIC, (record->>'fco_anl')::NUMERIC,
                (record->>'protein_lab')::NUMERIC, (record->>'protein_nir')::NUMERIC, (record->>'protein_anl')::NUMERIC,
                (record->>'phosphorus_lab')::NUMERIC, (record->>'phosphorus_nir')::NUMERIC, (record->>'phosphorus_anl')::NUMERIC,
                (record->>'mineral_matter_lab')::NUMERIC, (record->>'mineral_matter_nir')::NUMERIC, (record->>'mineral_matter_anl')::NUMERIC,
                (record->>'peroxide_lab')::NUMERIC, (record->>'peroxide_nir')::NUMERIC, (record->>'peroxide_anl')::NUMERIC,
                (record->>'ether_extract_lab')::NUMERIC, (record->>'ether_extract_nir')::NUMERIC, (record->>'ether_extract_anl')::NUMERIC,
                (record->>'protein_digestibility_lab')::NUMERIC, (record->>'protein_digestibility_nir')::NUMERIC, (record->>'protein_digestibility_anl')::NUMERIC,
                (record->>'calcium_lab')::NUMERIC, (record->>'calcium_nir')::NUMERIC, (record->>'calcium_anl')::NUMERIC,
                (record->>'sodium_lab')::NUMERIC, (record->>'sodium_nir')::NUMERIC, (record->>'sodium_anl')::NUMERIC,
                (record->>'iodine_lab')::NUMERIC, (record->>'iodine_nir')::NUMERIC, (record->>'iodine_anl')::NUMERIC,
                (record->>'impurity_lab')::NUMERIC, (record->>'impurity_nir')::NUMERIC, (record->>'impurity_anl')::NUMERIC
            );
        END IF;
    END LOOP;
END;
$$;
