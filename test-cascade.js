const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
  if (!tenant) return console.log("No tenant");
  
  console.log("Deleting profiles...");
  await supabase.from('profiles').delete().eq('tenant_id', tenant.id);
  
  console.log("Deleting payment_proofs...");
  await supabase.from('payment_proofs').delete().eq('tenant_id', tenant.id);
  
  console.log("Deleting tenant...");
  const { error } = await supabase.from('tenants').delete().eq('id', tenant.id);
  console.log("Result:", error ? error.message : "Success!");
}

run();
