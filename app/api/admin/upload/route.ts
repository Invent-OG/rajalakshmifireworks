import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { uploadMediaToSupabase } from '@/lib/supabase/storage';
import { logger } from '@/lib/utils/logger';
import path from 'path';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ message: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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

    // Sanitize extension and filename
    const originalExt = path.extname(file.name) || (isVideo ? '.mp4' : '.jpg');
    const safeExt = originalExt.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const cleanName = path
      .basename(file.name, originalExt)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const uniqueFileName = `${cleanName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${safeExt}`;

    // Upload to Supabase Storage Bucket
    const folder = mediaType === 'video' ? 'videos' : 'images';
    const uploadResult = await uploadMediaToSupabase({
      buffer,
      filename: uniqueFileName,
      contentType: mimeType,
      folder,
    });

    logger.info('media.upload', 'Media uploaded to Supabase Storage', {
      filename: uniqueFileName,
      mediaType,
      size: file.size,
      url: uploadResult.url,
      adminEmail: session.email,
    });

    return Response.json(
      {
        url: uploadResult.url,
        type: mediaType,
        name: file.name,
        size: file.size,
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

