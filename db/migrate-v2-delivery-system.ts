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
  console.log('Running migration for Delivery Partner & Order Assignment System...');

  // 1. Modify delivery_partners table
  await sql`ALTER TABLE "delivery_partners" DROP COLUMN IF EXISTS "state_id";`;
  await sql`ALTER TABLE "delivery_partners" DROP COLUMN IF EXISTS "city_id";`;
  await sql`ALTER TABLE "delivery_partners" DROP COLUMN IF EXISTS "whatsapp_number";`;

  // 2. Modify orders table
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "assigned_at" TIMESTAMPTZ;`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "assigned_by" VARCHAR(255);`;
  await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMPTZ;`;
  await sql`ALTER TABLE "orders" ALTER COLUMN "order_status" SET DEFAULT 'NEW';`;

  // Map any existing legacy statuses to new statuses
  await sql`UPDATE "orders" SET "order_status" = 'NEW' WHERE "order_status" = 'PENDING';`;
  await sql`UPDATE "orders" SET "order_status" = 'CONFIRMED' WHERE "order_status" IN ('PROCESSING', 'READY', 'READY_FOR_PICKUP');`;
  await sql`UPDATE "orders" SET "order_status" = 'DELIVERED' WHERE "order_status" = 'COMPLETED';`;

  // 3. Create order_delivery_assignments table
  await sql`
    CREATE TABLE IF NOT EXISTS "order_delivery_assignments" (
      "id" SERIAL PRIMARY KEY,
      "order_id" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "delivery_partner_id" INTEGER NOT NULL REFERENCES "delivery_partners"("id"),
      "assigned_by" VARCHAR(255),
      "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "unassigned_at" TIMESTAMPTZ,
      "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS "order_delivery_assignments_order_id_idx" ON "order_delivery_assignments" ("order_id");`;
  await sql`CREATE INDEX IF NOT EXISTS "order_delivery_assignments_partner_id_idx" ON "order_delivery_assignments" ("delivery_partner_id");`;
  await sql`CREATE INDEX IF NOT EXISTS "order_delivery_assignments_status_idx" ON "order_delivery_assignments" ("status");`;

  console.log('Migration completed successfully!');
  await sql.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
