// scripts/create-table.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iminfvuzejrpmqxpvtmk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltaW5mdnV6ZWpycG1xeHB2dG1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgwNjQ5MSwiZXhwIjoyMDkzMzgyNDkxfQ.fpyKGnqfhBcgFkEXA_cZPG1vXro5LHC19KEUuQqEu7I'
);

// Test the connection by trying to access the numbers table
// If it doesn't exist, we'll know from the error
async function checkAndReport() {
  console.log('Testing Supabase connection...');

  const { data, error } = await supabase.from('numbers').select('count').limit(1);

  if (error && error.code === '42P01') {
    console.log('Table does not exist yet. Please run this SQL in Supabase SQL Editor:');
    console.log('');
    console.log(`CREATE TABLE IF NOT EXISTS numbers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  number text NOT NULL,
  country text DEFAULT 'GH',
  source_url text DEFAULT '',
  source_label text DEFAULT '',
  session_id text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all anonymous access"
  ON numbers FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_numbers_session_id ON numbers(session_id);
CREATE INDEX IF NOT EXISTS idx_numbers_ts ON numbers(timestamp DESC);`);
  } else if (error) {
    console.error('Connection error:', error.message);
  } else {
    console.log('SUCCESS: Supabase connected and numbers table exists!');
    console.log('Row count data:', data);
  }
}

checkAndReport();
