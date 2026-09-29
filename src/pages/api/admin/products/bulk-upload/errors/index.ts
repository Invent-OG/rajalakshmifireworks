import * as route from '@/app/api/admin/products/bulk-upload/errors/route';
import { createAstroEndpoint } from '@/src/lib/astro-api-adapter';

export const ALL = createAstroEndpoint(route);
