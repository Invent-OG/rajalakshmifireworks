export interface HeroExploreCard {
  id: string;
  productId?: number;
  title: string;
  subtitle: string;
  link: string;
  image: string;
  bgColor: string;
}

export interface HeroSlide {
  id: string;
  headlineLine1: string;
  headlineLine2: string;
  headlineLine3: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
  bgImageOpacity?: number;
  bgColor: string;
  card1: HeroExploreCard;
  card2: HeroExploreCard;
}

export interface HeroSettingsConfig {
  slides: HeroSlide[];
  autoplayIntervalMs: number;
}

export const DEFAULT_HERO_CONFIG: HeroSettingsConfig = {
  autoplayIntervalMs: 6000,
  slides: [
    {
      id: 'slide-1',
      headlineLine1: 'ORGANIC',
      headlineLine2: 'COMES',
      headlineLine3: 'KNOCKING',
      subtitle: 'Our new nuts are the best food for your health. Choose your favourite!',
      ctaText: 'SEE PRODUCTS',
      ctaLink: '/products',
      backgroundImage: '',
      bgColor: '#a6d7e7',
      card1: {
        id: 'card-1-1',
        title: 'Dried fruits',
        subtitle: 'Explore',
        link: '/products',
        image: '/images/hero/card-dried-fruits.jpg',
        bgColor: '#b5144f',
      },
      card2: {
        id: 'card-1-2',
        title: 'Advent Calendars',
        subtitle: 'Explore',
        link: '/products',
        image: '/images/hero/card-advent-calendar.jpg',
        bgColor: '#114b82',
      },
    },
    {
      id: 'slide-2',
      headlineLine1: 'CREAMY',
      headlineLine2: 'PISTACHIO',
      headlineLine3: 'CRUNCH',
      subtitle: 'Stone ground organic pistachio spread with aromatic green cardamom. Pure artisanal joy.',
      ctaText: 'SHOP PISTACHIO',
      ctaLink: '/products',
      backgroundImage: '',
      bgColor: '#bfe5da',
      card1: {
        id: 'card-2-1',
        title: 'Nut Butters',
        subtitle: 'Explore',
        link: '/products',
        image: '/images/hero/thumb-dates.jpg',
        bgColor: '#1e6a39',
      },
      card2: {
        id: 'card-2-2',
        title: 'Matcha Blends',
        subtitle: 'Explore',
        link: '/products',
        image: '/images/hero/thumb-matcha.jpg',
        bgColor: '#0f5132',
      },
    },
    {
      id: 'slide-3',
      headlineLine1: 'NOUVEAU',
      headlineLine2: 'CACAO',
      headlineLine3: 'BLISS',
      subtitle: 'Artisanal roasted Italian hazelnuts infused with pure organic cocoa & delicate sea salt.',
      ctaText: 'DISCOVER CACAO',
      ctaLink: '/products',
      backgroundImage: '',
      bgColor: '#fed7aa',
      card1: {
        id: 'card-3-1',
        title: 'Superfoods',
        subtitle: 'Explore',
        link: '/products',
        image: '/images/hero/thumb-red-berries.jpg',
        bgColor: '#991b1b',
      },
      card2: {
        id: 'card-3-2',
        title: 'Golden Honey',
        subtitle: 'Explore',
        link: '/products',
        image: '/images/hero/thumb-honey.jpg',
        bgColor: '#92400e',
      },
    },
  ],
};

export function parseHeroConfig(rawJson?: string | null): HeroSettingsConfig {
  if (!rawJson) return DEFAULT_HERO_CONFIG;
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_HERO_CONFIG;
    return {
      autoplayIntervalMs:
        typeof parsed.autoplayIntervalMs === 'number'
          ? parsed.autoplayIntervalMs
          : DEFAULT_HERO_CONFIG.autoplayIntervalMs,
      slides:
        Array.isArray(parsed.slides) && parsed.slides.length > 0
          ? parsed.slides
          : DEFAULT_HERO_CONFIG.slides,
    };
  } catch (err) {
    console.error('Failed to parse hero settings JSON, using default:', err);
    return DEFAULT_HERO_CONFIG;
  }
}
