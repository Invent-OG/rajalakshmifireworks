import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  try {
    console.log('Ensuring product-media bucket exists with 50MB limit...');
    await sql`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('product-media', 'product-media', true, 52428800, NULL)
      ON CONFLICT (id) DO UPDATE
      SET public = true,
          file_size_limit = 52428800;
    `;

    console.log('Setting up storage.buckets policies...');
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'buckets' AND policyname = 'Allow public read buckets'
        ) THEN
          CREATE POLICY "Allow public read buckets" 
          ON storage.buckets FOR SELECT 
          TO public
          USING (true);
        END IF;
      END $$;
    `;

    console.log('Setting up storage.objects policies...');
    await sql`
      DO $$
      BEGIN
        -- Public read
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access to product-media'
        ) THEN
          CREATE POLICY "Public Access to product-media" 
          ON storage.objects FOR SELECT 
          TO public
          USING (bucket_id = 'product-media');
        END IF;

        -- Public insert (upload)
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow upload to product-media'
        ) THEN
          CREATE POLICY "Allow upload to product-media" 
          ON storage.objects FOR INSERT 
          TO public
          WITH CHECK (bucket_id = 'product-media');
        END IF;

        -- Public update (upsert)
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow update to product-media'
        ) THEN
          CREATE POLICY "Allow update to product-media" 
          ON storage.objects FOR UPDATE 
          TO public
          USING (bucket_id = 'product-media')
          WITH CHECK (bucket_id = 'product-media');
        END IF;

        -- Public delete
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow delete from product-media'
        ) THEN
          CREATE POLICY "Allow delete from product-media" 
          ON storage.objects FOR DELETE 
          TO public
          USING (bucket_id = 'product-media');
        END IF;
      END $$;
    `;

    const policies = await sql`
      SELECT tablename, policyname, cmd 
      FROM pg_policies 
      WHERE schemaname = 'storage'
    `;
    console.log('Successfully configured policies:', policies);
  } catch (err) {
    console.error('Error configuring storage policies:', err);
  } finally {
    await sql.end();
  }
}

main();
