import { MetadataRoute } from 'next';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rajalakshmifireworks.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [allCategories, allProducts] = await Promise.all([
      db.query.categories.findMany({ where: eq(categories.isActive, true) }),
      db.query.products.findMany({ where: eq(products.isActive, true) }),
    ]);

    const categoryEntries: MetadataRoute.Sitemap = allCategories.map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const productEntries: MetadataRoute.Sitemap = allProducts.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticPages, ...categoryEntries, ...productEntries];
  } catch {
    return staticPages;
  }
}
