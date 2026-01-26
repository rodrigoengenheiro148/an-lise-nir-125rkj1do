-- Enable Realtime for analysis_records and companies tables
BEGIN;
  -- Add tables to the supabase_realtime publication
  -- This allows the client to subscribe to changes on these tables
  ALTER PUBLICATION supabase_realtime ADD TABLE analysis_records;
  ALTER PUBLICATION supabase_realtime ADD TABLE companies;
COMMIT;
