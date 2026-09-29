import * as route from '@/app/api/admin/delivery-partners/[id]/route';
import { createAstroEndpoint } from '@/src/lib/astro-api-adapter';

export const ALL = createAstroEndpoint(route);
