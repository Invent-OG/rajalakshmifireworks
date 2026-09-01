import { NextRequest } from 'next/server';
import { db } from '@/db';
import { productMedia } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const productId = parseInt(id);

  try {
    const mediaList = await db.query.productMedia.findMany({
      where: eq(productMedia.productId, productId),
      orderBy: (m: { sortOrder: any; }, { asc }: any) => [asc(m.sortOrder)],
    });

    return Response.json({ media: mediaList });
  } catch (error) {
    console.error('Error fetching product media:', error);
    return Response.json({ message: 'Failed to load media' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const productId = parseInt(id);

  try {
    const body = await request.json();
    const { url, type = 'image', alt = '', sortOrder = 0 } = body;

    if (!url || typeof url !== 'string') {
      return Response.json({ message: 'Media URL is required' }, { status: 400 });
    }

    const [created] = await db
      .insert(productMedia)
      .values({
        productId,
        type: type === 'video' ? 'video' : 'image',
        url: url.trim(),
        alt: alt?.trim() || null,
        sortOrder: Number(sortOrder) || 0,
      })
      .returning();

    return Response.json({ media: created }, { status: 201 });
  } catch (error) {
    console.error('Error adding product media:', error);
    return Response.json({ message: 'Failed to add media' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const productId = parseInt(id);
  const { searchParams } = request.nextUrl;
  const mediaId = parseInt(searchParams.get('mediaId') || '0');

  if (!mediaId) {
    return Response.json({ message: 'Media ID is required' }, { status: 400 });
  }

  try {
    await db
      .delete(productMedia)
      .where(and(eq(productMedia.id, mediaId), eq(productMedia.productId, productId)));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting product media:', error);
    return Response.json({ message: 'Failed to delete media' }, { status: 500 });
  }
}
