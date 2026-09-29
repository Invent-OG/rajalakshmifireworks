import { wrapHandler } from '@/src/lib/astro-api';
import { clearSessionCookie } from '@/lib/auth/session';

async function _POST() {
  await clearSessionCookie();
  return Response.json({ success: true });
}


// Native Astro APIRoute exports
export const POST = wrapHandler(_POST);
