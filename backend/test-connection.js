// Simple script to test different Supabase connection formats
const { Pool } = require('pg');

const password = 'Qwerty@uiop@123';
const projectRef = 'gshvnhukuineedxnrtqx';

// Different connection string formats to try
const connectionStrings = [
  // Format 1: Direct connection (most common)
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  
  // Format 2: Without db prefix
  `postgresql://postgres:${encodeURIComponent(password)}@${projectRef}.supabase.co:5432/postgres`,
  
  // Format 3: Pooler connection (common regions)
  `postgresql://postgres:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  
  // Format 4: Transaction pooler
  `postgresql://postgres:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
];

async function testConnection(connectionString, name) {
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log(`✅ SUCCESS with ${name}:`);
    console.log(`   Connection: ${connectionString.replace(password, '***')}`);
    console.log(`   Database version: ${result.rows[0].version.substring(0, 50)}...`);
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED with ${name}: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function testAll() {
  console.log('Testing different Supabase connection formats...\n');
  
  const formats = [
    'Direct connection (db. prefix)',
    'Direct connection (no db. prefix)',
    'Pooler (ap-south-1, port 6543)',
    'Pooler (us-east-1, port 6543)',
    'Pooler (eu-west-1, port 6543)',
    'Pooler (ap-south-1, port 5432)',
  ];

  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], formats[i]);
    if (success) {
      console.log(`\n🎉 Found working connection! Use this in your .env file:`);
      console.log(`DATABASE_URL=${connectionStrings[i]}`);
      console.log(`DATABASE_SSL=true`);
      return;
    }
  }
  
  console.log('\n❌ None of the connection formats worked.');
  console.log('Please check:');
  console.log('1. Your Supabase project is active');
  console.log('2. Your password is correct');
  console.log('3. Get the exact connection string from: Supabase Dashboard > Settings > Database > Connection string');
}

testAll().catch(console.error);

