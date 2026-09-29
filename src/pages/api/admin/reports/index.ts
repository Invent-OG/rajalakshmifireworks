import * as route from '@/app/api/admin/reports/route';
import { createAstroEndpoint } from '@/src/lib/astro-api-adapter';

export const ALL = createAstroEndpoint(route);
