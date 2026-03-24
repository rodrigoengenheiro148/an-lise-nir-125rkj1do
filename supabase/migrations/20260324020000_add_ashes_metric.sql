ALTER TABLE public.analysis_records 
ADD COLUMN IF NOT EXISTS ashes_lab double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS ashes_nir double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS ashes_anl numeric;

CREATE OR REPLACE FUNCTION public.bulk_upsert_analysis_records(records jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    record JSONB;
    rec_id UUID;
    rec_company_id UUID;
    rec_date DATE;
    rec_material TEXT;
    rec_submaterial TEXT;
BEGIN
    FOR record IN SELECT * FROM jsonb_array_elements(records)
    LOOP
        rec_id := (record->>'id')::UUID;
        rec_company_id := (record->>'company_id')::UUID;
        rec_date := (record->>'date')::DATE;
        rec_material := record->>'material';
        
        -- Handle both possible keys for submaterial from JSON and normalize
        rec_submaterial := record->>'sub_material';
        IF rec_submaterial IS NULL THEN
            rec_submaterial := record->>'submaterial';
        END IF;
        
        IF rec_id IS NOT NULL THEN
            INSERT INTO analysis_records (
                id, company_id, date, material, sub_material, submaterial, created_at, updated_at,
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
                impurity_lab, impurity_nir, impurity_anl,
                fat_lab, fat_nir, fat_anl,
                ashes_lab, ashes_nir, ashes_anl
            ) VALUES (
                rec_id, rec_company_id, rec_date, rec_material, rec_submaterial, rec_submaterial, NOW(), NOW(),
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
                (record->>'impurity_lab')::NUMERIC, (record->>'impurity_nir')::NUMERIC, (record->>'impurity_anl')::NUMERIC,
                (record->>'fat_lab')::NUMERIC, (record->>'fat_nir')::NUMERIC, (record->>'fat_anl')::NUMERIC,
                (record->>'ashes_lab')::NUMERIC, (record->>'ashes_nir')::NUMERIC, (record->>'ashes_anl')::NUMERIC
            )
            ON CONFLICT (id) DO UPDATE
            SET
                company_id = EXCLUDED.company_id,
                date = EXCLUDED.date,
                material = EXCLUDED.material,
                sub_material = EXCLUDED.sub_material,
                submaterial = EXCLUDED.submaterial,
                updated_at = NOW(),
                
                acidity_lab = COALESCE(EXCLUDED.acidity_lab, analysis_records.acidity_lab),
                acidity_nir = COALESCE(EXCLUDED.acidity_nir, analysis_records.acidity_nir),
                acidity_anl = COALESCE(EXCLUDED.acidity_anl, analysis_records.acidity_anl),
                
                moisture_lab = COALESCE(EXCLUDED.moisture_lab, analysis_records.moisture_lab),
                moisture_nir = COALESCE(EXCLUDED.moisture_nir, analysis_records.moisture_nir),
                moisture_anl = COALESCE(EXCLUDED.moisture_anl, analysis_records.moisture_anl),
                
                fco_lab = COALESCE(EXCLUDED.fco_lab, analysis_records.fco_lab),
                fco_nir = COALESCE(EXCLUDED.fco_nir, analysis_records.fco_nir),
                fco_anl = COALESCE(EXCLUDED.fco_anl, analysis_records.fco_anl),
                
                protein_lab = COALESCE(EXCLUDED.protein_lab, analysis_records.protein_lab),
                protein_nir = COALESCE(EXCLUDED.protein_nir, analysis_records.protein_nir),
                protein_anl = COALESCE(EXCLUDED.protein_anl, analysis_records.protein_anl),
                
                phosphorus_lab = COALESCE(EXCLUDED.phosphorus_lab, analysis_records.phosphorus_lab),
                phosphorus_nir = COALESCE(EXCLUDED.phosphorus_nir, analysis_records.phosphorus_nir),
                phosphorus_anl = COALESCE(EXCLUDED.phosphorus_anl, analysis_records.phosphorus_anl),
                
                mineral_matter_lab = COALESCE(EXCLUDED.mineral_matter_lab, analysis_records.mineral_matter_lab),
                mineral_matter_nir = COALESCE(EXCLUDED.mineral_matter_nir, analysis_records.mineral_matter_nir),
                mineral_matter_anl = COALESCE(EXCLUDED.mineral_matter_anl, analysis_records.mineral_matter_anl),
                
                peroxide_lab = COALESCE(EXCLUDED.peroxide_lab, analysis_records.peroxide_lab),
                peroxide_nir = COALESCE(EXCLUDED.peroxide_nir, analysis_records.peroxide_nir),
                peroxide_anl = COALESCE(EXCLUDED.peroxide_anl, analysis_records.peroxide_anl),
                
                ether_extract_lab = COALESCE(EXCLUDED.ether_extract_lab, analysis_records.ether_extract_lab),
                ether_extract_nir = COALESCE(EXCLUDED.ether_extract_nir, analysis_records.ether_extract_nir),
                ether_extract_anl = COALESCE(EXCLUDED.ether_extract_anl, analysis_records.ether_extract_anl),
                
                protein_digestibility_lab = COALESCE(EXCLUDED.protein_digestibility_lab, analysis_records.protein_digestibility_lab),
                protein_digestibility_nir = COALESCE(EXCLUDED.protein_digestibility_nir, analysis_records.protein_digestibility_nir),
                protein_digestibility_anl = COALESCE(EXCLUDED.protein_digestibility_anl, analysis_records.protein_digestibility_anl),
                
                calcium_lab = COALESCE(EXCLUDED.calcium_lab, analysis_records.calcium_lab),
                calcium_nir = COALESCE(EXCLUDED.calcium_nir, analysis_records.calcium_nir),
                calcium_anl = COALESCE(EXCLUDED.calcium_anl, analysis_records.calcium_anl),
                
                sodium_lab = COALESCE(EXCLUDED.sodium_lab, analysis_records.sodium_lab),
                sodium_nir = COALESCE(EXCLUDED.sodium_nir, analysis_records.sodium_nir),
                sodium_anl = COALESCE(EXCLUDED.sodium_anl, analysis_records.sodium_anl),
                
                iodine_lab = COALESCE(EXCLUDED.iodine_lab, analysis_records.iodine_lab),
                iodine_nir = COALESCE(EXCLUDED.iodine_nir, analysis_records.iodine_nir),
                iodine_anl = COALESCE(EXCLUDED.iodine_anl, analysis_records.iodine_anl),
                
                impurity_lab = COALESCE(EXCLUDED.impurity_lab, analysis_records.impurity_lab),
                impurity_nir = COALESCE(EXCLUDED.impurity_nir, analysis_records.impurity_nir),
                impurity_anl = COALESCE(EXCLUDED.impurity_anl, analysis_records.impurity_anl),
                
                fat_lab = COALESCE(EXCLUDED.fat_lab, analysis_records.fat_lab),
                fat_nir = COALESCE(EXCLUDED.fat_nir, analysis_records.fat_nir),
                fat_anl = COALESCE(EXCLUDED.fat_anl, analysis_records.fat_anl),

                ashes_lab = COALESCE(EXCLUDED.ashes_lab, analysis_records.ashes_lab),
                ashes_nir = COALESCE(EXCLUDED.ashes_nir, analysis_records.ashes_nir),
                ashes_anl = COALESCE(EXCLUDED.ashes_anl, analysis_records.ashes_anl);
        ELSE
            -- No ID provided, force INSERT
             INSERT INTO analysis_records (
                company_id, date, material, sub_material, submaterial, created_at, updated_at,
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
                impurity_lab, impurity_nir, impurity_anl,
                fat_lab, fat_nir, fat_anl,
                ashes_lab, ashes_nir, ashes_anl
            ) VALUES (
                rec_company_id, rec_date, rec_material, rec_submaterial, rec_submaterial, NOW(), NOW(),
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
                (record->>'impurity_lab')::NUMERIC, (record->>'impurity_nir')::NUMERIC, (record->>'impurity_anl')::NUMERIC,
                (record->>'fat_lab')::NUMERIC, (record->>'fat_nir')::NUMERIC, (record->>'fat_anl')::NUMERIC,
                (record->>'ashes_lab')::NUMERIC, (record->>'ashes_nir')::NUMERIC, (record->>'ashes_anl')::NUMERIC
            );
        END IF;
    END LOOP;
END;
$function$;
