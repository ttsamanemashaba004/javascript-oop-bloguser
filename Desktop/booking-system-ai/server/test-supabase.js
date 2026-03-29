import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\nAttempting to connect to Supabase...');

    // Try a simple query
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase query error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('❌ Connection failed with error:');
    console.error(err);

    if (err.cause) {
      console.error('\nUnderlying cause:', err.cause);
    }
  }
}

testConnection();
