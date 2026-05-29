import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function execSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });
  return await response.text();
}

async function run() {
  const sql = `
    SELECT pg_type.typname, pg_enum.enumlabel
    FROM pg_type
    JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'subscription_status' OR pg_type.typname = 'subscription_status_enum';
  `;
  console.log("Enum values:");
  console.log(await execSQL(sql));

  const sql2 = `
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'subscription_status';
  `;
  console.log("Column type:");
  console.log(await execSQL(sql2));
}

run().catch(console.error);
