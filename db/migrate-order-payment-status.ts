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
  console.log('Running migration: Adding payment status fields to orders table...');

  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING';`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" VARCHAR(50);`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_reference" VARCHAR(100);`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMPTZ;`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_by" VARCHAR(255);`;

  await sql`CREATE INDEX IF NOT EXISTS "orders_payment_status_idx" ON "orders" ("payment_status");`;

  // For already DELIVERED sample orders, mark them as PAID with UPI
  await sql`
    UPDATE "orders"
    SET "payment_status" = 'PAID',
        "paid_at" = "delivered_at",
        "payment_method" = 'UPI',
        "paid_by" = 'system'
    WHERE "order_status" = 'DELIVERED' AND "payment_status" = 'PENDING';
  `;

  console.log('Migration completed successfully! orders table updated with payment fields.');
  await sql.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
