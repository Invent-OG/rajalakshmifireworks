import { wrapHandler } from '@/src/lib/astro-api';

import { getSession } from '@/lib/auth/session';
import { uploadMediaToSupabase } from '@/lib/supabase/storage';
import { compressImageToWebp, MAX_IMAGE_BYTES } from '@/lib/utils/image-compression';
import { logger } from '@/lib/utils/logger';
import path from 'path';

async function _POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderParam = formData.get('folder') as string | null;

    if (!file) {
      return Response.json({ message: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // Validate mime type
    const mimeType = file.type || 'application/octet-stream';
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    if (!isImage && !isVideo) {
      return Response.json(
        { message: 'Unsupported file type. Please upload an image or video.' },
        { status: 400 }
      );
    }

    const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';

    let uploadBuffer: Buffer;
    let uploadContentType: string;
    let fileExtension: string;
    let finalSize: number;

    const originalExt = path.extname(file.name) || (isVideo ? '.mp4' : '.jpg');
    const cleanBaseName = path
      .basename(file.name, originalExt)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');

    if (isImage) {
      // Compress image into WebP format and guarantee size <= 1MB
      const compressed = await compressImageToWebp(rawBuffer, MAX_IMAGE_BYTES);
      uploadBuffer = compressed.buffer;
      uploadContentType = compressed.contentType;
      fileExtension = compressed.extension;
      finalSize = compressed.size;
    } else {
      // Validate video file size against the 1MB limit
      if (rawBuffer.length > MAX_IMAGE_BYTES) {
        return Response.json(
          {
            message: `Video size (${(rawBuffer.length / (1024 * 1024)).toFixed(2)}MB) exceeds the 1MB limit. Please compress your video or use an external URL.`,
          },
          { status: 400 }
        );
      }
      uploadBuffer = rawBuffer;
      uploadContentType = mimeType;
      fileExtension = originalExt.toLowerCase().replace(/[^a-z0-9.]/g, '');
      finalSize = rawBuffer.length;
    }

    const uniqueFileName = `${cleanBaseName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${fileExtension}`;

    // Upload to Supabase Storage Bucket
    const targetFolder = folderParam || (mediaType === 'video' ? 'videos' : 'images');
    const uploadResult = await uploadMediaToSupabase({
      buffer: uploadBuffer,
      filename: uniqueFileName,
      contentType: uploadContentType,
      folder: targetFolder,
    });

    logger.info('media.upload', 'Media uploaded to Supabase Storage', {
      filename: uniqueFileName,
      mediaType,
      originalSize: file.size,
      finalSize,
      url: uploadResult.url,
      adminEmail: session.email,
    });

    return Response.json(
      {
        url: uploadResult.url,
        type: mediaType,
        name: uniqueFileName,
        size: finalSize,
        originalName: file.name,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('media.upload', 'Error uploading file to Supabase', {
      error: (error as Error).message,
    });
    return Response.json(
      { message: (error as Error).message || 'File upload failed' },
      { status: 500 }
    );
  }
}



// Native Astro APIRoute exports
export const POST = wrapHandler(_POST);
