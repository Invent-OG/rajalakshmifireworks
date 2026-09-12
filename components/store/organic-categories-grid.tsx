'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getCategory3DImage } from '@/components/ui/category-icon';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { getLocalizedName, getLocalizedDescription } from '@/lib/i18n/formatters';

export interface BackendCategoryItem {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  description?: string | null;
  descriptionTa?: string | null;
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

export function OrganicCategoriesGrid({
  categories = [],
  headingLine1,
  headingLine2,
  subheading,
  mainCard,
  topMiddleCard1,
  topMiddleCard2,
  bottomMiddleCard,
  rightCard,
  allCategoriesLink = '/products',
  allCategoriesText,
}: OrganicCategoriesGridProps) {
  const locale = useLocale();
  const tCat = useTranslations('categories');
  const tNav = useTranslations('navigation');

  const finalHeading1 = headingLine1 || (locale === 'ta' ? 'அனைத்து வகை' : 'EXPLORE OUR');
  const finalHeading2 = headingLine2 || (locale === 'ta' ? 'சிவகாசி பட்டாசுகள்' : 'FIREWORKS');
  const finalSubheading = subheading || (locale === 'ta'
    ? 'குழந்தைகளுக்கான கம்பி மத்தாப்பு முதல் வான்வெளி வெடிகள் வரை அனைத்து ரகங்களும்'
    : 'Discover authentic Sivakasi cracker categories & festive specials');
  const finalAllCategoriesText = allCategoriesText || (locale === 'ta' ? 'அனைத்து வகைகள்' : 'ALL CATEGORIES');

  // If live backend categories are provided, resolve cards dynamically
  const resolvedMainCard: CategoryCardData =
    mainCard ||
    (categories.length > 0
      ? {
          title: getLocalizedName(categories[0], locale),
          badgeText: getLocalizedName(categories[0], locale).toUpperCase(),
          subtitle: getLocalizedDescription(categories[0], locale) || (locale === 'ta' ? 'சிவகாசி நேரடி சிறப்பு பட்டாசு தயாரிப்புகள்' : 'Handcrafted celebration crackers from Sivakasi'),
          link: `/category/${categories[0].slug}`,
          image: categories[0].image || getCategory3DImage(categories[0].name),
          bgColor: '#fef3c7',
        }
      : {
          title: locale === 'ta' ? 'கிஃப்ட் பாக்ஸ் & காம்போ' : 'Gift Boxes & Combos',
          badgeText: locale === 'ta' ? 'சிறப்பு காம்போ' : 'FESTIVE SPECIALS',
          subtitle: locale === 'ta' ? 'சிவகாசியிலிருந்து நேரடியாகப் பெறப்படும் குடும்ப காம்போ பேக்!' : 'Handpicked celebration boxes direct from Sivakasi!',
          link: '/category/gift-boxes',
          image: '/images/3d/cat-gift-boxes.jpg',
          bgColor: '#fef3c7',
        });

  const resolvedTopMiddle1: CategoryCardData =
    topMiddleCard1 ||
    (categories.length > 1
      ? {
          title: getLocalizedName(categories[1], locale),
          badgeText: getLocalizedName(categories[1], locale).toUpperCase(),
          link: `/category/${categories[1].slug}`,
          image: categories[1].image || getCategory3DImage(categories[1].name),
        }
      : {
          title: locale === 'ta' ? 'கம்பி மத்தாப்பு' : 'Sparklers',
          badgeText: locale === 'ta' ? 'மத்தாப்பு' : 'SPARKLERS',
          link: '/category/sparklers',
          image: '/images/3d/cat-sparklers.jpg',
        });

  const resolvedTopMiddle2: CategoryCardData =
    topMiddleCard2 ||
    (categories.length > 2
      ? {
          title: getLocalizedName(categories[2], locale),
          badgeText: getLocalizedName(categories[2], locale).toUpperCase(),
          link: `/category/${categories[2].slug}`,
          image: categories[2].image || getCategory3DImage(categories[2].name),
        }
      : {
          title: locale === 'ta' ? 'பூந்தொட்டி' : 'Flower Pots',
          badgeText: locale === 'ta' ? 'பூந்தொட்டி' : 'FLOWER POTS',
          link: '/category/flower-pots',
          image: '/images/3d/cat-flower-pots.jpg',
        });

  const resolvedBottomMiddle: CategoryCardData =
    bottomMiddleCard ||
    (categories.length > 3
      ? {
          title: getLocalizedName(categories[3], locale),
          badgeText: getLocalizedName(categories[3], locale).toUpperCase(),
          link: `/category/${categories[3].slug}`,
          image: categories[3].image || getCategory3DImage(categories[3].name),
        }
      : {
          title: locale === 'ta' ? 'சரவெடி & வெடி' : 'Sound Crackers',
          badgeText: locale === 'ta' ? 'சரவெடி' : 'SOUND CRACKERS',
          link: '/category/sound-crackers',
          image: '/images/3d/cat-sound-crackers.jpg',
        });

  const resolvedRightCard: CategoryCardData =
    rightCard ||
    (categories.length > 4
      ? {
          title: getLocalizedName(categories[4], locale),
          badgeText: getLocalizedName(categories[4], locale).toUpperCase(),
          link: `/category/${categories[4].slug}`,
          image: categories[4].image || getCategory3DImage(categories[4].name),
        }
      : {
          title: locale === 'ta' ? 'ராக்கெட் & ஃபேன்ஸி' : 'Rockets & Aerial',
          badgeText: locale === 'ta' ? 'ராக்கெட்' : 'ROCKETS',
          link: '/category/rockets',
          image: '/images/3d/cat-rockets.jpg',
        });

  return (
    <section className="w-full py-4 sm:py-6 items-center justify-center lg:py-8">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 md:px-[80px]">
        {/* ── 3-Column Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-[20px] md:gap-[32px]">
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
                  {finalHeading1}
                  <br />
                  {finalHeading2}
                </h2>
                <p className="text-neutral-800/90 font-medium text-sm sm:text-base mt-2 sm:mt-3">
                  {finalSubheading}
                </p>
              </div>

              {/* Pill Button (Bottom Left) */}
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-950 text-white font-black text-xs sm:text-[13px] tracking-wider uppercase shadow-lg shadow-black/15 group-hover:scale-105 group-hover:bg-neutral-800 group-active:scale-95 transition-all duration-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  {resolvedMainCard.badgeText || resolvedMainCard.title}
                </span>
              </div>
            </Link>
          </div>

          {/* ── 2. Middle Stack (2 Top Square Cards + 1 Bottom Wide Card) ── */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-[20px] md:gap-[32px] h-auto md:h-[400px] sm:md:h-[460px] lg:h-[490px]">
            {/* Top Row: 2 Cards Side-by-Side */}
            <div className="grid grid-cols-2 gap-[20px] md:gap-[32px] flex-1 min-h-[190px] sm:min-h-[220px]">
              {/* Card 1 */}
              <Link
                href={resolvedTopMiddle1.link}
                className="group relative w-full h-full min-h-[190px] sm:min-h-[220px] rounded-[28px] sm:rounded-[36px] overflow-hidden flex items-center justify-center select-none shadow-sm hover:shadow-xl transition-all duration-500 block"
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
                className="group relative w-full h-full min-h-[190px] sm:min-h-[220px] rounded-[28px] sm:rounded-[36px] overflow-hidden flex items-center justify-center select-none shadow-sm hover:shadow-xl transition-all duration-500 block"
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
                className="group relative w-full h-full min-h-[190px] sm:min-h-[220px] rounded-[28px] sm:rounded-[36px] overflow-hidden flex items-center justify-center select-none shadow-sm hover:shadow-xl transition-all duration-500 block"
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
        <div className="mt-8 md:mt-[48px] flex justify-center items-center">
          <Link
            href={allCategoriesLink}
            className="inline-flex items-center gap-3 h-12 px-8 rounded-full bg-white shadow-sm hover:shadow-lg transition-all duration-300 group select-none cursor-pointer"
          >
            <span className="font-extrabold text-xs sm:text-[13px] tracking-widest uppercase text-neutral-950">
              {finalAllCategoriesText}
            </span>
            <span className="h-7 w-7 rounded-full bg-neutral-950 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
