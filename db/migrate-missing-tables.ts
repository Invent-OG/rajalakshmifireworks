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
  console.log('Running migration for missing tables...');

  // Create whatsapp_messages table
  await sql`
    CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
      "id" SERIAL PRIMARY KEY,
      "order_id" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "customer_id" INTEGER REFERENCES "customers"("id") ON DELETE SET NULL,
      "phone_number" VARCHAR(25) NOT NULL,
      "message_type" VARCHAR(50) NOT NULL,
      "template_name" VARCHAR(100) NOT NULL,
      "provider_message_id" VARCHAR(150),
      "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      "error_code" VARCHAR(50),
      "error_message" TEXT,
      "attempt_count" INTEGER NOT NULL DEFAULT 1,
      "last_attempt_at" TIMESTAMPTZ,
      "sent_at" TIMESTAMPTZ,
      "delivered_at" TIMESTAMPTZ,
      "read_at" TIMESTAMPTZ,
      "failed_at" TIMESTAMPTZ,
      "payload_snapshot" JSONB,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS "whatsapp_messages_order_id_idx" ON "whatsapp_messages" ("order_id");`;
  await sql`CREATE INDEX IF NOT EXISTS "whatsapp_messages_customer_id_idx" ON "whatsapp_messages" ("customer_id");`;
  await sql`CREATE INDEX IF NOT EXISTS "whatsapp_messages_provider_message_id_idx" ON "whatsapp_messages" ("provider_message_id");`;
  await sql`CREATE INDEX IF NOT EXISTS "whatsapp_messages_status_idx" ON "whatsapp_messages" ("status");`;
  await sql`CREATE INDEX IF NOT EXISTS "whatsapp_messages_message_type_idx" ON "whatsapp_messages" ("message_type");`;
  await sql`CREATE INDEX IF NOT EXISTS "whatsapp_messages_created_at_idx" ON "whatsapp_messages" ("created_at");`;
  await sql`CREATE INDEX IF NOT EXISTS "whatsapp_messages_order_type_idx" ON "whatsapp_messages" ("order_id", "message_type");`;

  console.log('whatsapp_messages table and indexes created successfully!');

  // Check all existing tables
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public';
  `;
  console.log('Existing tables in DB:', tables.map((t) => t.table_name));

  await sql.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
