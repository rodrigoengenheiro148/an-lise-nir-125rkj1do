DO $$
BEGIN
  -- Check if analysis_records is already in supabase_realtime publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'analysis_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE analysis_records;
  END IF;

  -- Check if companies is already in supabase_realtime publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'companies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE companies;
  END IF;
END
$$;
