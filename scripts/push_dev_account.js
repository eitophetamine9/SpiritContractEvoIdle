import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('[ERROR] .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = keyMatch ? keyMatch[1].trim() : '';

console.log('--- SUPABASE DEV ACCOUNT PROVISIONER ---');
console.log('Target URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'admin@email.com';
  const password = 'x@DM1N';

  console.log(`\nAttempting authentication on Supabase for ${email}...`);

  // 1. Check existing sign in
  const signInRes = await supabase.auth.signInWithPassword({ email, password });
  if (signInRes.data?.user) {
    console.log('✅ [SUCCESS] Admin Dev account is already active on Supabase!');
    console.log('User ID:', signInRes.data.user.id);
    return;
  }

  console.log('Account not yet active via password login (' + (signInRes.error?.message || 'not found') + ').');
  console.log('Attempting sign-up on Supabase...');

  // 2. Try sign-up
  const signUpRes = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: 'AdminDev',
        role: 'admin',
        isDev: true
      }
    }
  });

  if (signUpRes.data?.user) {
    console.log('✅ [SUCCESS] Admin Dev account created on Supabase!');
    console.log('User ID:', signUpRes.data.user.id);
    return;
  }

  console.log('\n⚠️ Supabase Public API Notice:');
  console.log('Message:', signUpRes.error?.message || 'Could not register directly via anon endpoint');
  console.log('\n================================================================');
  console.log('To directly provision this account in Supabase without email limits:');
  console.log('1. Go to your Supabase Project Dashboard -> SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/esqtxxhsjexvudhkugxz/sql');
  console.log('2. Run the script located in:');
  console.log('   supabase/migrations/20261017_create_dev_admin_account.sql');
  console.log('================================================================');
  console.log('NOTE: The game client already recognizes and activates this Dev account');
  console.log('seamlessly in offline/online mode when logging in with admin@email.com / x@DM1N!');
}

run();
