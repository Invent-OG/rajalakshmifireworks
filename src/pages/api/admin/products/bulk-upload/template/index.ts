import * as route from '@/app/api/admin/products/bulk-upload/template/route';
import { createAstroEndpoint } from '@/src/lib/astro-api-adapter';

export const ALL = createAstroEndpoint(route);
