'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getCategory3DImage } from '@/components/ui/category-icon';

export interface BackendCategoryItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CategoryCardData {
  title: string;
  subtitle?: string;
  link: string;
  image: string;
  badgeText?: string;
  bgColor?: string;
}

export interface OrganicCategoriesGridProps {
  categories?: BackendCategoryItem[];
  headingLine1?: string;
  headingLine2?: string;
  subheading?: string;
  mainCard?: CategoryCardData;
  topMiddleCard1?: CategoryCardData;
  topMiddleCard2?: CategoryCardData;
  bottomMiddleCard?: CategoryCardData;
  rightCard?: CategoryCardData;
  allCategoriesLink?: string;
  allCategoriesText?: string;
}

const DEFAULT_MAIN_CARD: CategoryCardData = {
  title: 'Gift Boxes & Combos',
  badgeText: 'FESTIVE SPECIALS',
  subtitle: 'Handpicked celebration boxes direct from Sivakasi!',
  link: '/category/gift-boxes',
  image: '/images/3d/cat-gift-boxes.jpg',
  bgColor: '#fef3c7',
};

const DEFAULT_TOP_MIDDLE_1: CategoryCardData = {
  title: 'Sparklers',
  badgeText: 'SPARKLERS',
  link: '/category/sparklers',
  image: '/images/3d/cat-sparklers.jpg',
};

const DEFAULT_TOP_MIDDLE_2: CategoryCardData = {
  title: 'Flower Pots',
  badgeText: 'FLOWER POTS',
  link: '/category/flower-pots',
  image: '/images/3d/cat-flower-pots.jpg',
};

const DEFAULT_BOTTOM_MIDDLE: CategoryCardData = {
  title: 'Sound Crackers',
  badgeText: 'SOUND CRACKERS',
  link: '/category/sound-crackers',
  image: '/images/3d/cat-sound-crackers.jpg',
};

const DEFAULT_RIGHT_CARD: CategoryCardData = {
  title: 'Rockets & Aerial',
  badgeText: 'ROCKETS',
  link: '/category/rockets',
  image: '/images/3d/cat-rockets.jpg',
};

export function OrganicCategoriesGrid({
  categories = [],
  headingLine1 = "EXPLORE OUR",
  headingLine2 = 'FIREWORKS',
  subheading = 'Discover authentic Sivakasi cracker categories & festive specials',
  mainCard,
  topMiddleCard1,
  topMiddleCard2,
  bottomMiddleCard,
  rightCard,
  allCategoriesLink = '/products',
  allCategoriesText = 'ALL CATEGORIES',
}: OrganicCategoriesGridProps) {
  // If live backend categories are provided, resolve cards dynamically
  const resolvedMainCard: CategoryCardData =
    mainCard ||
    (categories.length > 0
      ? {
          title: categories[0].name,
          badgeText: categories[0].name.toUpperCase(),
          subtitle: categories[0].description || 'Handcrafted celebration crackers from Sivakasi',
          link: `/category/${categories[0].slug}`,
          image: categories[0].image || getCategory3DImage(categories[0].name),
          bgColor: '#fef3c7',
        }
      : DEFAULT_MAIN_CARD);

  const resolvedTopMiddle1: CategoryCardData =
    topMiddleCard1 ||
    (categories.length > 1
      ? {
          title: categories[1].name,
          badgeText: categories[1].name.toUpperCase(),
          link: `/category/${categories[1].slug}`,
          image: categories[1].image || getCategory3DImage(categories[1].name),
        }
      : DEFAULT_TOP_MIDDLE_1);

  const resolvedTopMiddle2: CategoryCardData =
    topMiddleCard2 ||
    (categories.length > 2
      ? {
          title: categories[2].name,
          badgeText: categories[2].name.toUpperCase(),
          link: `/category/${categories[2].slug}`,
          image: categories[2].image || getCategory3DImage(categories[2].name),
        }
      : DEFAULT_TOP_MIDDLE_2);

  const resolvedBottomMiddle: CategoryCardData =
    bottomMiddleCard ||
    (categories.length > 3
      ? {
          title: categories[3].name,
          badgeText: categories[3].name.toUpperCase(),
          link: `/category/${categories[3].slug}`,
          image: categories[3].image || getCategory3DImage(categories[3].name),
        }
      : DEFAULT_BOTTOM_MIDDLE);

  const resolvedRightCard: CategoryCardData =
    rightCard ||
    (categories.length > 4
      ? {
          title: categories[4].name,
          badgeText: categories[4].name.toUpperCase(),
          link: `/category/${categories[4].slug}`,
          image: categories[4].image || getCategory3DImage(categories[4].name),
        }
      : DEFAULT_RIGHT_CARD);

  return (
    <section className="w-full py-4 sm:py-6 items-center justify-center lg:py-8">
      <div className="w-full px-3.5 sm:px-6 lg:px-10 xl:px-12 sm:max-w-[85%] lg:max-w-[80%] mx-auto">
        {/* ── 3-Column Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5">
          {/* ── 1. Left Main Promo Card ── */}
          <div className="md:col-span-2 lg:col-span-5">
            <Link
              href={resolvedMainCard.link}
              style={{ backgroundColor: resolvedMainCard.bgColor || '#fef3c7' }}
              className="group relative w-full h-[400px] sm:h-[460px] lg:h-[490px] rounded-[36px] sm:rounded-[40px] overflow-hidden p-6 sm:p-8 lg:p-10 flex flex-col justify-between select-none shadow-sm hover:shadow-xl transition-all duration-500 block"
            >
              {/* Background Image with Ambient Gradient */}
              <div className="absolute inset-0 z-0">
                <img
                  src={resolvedMainCard.image}
                  alt={resolvedMainCard.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#fef3c7]/95 via-[#fef3c7]/50 to-transparent pointer-events-none" />
              </div>

              {/* Text Header (Top Left) */}
              <div className="relative z-10 max-w-[90%]">
                <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-neutral-950 tracking-tight leading-[1.05] uppercase">
                  {headingLine1}
                  <br />
                  {headingLine2}
                </h2>
                <p className="text-neutral-800/90 font-medium text-sm sm:text-base mt-2 sm:mt-3">
                  {subheading}
                </p>
              </div>

              {/* Pill Button (Bottom Left) */}
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-950 text-white font-black text-xs sm:text-[13px] tracking-wider uppercase shadow-lg shadow-black/15 group-hover:scale-105 group-hover:bg-brand group-active:scale-95 transition-all duration-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  {resolvedMainCard.badgeText || resolvedMainCard.title}
                </span>
              </div>
            </Link>
          </div>

          {/* ── 2. Middle Stack (2 Top Square Cards + 1 Bottom Wide Card) ── */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-3.5 sm:gap-4 lg:gap-5 h-auto md:h-[400px] sm:md:h-[460px] lg:h-[490px]">
            {/* Top Row: 2 Cards Side-by-Side */}
            <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5 flex-1 min-h-[190px] sm:min-h-[220px]">
              {/* Card 1 */}
              <Link
                href={resolvedTopMiddle1.link}
                className="group relative w-full h-full min-h-[190px] sm:min-h-[220px] rounded-[28px] sm:rounded-[32px] overflow-hidden flex items-center justify-center select-none shadow-sm hover:shadow-xl transition-all duration-500 block"
              >
                <img
                  src={resolvedTopMiddle1.image}
                  alt={resolvedTopMiddle1.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                <span className="relative z-10 inline-flex items-center px-4 sm:px-5 py-2.5 rounded-full bg-neutral-950/90 backdrop-blur-xs text-white font-black text-[11px] sm:text-xs tracking-wider uppercase shadow-lg shadow-black/20 group-hover:scale-105 group-hover:bg-neutral-950 group-active:scale-95 transition-all duration-300">
                  {resolvedTopMiddle1.badgeText || resolvedTopMiddle1.title}
                </span>
              </Link>

              {/* Card 2 */}
              <Link
                href={resolvedTopMiddle2.link}
                className="group relative w-full h-full min-h-[190px] sm:min-h-[220px] rounded-[28px] sm:rounded-[32px] overflow-hidden flex items-center justify-center select-none shadow-sm hover:shadow-xl transition-all duration-500 block"
              >
                <img
                  src={resolvedTopMiddle2.image}
                  alt={resolvedTopMiddle2.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                <span className="relative z-10 inline-flex items-center px-4 sm:px-5 py-2.5 rounded-full bg-neutral-950/90 backdrop-blur-xs text-white font-black text-[11px] sm:text-xs tracking-wider uppercase shadow-lg shadow-black/20 group-hover:scale-105 group-hover:bg-neutral-950 group-active:scale-95 transition-all duration-300">
                  {resolvedTopMiddle2.badgeText || resolvedTopMiddle2.title}
                </span>
              </Link>
            </div>

            {/* Bottom Row: 1 Wide Card */}
            <div className="flex-1 min-h-[190px] sm:min-h-[220px]">
              <Link
                href={resolvedBottomMiddle.link}
                className="group relative w-full h-full min-h-[190px] sm:min-h-[220px] rounded-[28px] sm:rounded-[32px] overflow-hidden flex items-center justify-center select-none shadow-sm hover:shadow-xl transition-all duration-500 block"
              >
                <img
                  src={resolvedBottomMiddle.image}
                  alt={resolvedBottomMiddle.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                <span className="relative z-10 inline-flex items-center px-5 sm:px-6 py-2.5 rounded-full bg-neutral-950/90 backdrop-blur-xs text-white font-black text-xs sm:text-[13px] tracking-wider uppercase shadow-lg shadow-black/20 group-hover:scale-105 group-hover:bg-neutral-950 group-active:scale-95 transition-all duration-300">
                  {resolvedBottomMiddle.badgeText || resolvedBottomMiddle.title}
                </span>
              </Link>
            </div>
          </div>

          {/* ── 3. Right Tall Card ── */}
          <div className="md:col-span-1 lg:col-span-3">
            <Link
              href={resolvedRightCard.link}
              className="group relative w-full h-[380px] md:h-[400px] sm:md:h-[460px] lg:h-[490px] rounded-[36px] sm:rounded-[40px] overflow-hidden flex items-center justify-center select-none shadow-sm hover:shadow-xl transition-all duration-500 block"
            >
              <img
                src={resolvedRightCard.image}
                alt={resolvedRightCard.title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors duration-300" />
              <span className="relative z-10 inline-flex items-center px-5 sm:px-6 py-2.5 rounded-full bg-neutral-950/90 backdrop-blur-xs text-white font-black text-xs sm:text-[13px] tracking-wider uppercase shadow-lg shadow-black/20 group-hover:scale-105 group-hover:bg-neutral-950 group-active:scale-95 transition-all duration-300">
                {resolvedRightCard.badgeText || resolvedRightCard.title}
              </span>
            </Link>
          </div>
        </div>

        {/* ── 4. Bottom Centered CTA: ALL CATEGORIES ── */}
        <div className="mt-6 sm:mt-8 flex justify-center items-center">
          <Link
            href={allCategoriesLink}
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-white shadow-sm hover:shadow-lg transition-all duration-300 group select-none cursor-pointer"
          >
            <span className="font-extrabold text-xs sm:text-[13px] tracking-widest uppercase text-neutral-950">
              {allCategoriesText}
            </span>
            <span className="h-6.5 w-6.5 rounded-full bg-neutral-950 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
