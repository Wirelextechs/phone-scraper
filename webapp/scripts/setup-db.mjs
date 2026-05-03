// scripts/setup-db.mjs — Run once to create the numbers table
// Usage: node scripts/setup-db.mjs

const SUPABASE_URL = 'https://iminfvuzejrpmqxpvtmk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltaW5mdnV6ZWpycG1xeHB2dG1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgwNjQ5MSwiZXhwIjoyMDkzMzgyNDkxfQ.fpyKGnqfhBcgFkEXA_cZPG1vXro5LHC19KEUuQqEu7I';

const sql = `
  CREATE TABLE IF NOT EXISTS numbers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    number text NOT NULL,
    country text DEFAULT 'GH',
    source_url text DEFAULT '',
    source_label text DEFAULT '',
    session_id text NOT NULL,
    timestamp timestamptz DEFAULT now()
  );

  ALTER TABLE numbers ENABLE ROW LEVEL SECURITY;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'numbers' AND policyname = 'Allow all anonymous access'
    ) THEN
      CREATE POLICY "Allow all anonymous access" ON numbers FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS idx_numbers_session_id ON numbers(session_id);
  CREATE INDEX IF NOT EXISTS idx_numbers_timestamp ON numbers(timestamp DESC);
`;

async function setup() {
  console.log('🔧 Setting up Supabase database...');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    // Try alternative: use the pg SQL endpoint
    const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    const text = await res2.text();
    console.log('Response:', text);
    
    if (!res2.ok) {
      console.error('❌ Could not run SQL automatically.');
      console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
      console.log(sql);
      return;
    }
  }

  console.log('✅ Database setup complete!');
  console.log('✅ numbers table created with RLS policy');
  console.log('✅ Indexes created for session_id and timestamp');
}

setup().catch(console.error);
