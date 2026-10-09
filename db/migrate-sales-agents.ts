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
  console.log('Running migration for sales_agents and order attribution...');

  // 1. Create sales_agents table
  await sql`
    CREATE TABLE IF NOT EXISTS "sales_agents" (
      "id" SERIAL PRIMARY KEY,
      "agent_code" VARCHAR(30) NOT NULL,
      "name" VARCHAR(255) NOT NULL,
      "referral_code" VARCHAR(50) NOT NULL,
      "mobile" VARCHAR(20) NOT NULL,
      "email" VARCHAR(255),
      "location" VARCHAR(255),
      "joining_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "sales_agents_agent_code_idx" ON "sales_agents" ("agent_code");`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "sales_agents_referral_code_idx" ON "sales_agents" (UPPER("referral_code"));`;
  await sql`CREATE INDEX IF NOT EXISTS "sales_agents_is_active_idx" ON "sales_agents" ("is_active");`;
  await sql`CREATE INDEX IF NOT EXISTS "sales_agents_mobile_idx" ON "sales_agents" ("mobile");`;
  await sql`CREATE INDEX IF NOT EXISTS "sales_agents_joining_date_idx" ON "sales_agents" ("joining_date");`;

  console.log('sales_agents table and indexes ensured.');

  // 2. Add columns to orders table if not exist
  await sql`
    ALTER TABLE "orders"
    ADD COLUMN IF NOT EXISTS "agent_id" INTEGER REFERENCES "sales_agents"("id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "referral_code" VARCHAR(50),
    ADD COLUMN IF NOT EXISTS "attribution_source" VARCHAR(20);
  `;

  await sql`CREATE INDEX IF NOT EXISTS "orders_agent_id_idx" ON "orders" ("agent_id");`;
  await sql`CREATE INDEX IF NOT EXISTS "orders_referral_code_idx" ON "orders" ("referral_code");`;
  await sql`CREATE INDEX IF NOT EXISTS "orders_attribution_source_idx" ON "orders" ("attribution_source");`;

  console.log('orders table attribution columns and indexes ensured.');

  // 3. Seed initial sales agents if table is empty
  const agentCount = await sql`SELECT COUNT(*)::int as count FROM "sales_agents"`;
  if (agentCount[0].count === 0) {
    console.log('Seeding initial sales agents...');
    const insertedAgents = await sql`
      INSERT INTO "sales_agents" ("agent_code", "name", "referral_code", "mobile", "email", "location", "joining_date", "is_active")
      VALUES
        ('AGT-001', 'Guna Sekar', 'GUNA01', '9876543210', 'guna@rajalakshmifireworks.com', 'Sivakasi Head Office', NOW() - INTERVAL '90 days', TRUE),
        ('AGT-002', 'Rajesh Kannan', 'RAJ01', '9840123456', 'rajesh@rajalakshmifireworks.com', 'Chennai Region', NOW() - INTERVAL '60 days', TRUE),
        ('AGT-003', 'Priya Sundaram', 'PRIYA01', '9841234567', 'priya@rajalakshmifireworks.com', 'Coimbatore Central', NOW() - INTERVAL '45 days', TRUE),
        ('AGT-004', 'Suresh Kumar', 'SURESH02', '9843344556', 'suresh@rajalakshmifireworks.com', 'Madurai South', NOW() - INTERVAL '30 days', TRUE),
        ('AGT-005', 'Kavitha Murugan', 'KAVI05', '9844455667', 'kavitha@rajalakshmifireworks.com', 'Salem North', NOW() - INTERVAL '15 days', FALSE)
      RETURNING *;
    `;
    console.log(`Inserted ${insertedAgents.length} initial agents.`);

    // 4. Attribute a portion of existing orders to showcase real tracking metrics
    const existingOrders = await sql`SELECT id, invoice_number FROM "orders" ORDER BY id ASC LIMIT 15`;
    if (existingOrders.length > 0 && insertedAgents.length > 0) {
      console.log('Attributing a sample of existing orders to sales agents...');
      const guna = insertedAgents.find((a) => a.agent_code === 'AGT-001');
      const raj = insertedAgents.find((a) => a.agent_code === 'AGT-002');
      const priya = insertedAgents.find((a) => a.agent_code === 'AGT-003');
      const suresh = insertedAgents.find((a) => a.agent_code === 'AGT-004');

      if (guna && raj && priya && suresh) {
        // Guna: 5 orders
        for (let i = 0; i < Math.min(5, existingOrders.length); i++) {
          const source = i % 2 === 0 ? 'CODE' : 'LINK';
          await sql`
            UPDATE "orders"
            SET "agent_id" = ${guna.id}, "referral_code" = ${guna.referral_code}, "attribution_source" = ${source}
            WHERE "id" = ${existingOrders[i].id}
          `;
        }

        // Rajesh: 3 orders
        for (let i = 5; i < Math.min(8, existingOrders.length); i++) {
          const source = i % 2 === 0 ? 'CODE' : 'LINK';
          await sql`
            UPDATE "orders"
            SET "agent_id" = ${raj.id}, "referral_code" = ${raj.referral_code}, "attribution_source" = ${source}
            WHERE "id" = ${existingOrders[i].id}
          `;
        }

        // Priya: 2 orders
        for (let i = 8; i < Math.min(10, existingOrders.length); i++) {
          const source = i % 2 === 0 ? 'CODE' : 'LINK';
          await sql`
            UPDATE "orders"
            SET "agent_id" = ${priya.id}, "referral_code" = ${priya.referral_code}, "attribution_source" = 'CODE'
            WHERE "id" = ${existingOrders[i].id}
          `;
        }

        // Suresh: 1 order
        for (let i = 10; i < Math.min(11, existingOrders.length); i++) {
          await sql`
            UPDATE "orders"
            SET "agent_id" = ${suresh.id}, "referral_code" = ${suresh.referral_code}, "attribution_source" = 'LINK'
            WHERE "id" = ${existingOrders[i].id}
          `;
        }
        console.log('Sample orders attributed successfully.');
      }
    }
  } else {
    console.log(`sales_agents table already contains ${agentCount[0].count} agents.`);
  }

  await sql.end();
  console.log('Migration completed successfully!');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
