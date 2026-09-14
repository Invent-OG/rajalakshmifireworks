import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { PriceListBrochure } from '@/components/store/price-list-brochure';
import { isValidLocale, Locale } from '@/lib/i18n/config';
import { getTranslations } from '@/lib/i18n/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { APP_CONFIG } from '@/lib/constants/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale, 'navigation');

  return {
    title: `${t('priceList')} | ${APP_CONFIG.STORE_NAME} Sivakasi`,
    description: `Official ${new Date().getFullYear()} Diwali fireworks price list and wholesale catalog from ${APP_CONFIG.STORE_NAME}, Sivakasi. Download complete PDF & Excel catalog with factory direct discounts.`,
  };
}

export default async function PriceListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  // Fetch all active categories with their active products and media
  const categoriesData = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
    with: {
      products: {
        where: and(eq(products.isActive, true), eq(products.isCombo, false)),
        orderBy: [asc(products.sellingPrice), asc(products.name)],
        with: {
          media: {
            orderBy: (m, { asc }) => [asc(m.sortOrder)],
            limit: 1,
          },
        },
      },
    },
  });

  // Fetch all active combo products with their media and included items
  const combosData = await db.query.products.findMany({
    where: and(eq(products.isActive, true), eq(products.isCombo, true)),
    orderBy: [asc(products.sellingPrice)],
    with: {
      media: {
        orderBy: (m, { asc }) => [asc(m.sortOrder)],
        limit: 1,
      },
      comboItems: {
        with: {
          product: true,
        },
      },
    },
  });

  return (
    <main className="w-full pb-16">
      <PriceListBrochure
        categories={categoriesData}
        combos={combosData as any}
      />
    </main>
  );
}
