const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
  if (!tenant) {
    console.log("No tenant found");
    return;
  }
  
  console.log("Attempting to delete tenant:", tenant.id);
  const { data, error } = await supabase.from('tenants').delete().eq('id', tenant.id).select();
  
  console.log("Error:", error);
  console.log("Data (deleted rows):", data);
}

run();
