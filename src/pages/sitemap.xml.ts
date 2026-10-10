import type { APIRoute } from 'astro';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rajalakshmifireworks.com';

  let categoryEntries: { url: string; lastModified: Date; priority: number }[] = [];
  let productEntries: { url: string; lastModified: Date; priority: number }[] = [];

  try {
    const [allCategories, allProducts] = await Promise.all([
      db.query.categories.findMany({ where: eq(categories.isActive, true) }),
      db.query.products.findMany({ where: eq(products.isActive, true) }),
    ]);

    categoryEntries = allCategories.map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: c.updatedAt || new Date(),
      priority: 0.8,
    }));

    productEntries = allProducts.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt || new Date(),
      priority: 0.7,
    }));
  } catch (err) {
    console.error('Error generating sitemap:', err);
  }

  const staticUrls = [
    { url: `${baseUrl}`, priority: 1.0 },
    { url: `${baseUrl}/products`, priority: 0.9 },
    { url: `${baseUrl}/about`, priority: 0.8 },
    { url: `${baseUrl}/quick-order`, priority: 0.8 },
    { url: `${baseUrl}/track-order`, priority: 0.5 },
  ];

  const allUrls = [
    ...staticUrls.map((s) => `  <url>
    <loc>${s.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>${s.priority}</priority>
  </url>`),
    ...categoryEntries.map((c) => `  <url>
    <loc>${c.url}</loc>
    <lastmod>${c.lastModified.toISOString()}</lastmod>
    <priority>${c.priority}</priority>
  </url>`),
    ...productEntries.map((p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastModified.toISOString()}</lastmod>
    <priority>${p.priority}</priority>
  </url>`),
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
