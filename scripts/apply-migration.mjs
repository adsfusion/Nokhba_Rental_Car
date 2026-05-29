/**
 * apply-migration.mjs
 * Applies the Phase 1 billing migration directly to Supabase
 * using the Management REST API via service-role auth.
 * Run with: node scripts/apply-migration.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const [k, ...v] = l.split('=');
      return [k.trim(), v.join('=').trim().replace(/^"|"$/g, '')];
    })
);

const SUPABASE_URL         = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY     = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// SQL statements broken into individual safe steps
const statements = [
  // 1. Create enum (idempotent via DO block)
  `DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM (
      'trialing', 'pending', 'active', 'expired', 'rejected'
    );
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,

  // 2. Add subscription_status column
  `ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS subscription_status subscription_status_enum
      NOT NULL DEFAULT 'trialing'`,

  // 3. Add max_vehicles_limit column
  `ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS max_vehicles_limit INTEGER
      NOT NULL DEFAULT 5`,

  // 4. Add subscription_end_date column (if missing)
  `ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ`,

  // 5. Add duration_days to subscription_plans
  `ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS duration_days INTEGER
      NOT NULL DEFAULT 30`,

  // 6. Backfill existing tenants
  `UPDATE tenants
    SET subscription_status = CASE
      WHEN subscription_end_date IS NULL   THEN 'active'::subscription_status_enum
      WHEN subscription_end_date < now()   THEN 'expired'::subscription_status_enum
      ELSE                                      'trialing'::subscription_status_enum
    END
    WHERE subscription_status = 'trialing'`,
];

async function runStatement(sql, index) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  
  // Use PostgREST RPC approach via a direct query URL
  // Supabase exposes a SQL endpoint via the pg-meta service
  const metaUrl = SUPABASE_URL.replace('https://', 'https://').replace('.supabase.co', '.supabase.co') + '/rest/v1/';
  
  // Use the pg SQL execution via Supabase's internal API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  return response;
}

// Alternative: use the pg-meta API that Supabase exposes
async function execSQL(sql) {
  // Supabase Management API for SQL execution  
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await response.text();
  return { ok: response.ok, status: response.status, body: text };
}

console.log('🚀  Applying Phase 1 billing migration to Supabase...\n');

let allPassed = true;
for (let i = 0; i < statements.length; i++) {
  const sql = statements[i];
  const preview = sql.replace(/\s+/g, ' ').slice(0, 80);
  process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}...`);
  
  try {
    const result = await execSQL(sql);
    if (result.ok || result.body.includes('already exists') || result.body.includes('duplicate')) {
      console.log(' ✅');
    } else {
      console.log(` ❌  (HTTP ${result.status})`);
      console.log('     Response:', result.body.slice(0, 200));
      allPassed = false;
    }
  } catch (err) {
    console.log(` ❌  ${err.message}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n✅  Migration complete! All columns and types are in place.');
} else {
  console.log('\n⚠️   Some statements failed. See above. You can also apply the SQL manually:');
  console.log('    → Open https://supabase.com/dashboard/project/xpevrbdfqgiynpyisgxm/sql/new');
  console.log('    → Paste the contents of: supabase/migrations/20260529_billing_phase1.sql');
}
