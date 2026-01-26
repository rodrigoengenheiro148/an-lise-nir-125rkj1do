-- Normalize material names to match the acceptance criteria (no accents for visceras)
UPDATE analysis_records 
SET material = 'farinha de visceras' 
WHERE material = 'farinha de vísceras';

-- Ensure consistency for other variations just in case
UPDATE analysis_records SET material = 'farinha de peixe' WHERE material ILIKE 'farinha de peixe';
UPDATE analysis_records SET material = 'farinha de pena e sangue' WHERE material ILIKE 'farinha de pena%' OR material ILIKE 'farinha de penas%';
UPDATE analysis_records SET material = 'farinha de sangue' WHERE material ILIKE 'farinha de sangue';
UPDATE analysis_records SET material = 'sebo' WHERE material ILIKE 'sebo';
UPDATE analysis_records SET material = 'farinha de carne e osso' WHERE material = 'FCO' OR material ILIKE 'farinha de carne%';
