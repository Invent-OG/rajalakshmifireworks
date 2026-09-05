import { getSupabaseAdminClient } from './client';
import { logger } from '@/lib/utils/logger';

export const DEFAULT_BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'product-media';

export interface UploadMediaOptions {
  buffer: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
}

export interface UploadMediaResult {
  url: string;
  path: string;
  bucket: string;
}

let bucketVerified = false;

/**
 * Ensures the public storage bucket exists in Supabase.
 */
async function ensureBucketExists(bucketName: string) {
  if (bucketVerified) return;

  try {
    const supabase = getSupabaseAdminClient();
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (!listError && buckets) {
      const exists = buckets.some((b) => b.name === bucketName);
      if (!exists) {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['image/*', 'video/*'],
        });

        if (createError) {
          logger.warn('supabase.storage', `Could not auto-create bucket "${bucketName}". It may already exist or need RLS config.`, {
            error: createError.message,
          });
        } else {
          logger.info('supabase.storage', `Created public bucket "${bucketName}" in Supabase.`);
        }
      }
    }
    bucketVerified = true;
  } catch (err) {
    logger.warn('supabase.storage', 'Bucket check skipped or failed', {
      error: (err as Error).message,
    });
  }
}

/**
 * Uploads an image or video buffer to Supabase Storage and returns its public URL.
 */
export async function uploadMediaToSupabase({
  buffer,
  filename,
  contentType,
  folder = 'uploads',
}: UploadMediaOptions): Promise<UploadMediaResult> {
  const bucketName = DEFAULT_BUCKET_NAME;
  await ensureBucketExists(bucketName);

  const supabase = getSupabaseAdminClient();
  const filePath = folder ? `${folder}/${filename}` : filename;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    logger.error('supabase.storage', 'Failed to upload media to Supabase storage', {
      bucket: bucketName,
      filePath,
      error: uploadError.message,
    });
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Failed to retrieve public URL from Supabase storage');
  }

  logger.info('supabase.storage', 'Media file uploaded to Supabase Storage successfully', {
    bucket: bucketName,
    filePath,
    publicUrl: publicUrlData.publicUrl,
  });

  return {
    url: publicUrlData.publicUrl,
    path: filePath,
    bucket: bucketName,
  };
}

/**
 * Delete a media file from Supabase Storage.
 */
export async function deleteMediaFromSupabase(filePath: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const bucketName = DEFAULT_BUCKET_NAME;

    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    if (error) {
      logger.warn('supabase.storage', 'Failed to delete file from Supabase', {
        filePath,
        error: error.message,
      });
      return false;
    }
    return true;
  } catch (err) {
    logger.warn('supabase.storage', 'Error deleting file from Supabase', {
      filePath,
      error: (err as Error).message,
    });
    return false;
  }
}
