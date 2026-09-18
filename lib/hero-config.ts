export interface HeroExploreCard {
  id: string;
  productId?: number;
  title: string;
  titleTa?: string;
  subtitle: string;
  subtitleTa?: string;
  link: string;
  image: string;
  bgColor: string;
}

export interface HeroSlide {
  id: string;
  headlineLine1: string;
  headlineLine1Ta?: string;
  headlineLine2: string;
  headlineLine2Ta?: string;
  headlineLine3: string;
  headlineLine3Ta?: string;
  subtitle: string;
  subtitleTa?: string;
  ctaText: string;
  ctaTextTa?: string;
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
  autoplayIntervalMs: 5000,
  slides: [
    {
      id: 'slide-1',
      headlineLine1: 'FESTIVE',
      headlineLine1Ta: 'உங்கள் தீபாவளி',
      headlineLine2: 'CELEBRATION',
      headlineLine2Ta: 'திருநாளை வண்ணமயமாக்கும்',
      headlineLine3: 'FIREWORKS',
      headlineLine3Ta: 'சிவகாசி பட்டாசுகள்',
      subtitle: 'Authentic Sivakasi celebration fireworks delivered direct to your door with certified wholesale pricing.',
      subtitleTa: 'சிவகாசியிலிருந்து நேரடியாகப் பெறப்படும் பாதுகாப்பான, வண்ணமயமான 100% அசல் பசுமை பட்டாசுகள். மலிவான மொத்த விலையில்.',
      ctaText: 'SEE PRODUCTS',
      ctaTextTa: 'பட்டாசுகளைப் பார்க்க',
      ctaLink: '/products',
      backgroundImage: '',
      bgColor: '#a6d7e7',
      card1: {
        id: 'card-1-1',
        title: 'Safe Sparklers',
        titleTa: 'சிறப்பு கம்பி மத்தாப்புகள்',
        subtitle: 'Explore',
        subtitleTa: 'பார்க்க',
        link: '/category/sparklers',
        image: '/images/hero/card-dried-fruits.jpg',
        bgColor: '#1e293b',
      },
      card2: {
        id: 'card-1-2',
        title: 'Assorted Gift Boxes',
        titleTa: 'தீபாவளி கிஃப்ட் பாக்ஸ்',
        subtitle: 'Explore',
        subtitleTa: 'பார்க்க',
        link: '/category/gift-boxes',
        image: '/images/hero/card-advent-calendar.jpg',
        bgColor: '#114b82',
      },
    },
    {
      id: 'slide-2',
      headlineLine1: 'AERIAL',
      headlineLine1Ta: 'நேரடி சிவகாசி',
      headlineLine2: 'SKY SHOTS',
      headlineLine2Ta: 'பிரம்மாண்ட வான்வெடி',
      headlineLine3: 'SPECTACLE',
      headlineLine3Ta: 'சிறப்பு காம்போ',
      subtitle: 'Hand-crafted multi-color aerial cakes, repeaters, and vibrant flower pots tested for maximum festive sparkle.',
      subtitleTa: '25+ வகையான வான்வெளி வெடிகள் மற்றும் வண்ணப் பூந்தொட்டிகள் அடங்கிய சிறப்பு மெகா தீபாவளி பேக்.',
      ctaText: 'EXPLORE AERIAL',
      ctaTextTa: 'வான்வெடிகள் பார்க்க',
      ctaLink: '/products?featured=true',
      backgroundImage: '',
      bgColor: '#bfe5da',
      card1: {
        id: 'card-2-1',
        title: 'Multi-Color Sky Bursts',
        titleTa: '120 ஷாட்ஸ் வான்வெடி',
        subtitle: 'Explore',
        subtitleTa: 'பார்க்க',
        link: '/products',
        image: '/images/hero/thumb-dates.jpg',
        bgColor: '#1e6a39',
      },
      card2: {
        id: 'card-2-2',
        title: 'Family Celebration Box',
        titleTa: 'மெகா பேமிலி பேக்',
        subtitle: 'Explore',
        subtitleTa: 'பார்க்க',
        link: '/products',
        image: '/images/hero/thumb-matcha.jpg',
        bgColor: '#0f5132',
      },
    },
    {
      id: 'slide-3',
      headlineLine1: '100% SAFE',
      headlineLine1Ta: '100% பாதுகாப்பான',
      headlineLine2: 'CERTIFIED GREEN',
      headlineLine2Ta: 'பசுமை பட்டாசு',
      headlineLine3: 'CRACKERS',
      headlineLine3Ta: 'மொத்த விற்பனை',
      subtitle: 'Certified green fireworks with low emissions, tested safety standards, and direct factory packaging.',
      subtitleTa: 'அரசு அங்கீகாரம் பெற்ற பசுமை பட்டாசுகள், குறைந்த புகை மற்றும் அதிக பிரகாசத்துடன் உங்கள் கொண்டாட்டத்திற்கு.',
      ctaText: 'DISCOVER GREEN',
      ctaTextTa: 'பசுமை பட்டாசுகள்',
      ctaLink: '/products?certified=green',
      backgroundImage: '',
      bgColor: '#fed7aa',
      card1: {
        id: 'card-3-1',
        title: 'Vibrant Flower Pots',
        titleTa: 'வண்ணப் பூந்தொட்டி',
        subtitle: 'Explore',
        subtitleTa: 'பார்க்க',
        link: '/category/flower-pots',
        image: '/images/hero/thumb-red-berries.jpg',
        bgColor: '#0f172a',
      },
      card2: {
        id: 'card-3-2',
        title: 'High Speed Chakras',
        titleTa: 'அதிவேக சக்கரம்',
        subtitle: 'Explore',
        subtitleTa: 'பார்க்க',
        link: '/category/chakras',
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
