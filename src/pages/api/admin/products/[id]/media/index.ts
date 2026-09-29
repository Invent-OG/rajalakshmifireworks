import * as route from '@/app/api/admin/products/[id]/media/route';
import { createAstroEndpoint } from '@/src/lib/astro-api-adapter';

export const ALL = createAstroEndpoint(route);
