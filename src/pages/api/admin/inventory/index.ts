import * as route from '@/app/api/admin/inventory/route';
import { createAstroEndpoint } from '@/src/lib/astro-api-adapter';

export const ALL = createAstroEndpoint(route);
