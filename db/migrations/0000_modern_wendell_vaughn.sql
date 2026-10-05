CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_ta" varchar(255),
	"slug" varchar(255) NOT NULL,
	"description" text,
	"description_ta" text,
	"image" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"name" varchar(255) NOT NULL,
	"name_ta" varchar(255),
	"slug" varchar(255) NOT NULL,
	"description" text,
	"description_ta" text,
	"sku" varchar(100),
	"pieces_per_box" integer DEFAULT 1,
	"box_content" integer DEFAULT 1,
	"content_unit" varchar(50) DEFAULT 'Pcs',
	"mrp" numeric(10, 2) NOT NULL,
	"discount_percent" integer DEFAULT 0,
	"selling_price" numeric(10, 2) NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_bestseller" boolean DEFAULT false NOT NULL,
	"is_combo" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combo_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"combo_product_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"type" varchar(20) DEFAULT 'image' NOT NULL,
	"url" text NOT NULL,
	"alt" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"state_id" integer,
	"city_id" integer,
	"label" varchar(100),
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"pincode" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"mobile_number" varchar(20) NOT NULL,
	"email" varchar(255),
	"address" text,
	"pincode" varchar(10),
	"vehicle_type" varchar(50),
	"vehicle_number" varchar(30),
	"notes" text,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"customer_id" integer NOT NULL,
	"state_id" integer,
	"city_id" integer,
	"delivery_partner_id" integer,
	"assigned_at" timestamp with time zone,
	"assigned_by" varchar(255),
	"order_status" varchar(30) DEFAULT 'NEW' NOT NULL,
	"fulfillment_type" varchar(20) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"delivery_charge" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"customer_name_snapshot" varchar(255) NOT NULL,
	"customer_mobile_snapshot" varchar(15) NOT NULL,
	"address_snapshot" jsonb,
	"notes" text,
	"idempotency_key" varchar(100),
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_name_snapshot" varchar(255) NOT NULL,
	"product_sku_snapshot" varchar(100),
	"mrp_snapshot" numeric(10, 2) NOT NULL,
	"selling_price_snapshot" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"discount_per_unit" numeric(10, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"old_status" varchar(30),
	"new_status" varchar(30) NOT NULL,
	"changed_by" varchar(255),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_delivery_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"delivery_partner_id" integer NOT NULL,
	"assigned_by" varchar(255),
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unassigned_at" timestamp with time zone,
	"status" varchar(30) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"quantity_change" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"reference_id" integer,
	"reference_type" varchar(30),
	"note" text,
	"performed_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"customer_id" integer,
	"phone_number" varchar(25) NOT NULL,
	"message_type" varchar(50) NOT NULL,
	"template_name" varchar(100) NOT NULL,
	"provider_message_id" varchar(150),
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"error_code" varchar(50),
	"error_message" text,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"payload_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_combo_product_id_products_id_fk" FOREIGN KEY ("combo_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_partner_id_delivery_partners_id_fk" FOREIGN KEY ("delivery_partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_delivery_assignments" ADD CONSTRAINT "order_delivery_assignments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_delivery_assignments" ADD CONSTRAINT "order_delivery_assignments_delivery_partner_id_delivery_partners_id_fk" FOREIGN KEY ("delivery_partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_is_active_idx" ON "categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "categories_sort_order_idx" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_is_active_idx" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "products_is_featured_idx" ON "products" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "products_is_bestseller_idx" ON "products" USING btree ("is_bestseller");--> statement-breakpoint
CREATE INDEX "products_is_combo_idx" ON "products" USING btree ("is_combo");--> statement-breakpoint
CREATE INDEX "products_selling_price_idx" ON "products" USING btree ("selling_price");--> statement-breakpoint
CREATE INDEX "products_discount_percent_idx" ON "products" USING btree ("discount_percent");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "combo_items_combo_product_id_idx" ON "combo_items" USING btree ("combo_product_id");--> statement-breakpoint
CREATE INDEX "combo_items_product_id_idx" ON "combo_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_product_id_idx" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_sort_order_idx" ON "product_media" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_mobile_idx" ON "customers" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "customer_addresses_customer_id_idx" ON "customer_addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_addresses_state_id_idx" ON "customer_addresses" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "customer_addresses_city_id_idx" ON "customer_addresses" USING btree ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "states_code_idx" ON "states" USING btree ("code");--> statement-breakpoint
CREATE INDEX "states_name_idx" ON "states" USING btree ("name");--> statement-breakpoint
CREATE INDEX "states_is_active_idx" ON "states" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cities_state_id_idx" ON "cities" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "cities_name_idx" ON "cities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "cities_is_active_idx" ON "cities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "delivery_partners_status_idx" ON "delivery_partners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "delivery_partners_mobile_idx" ON "delivery_partners" USING btree ("mobile_number");--> statement-breakpoint
CREATE INDEX "delivery_partners_name_idx" ON "delivery_partners" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_invoice_number_idx" ON "orders" USING btree ("invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key_idx" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_state_id_idx" ON "orders" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "orders_city_id_idx" ON "orders" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "orders_delivery_partner_id_idx" ON "orders" USING btree ("delivery_partner_id");--> statement-breakpoint
CREATE INDEX "orders_order_status_idx" ON "orders" USING btree ("order_status");--> statement-breakpoint
CREATE INDEX "orders_customer_mobile_snapshot_idx" ON "orders" USING btree ("customer_mobile_snapshot");--> statement-breakpoint
CREATE INDEX "orders_fulfillment_type_idx" ON "orders" USING btree ("fulfillment_type");--> statement-breakpoint
CREATE INDEX "orders_placed_at_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_created_at_idx" ON "order_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_delivery_assignments_order_id_idx" ON "order_delivery_assignments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_delivery_assignments_partner_id_idx" ON "order_delivery_assignments" USING btree ("delivery_partner_id");--> statement-breakpoint
CREATE INDEX "order_delivery_assignments_status_idx" ON "order_delivery_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_transactions_product_id_idx" ON "inventory_transactions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_type_idx" ON "inventory_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "inventory_transactions_reference_idx" ON "inventory_transactions" USING btree ("reference_id","reference_type");--> statement-breakpoint
CREATE INDEX "inventory_transactions_created_at_idx" ON "inventory_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_key_idx" ON "settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_order_id_idx" ON "whatsapp_messages" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_customer_id_idx" ON "whatsapp_messages" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_provider_message_id_idx" ON "whatsapp_messages" USING btree ("provider_message_id");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_status_idx" ON "whatsapp_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_message_type_idx" ON "whatsapp_messages" USING btree ("message_type");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_created_at_idx" ON "whatsapp_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_order_type_idx" ON "whatsapp_messages" USING btree ("order_id","message_type");