import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { compressImageToWebp, MAX_IMAGE_BYTES } from '@/lib/utils/image-compression';

describe('Image Compression Utility', () => {
  it('converts a large raw JPEG/PNG image to WebP format', async () => {
    // Create a 2500x2500 high-res image buffer
    const testBuffer = await sharp({
      create: {
        width: 2500,
        height: 2500,
        channels: 3,
        background: { r: 255, g: 120, b: 50 },
      },
    })
      .png()
      .toBuffer();

    const result = await compressImageToWebp(testBuffer);

    expect(result.contentType).toBe('image/webp');
    expect(result.extension).toBe('.webp');
    expect(result.size).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
    expect(result.buffer).toBeInstanceOf(Buffer);

    // Verify output buffer is actually valid WebP
    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBeLessThanOrEqual(2048);
    expect(metadata.height).toBeLessThanOrEqual(2048);
  }, 15000);

  it('ensures compressed output is strictly under 1MB', async () => {
    // Generate a noise/complex image that would typically have high compression size
    const testBuffer = await sharp({
      create: {
        width: 3000,
        height: 3000,
        channels: 4,
        background: { r: 100, g: 200, b: 255, alpha: 1 },
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const result = await compressImageToWebp(testBuffer, 1024 * 1024);

    expect(result.size).toBeLessThanOrEqual(1024 * 1024);
    expect(result.contentType).toBe('image/webp');
  }, 15000);
});
