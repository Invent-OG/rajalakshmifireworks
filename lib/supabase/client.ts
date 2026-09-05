import { createClient } from '@supabase/supabase-js';

// Derive default Supabase URL if not explicitly provided
function getSupabaseUrl(): string {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Extract project ref from DATABASE_URL if available
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/postgres\.([a-z0-9]+):/);
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }

  return 'https://lupgjjfmcbtkhjfxjinb.supabase.co';
}

function getSupabaseKey(): string {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
}

export const supabaseUrl = getSupabaseUrl();
export const supabaseKey = getSupabaseKey();

/**
 * Server-side Supabase client for admin/storage operations.
 */
export function getSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!key) {
    throw new Error(
      'Supabase API key is missing. Please add SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) to your .env'
    );
  }


  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
