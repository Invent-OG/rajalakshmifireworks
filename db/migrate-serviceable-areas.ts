import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

// Disable prepared statements for Supabase transaction pooler (port 6543)
const sql = postgres(connectionString, { prepare: false });

async function run() {
  console.log('Adding serviceable_areas column to delivery_partners table...');

  await sql`
    ALTER TABLE "delivery_partners"
    ADD COLUMN IF NOT EXISTS "serviceable_areas" JSONB DEFAULT '[]'::jsonb;
  `;

  console.log('Migration completed successfully!');
  await sql.end();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
