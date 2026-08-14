const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("=== USERS (Auth) ===");
  const { data: users, error: usersErr } = await supabase.auth.admin.listUsers();
  console.log(usersErr || users.users.map(u => ({ id: u.id, email: u.email })));

  console.log("\n=== PROFILES ===");
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  console.log(profErr || profiles);

  console.log("\n=== ORGANIZATIONS ===");
  const { data: orgs, error: orgErr } = await supabase.from('organizations').select('*');
  console.log(orgErr || orgs);

  console.log("\n=== ORGANIZATION MEMBERS ===");
  const { data: members, error: memErr } = await supabase.from('organization_members').select('*');
  console.log(memErr || members);
}

main();
