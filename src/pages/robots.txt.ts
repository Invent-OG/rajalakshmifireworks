import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rajalakshmifireworks.com';
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
