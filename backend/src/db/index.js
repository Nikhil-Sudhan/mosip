const { Pool } = require('pg');
const config = require('../config');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database schema
async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        organization VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // QA Agencies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS qa_agencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        certification_number VARCHAR(255),
        specialties TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Batches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        qa_agency_id UUID REFERENCES users(id) ON DELETE SET NULL,
        product_type VARCHAR(255) NOT NULL,
        grade VARCHAR(255),
        variety VARCHAR(255),
        batch_number VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        weight DECIMAL(10,2),
        weight_unit VARCHAR(50),
        farm_address TEXT,
        farmer_details TEXT,
        harvest_date DATE NOT NULL,
        organic_status VARCHAR(50) DEFAULT 'NON_ORGANIC',
        container_details TEXT,
        origin_country VARCHAR(100) NOT NULL,
        destination_country VARCHAR(100) NOT NULL,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'SUBMITTED',
        inspection_requested_at TIMESTAMP,
        inspection_scheduled_at TIMESTAMP,
        inspection_type VARCHAR(50),
        inspection_location TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Batch documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS batch_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        size BIGINT,
        path VARCHAR(500) NOT NULL,
        url VARCHAR(500),
        category VARCHAR(50) DEFAULT 'general',
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Batch history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS batch_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Inspections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inspections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
        inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
        moisture_percent DECIMAL(5,2),
        pesticide_ppm DECIMAL(8,4),
        organic_status VARCHAR(100),
        iso_code VARCHAR(100),
        result VARCHAR(20) CHECK (result IN ('PASS', 'FAIL')),
        notes TEXT,
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Credentials table
    await client.query(`
      CREATE TABLE IF NOT EXISTS credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
        issuer_did VARCHAR(255),
        issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
        credential_json JSONB NOT NULL,
        qr_url TEXT,
        qr_image TEXT,
        qr_portal_url TEXT,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        issued_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        revoked_at TIMESTAMP,
        revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
        revocation_reason TEXT,
        wallet_shared BOOLEAN DEFAULT FALSE,
        wallet_shared_at TIMESTAMP
      )
    `);

    // Sessions table (for refresh tokens)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(100) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        role VARCHAR(50),
        entity_type VARCHAR(50),
        entity_id VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Verification activity table
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        credential_id VARCHAR(255) NOT NULL,
        verdict VARCHAR(50) NOT NULL,
        actor VARCHAR(50),
        product VARCHAR(255),
        route VARCHAR(255),
        checked_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_batches_exporter ON batches(exporter_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_batches_qa_agency ON batches(qa_agency_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_credentials_batch ON credentials(batch_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)
    `);

    await client.query('COMMIT');
    console.log('Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initSchema,
};

