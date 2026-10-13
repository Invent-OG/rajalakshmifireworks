import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  console.log('Running migration: Adding lifecycle timestamp fields to orders table...');

  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packed_at" TIMESTAMPTZ;`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "dispatched_at" TIMESTAMPTZ;`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "ready_for_pickup_at" TIMESTAMPTZ;`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "picked_up_at" TIMESTAMPTZ;`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ;`;

  console.log('Lifecycle timestamp columns added successfully!');
  await sql.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
