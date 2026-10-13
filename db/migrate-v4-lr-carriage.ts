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
  console.log('Running migration: Adding LR (Lorry Receipt) and Carriage fields to orders table...');

  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "lr_number" VARCHAR(100);`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "carriage_details" TEXT;`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "lr_copy_url" TEXT;`;

  console.log('LR and carriage fields added successfully!');
  await sql.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
