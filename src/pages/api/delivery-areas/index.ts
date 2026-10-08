import { wrapHandler } from '@/src/lib/astro-api';
import { db } from '@/db';
import { deliveryPartners } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { toErrorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

async function _GET() {
  try {
    // Fetch all active delivery partners
    const activePartners = await db.query.deliveryPartners.findMany({
      where: eq(deliveryPartners.status, 'ACTIVE'),
    });

    const areaSet = new Set<string>();

    for (const partner of activePartners) {
      if (Array.isArray(partner.serviceableAreas)) {
        for (const rawArea of partner.serviceableAreas) {
          const area = String(rawArea || '').trim();
          if (area) {
            areaSet.add(area);
          }
        }
      }
    }

    const uniqueAreas = Array.from(areaSet).sort((a, b) => a.localeCompare(b));

    return Response.json({
      areas: uniqueAreas,
      uniqueAreas,
    });
  } catch (error) {
    const { message, statusCode } = toErrorResponse(error);
    return Response.json({ message }, { status: statusCode });
  }
}

export const GET = wrapHandler(_GET);
