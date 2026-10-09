CREATE TABLE IF NOT EXISTS "referral_codes" (
  "id" SERIAL PRIMARY KEY,
  "code" VARCHAR(40) NOT NULL,
  "description" VARCHAR(255),
  "reward_type" VARCHAR(12) NOT NULL DEFAULT 'PERCENT',
  "reward_value" NUMERIC(10,2) NOT NULL,
  "max_discount" NUMERIC(10,2),
  "min_order_value" NUMERIC(10,2) NOT NULL DEFAULT '0',
  "usage_limit" INTEGER,
  "usage_count" INTEGER NOT NULL DEFAULT 0,
  "starts_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "referral_codes_code_idx" UNIQUE ("code")
);
CREATE INDEX IF NOT EXISTS "referral_codes_active_idx" ON "referral_codes" ("is_active");
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "referral_code" VARCHAR(40);
