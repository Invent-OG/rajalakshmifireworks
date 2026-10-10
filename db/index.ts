import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Connection pool for queries configured for Supabase PgBouncer transaction pooler
const queryClient = postgres(connectionString, {
  prepare: false, // Required for PgBouncer transaction pooler (port 6543)
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 10, // 10 minutes max connection lifetime to prevent stale sockets
});

export const db = drizzle(queryClient, { schema });

// Separate connection for transactions that need serializable isolation
export function createTransactionClient() {
  return postgres(connectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 15,
    connect_timeout: 10,
    max_lifetime: 60 * 5,
  });
}

export type Database = typeof db;
