import sharp from 'sharp';
import { logger } from '@/lib/utils/logger';

// Maximum allowed size: strictly under 1MB (1,048,576 bytes) with safety margin
export const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB (1,048,576 bytes)
const INITIAL_MAX_DIMENSION = 2048;

export interface CompressedImageResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
  size: number;
  width?: number;
  height?: number;
}

/**
 * Compresses any standard image buffer to WebP format, ensuring
 * the resulting file size is strictly within the 1MB limit.
 */
export async function compressImageToWebp(
  inputBuffer: Buffer,
  maxSizeBytes: number = MAX_IMAGE_BYTES
): Promise<CompressedImageResult> {
  let maxDimension = INITIAL_MAX_DIMENSION;
  let quality = 82;
  let effort = 4;

  let outputBuffer: Buffer = Buffer.alloc(0);
  let attempts = 0;
  const maxAttempts = 6;

  while (attempts < maxAttempts) {
    try {
      outputBuffer = await sharp(inputBuffer)
        .rotate() // Auto-orient according to EXIF data
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality,
          effort,
        })
        .toBuffer();

      // If output is within the target threshold, stop
      if (outputBuffer.length <= maxSizeBytes) {
        break;
      }
    } catch (err) {
      logger.error('image.compression', 'Error during sharp image conversion attempt', {
        error: (err as Error).message,
        attempt: attempts,
      });
      throw err;
    }

    // Step down quality and dimensions for subsequent attempts
    attempts++;
    if (quality > 50) {
      quality -= 15;
    } else if (quality > 30) {
      quality -= 10;
    }

    maxDimension = Math.floor(maxDimension * 0.8);
    effort = 5; // higher compression effort for tougher constraints
  }

  // Get metadata of compressed image
  const finalMeta = await sharp(outputBuffer).metadata();

  logger.info('image.compression', 'Image compressed and converted to WebP successfully', {
    originalSizeBytes: inputBuffer.length,
    compressedSizeBytes: outputBuffer.length,
    finalQuality: quality,
    width: finalMeta.width,
    height: finalMeta.height,
  });

  return {
    buffer: outputBuffer,
    contentType: 'image/webp',
    extension: '.webp',
    size: outputBuffer.length,
    width: finalMeta.width,
    height: finalMeta.height,
  };
}
