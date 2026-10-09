import { describe, it, expect } from 'vitest';
import { parseHeroConfig, DEFAULT_HERO_CONFIG, type HeroSettingsConfig } from '@/lib/hero-config';

describe('Hero Carousel Heading Color Configuration', () => {
  it('uses default fallback heading color when raw JSON is empty', () => {
    const config = parseHeroConfig(null);
    expect(config.defaultHeadingColor).toBe('#0a0a0a');
    expect(config.slides[0].headingColor).toBeUndefined();
  });

  it('parses custom heading color per slide from JSON', () => {
    const customConfig: HeroSettingsConfig = {
      autoplayIntervalMs: 5000,
      defaultHeadingColor: '#e24000',
      slides: [
        {
          ...DEFAULT_HERO_CONFIG.slides[0],
          id: 'slide-1',
          headingColor: '#ff0055',
        },
        {
          ...DEFAULT_HERO_CONFIG.slides[1],
          id: 'slide-2',
          headingColor: '#00ffcc',
        },
      ],
    };

    const parsed = parseHeroConfig(JSON.stringify(customConfig));
    expect(parsed.defaultHeadingColor).toBe('#e24000');
    expect(parsed.slides[0].headingColor).toBe('#ff0055');
    expect(parsed.slides[1].headingColor).toBe('#00ffcc');
  });

  it('handles slide without headingColor by keeping it undefined for global default fallback', () => {
    const rawJson = JSON.stringify({
      autoplayIntervalMs: 4000,
      defaultHeadingColor: '#1e3a8a',
      slides: [
        {
          ...DEFAULT_HERO_CONFIG.slides[0],
          id: 'slide-plain',
          headingColor: '', // empty string should be sanitized to undefined
        },
      ],
    });

    const parsed = parseHeroConfig(rawJson);
    expect(parsed.defaultHeadingColor).toBe('#1e3a8a');
    expect(parsed.slides[0].headingColor).toBeUndefined();
  });
});
