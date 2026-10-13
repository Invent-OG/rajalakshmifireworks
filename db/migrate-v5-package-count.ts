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
  console.log('Running migration: Adding package_count (Cases / Boxes) to orders table...');

  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "package_count" INTEGER DEFAULT 1;`;

  console.log('package_count added successfully!');
  await sql.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
