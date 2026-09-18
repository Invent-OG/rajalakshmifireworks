import 'dotenv/config';
import postgres from 'postgres';

async function migrate() {
  const connectionString = process.env.DATABASE_URL!;
  console.log('🔄 Connecting to database for location & delivery partner migration...');
  const sql = postgres(connectionString, { max: 1 });

  try {
    // 1. Create states table
    console.log('📦 Ensuring `states` table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS states (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS states_code_idx ON states (code);`;
    await sql`CREATE INDEX IF NOT EXISTS states_name_idx ON states (name);`;
    await sql`CREATE INDEX IF NOT EXISTS states_is_active_idx ON states (is_active);`;

    // 2. Create cities table
    console.log('📦 Ensuring `cities` table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS cities_state_id_idx ON cities (state_id);`;
    await sql`CREATE INDEX IF NOT EXISTS cities_name_idx ON cities (name);`;
    await sql`CREATE INDEX IF NOT EXISTS cities_is_active_idx ON cities (is_active);`;

    // 3. Create delivery_partners table
    console.log('📦 Ensuring `delivery_partners` table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        whatsapp_number VARCHAR(20) NOT NULL,
        mobile_number VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        state_id INTEGER NOT NULL REFERENCES states(id),
        city_id INTEGER NOT NULL REFERENCES cities(id),
        address TEXT,
        pincode VARCHAR(10),
        vehicle_type VARCHAR(50),
        vehicle_number VARCHAR(30),
        notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS delivery_partners_state_id_idx ON delivery_partners (state_id);`;
    await sql`CREATE INDEX IF NOT EXISTS delivery_partners_city_id_idx ON delivery_partners (city_id);`;
    await sql`CREATE INDEX IF NOT EXISTS delivery_partners_status_idx ON delivery_partners (status);`;
    await sql`CREATE INDEX IF NOT EXISTS delivery_partners_mobile_idx ON delivery_partners (mobile_number);`;
    await sql`CREATE INDEX IF NOT EXISTS delivery_partners_name_idx ON delivery_partners (name);`;

    // 4. Update orders table with nullable foreign keys
    console.log('📦 Updating `orders` table with state_id, city_id, and delivery_partner_id...');
    await sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS state_id INTEGER REFERENCES states(id),
      ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id),
      ADD COLUMN IF NOT EXISTS delivery_partner_id INTEGER REFERENCES delivery_partners(id);
    `;
    await sql`CREATE INDEX IF NOT EXISTS orders_state_id_idx ON orders (state_id);`;
    await sql`CREATE INDEX IF NOT EXISTS orders_city_id_idx ON orders (city_id);`;
    await sql`CREATE INDEX IF NOT EXISTS orders_delivery_partner_id_idx ON orders (delivery_partner_id);`;

    // 5. Update customer_addresses table
    console.log('📦 Updating `customer_addresses` table with state_id and city_id...');
    await sql`
      ALTER TABLE customer_addresses 
      ADD COLUMN IF NOT EXISTS state_id INTEGER REFERENCES states(id),
      ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id),
      ADD COLUMN IF NOT EXISTS state VARCHAR(100);
    `;
    await sql`CREATE INDEX IF NOT EXISTS customer_addresses_state_id_idx ON customer_addresses (state_id);`;
    await sql`CREATE INDEX IF NOT EXISTS customer_addresses_city_id_idx ON customer_addresses (city_id);`;

    console.log('✅ Location & Delivery Partner database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
