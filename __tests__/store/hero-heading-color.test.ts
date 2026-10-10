import { describe, it, expect } from 'vitest';
import { parseHeroConfig, DEFAULT_HERO_CONFIG, type HeroSettingsConfig } from '@/lib/hero-config';

describe('Hero Carousel Heading & Description Color Configuration', () => {
  it('uses default fallback heading and description color when raw JSON is empty', () => {
    const config = parseHeroConfig(null);
    expect(config.defaultHeadingColor).toBe('#0a0a0a');
    expect(config.defaultDescriptionColor).toBe('#262626');
    expect(config.slides[0].headingColor).toBeUndefined();
    expect(config.slides[0].descriptionColor).toBeUndefined();
  });

  it('parses custom heading and description color per slide from JSON', () => {
    const customConfig: HeroSettingsConfig = {
      autoplayIntervalMs: 5000,
      defaultHeadingColor: '#e24000',
      defaultDescriptionColor: '#475569',
      slides: [
        {
          ...DEFAULT_HERO_CONFIG.slides[0],
          id: 'slide-1',
          headingColor: '#ff0055',
          descriptionColor: '#ffffff',
        },
        {
          ...DEFAULT_HERO_CONFIG.slides[1],
          id: 'slide-2',
          headingColor: '#00ffcc',
          descriptionColor: '#d97706',
        },
      ],
    };

    const parsed = parseHeroConfig(JSON.stringify(customConfig));
    expect(parsed.defaultHeadingColor).toBe('#e24000');
    expect(parsed.defaultDescriptionColor).toBe('#475569');
    expect(parsed.slides[0].headingColor).toBe('#ff0055');
    expect(parsed.slides[0].descriptionColor).toBe('#ffffff');
    expect(parsed.slides[1].headingColor).toBe('#00ffcc');
    expect(parsed.slides[1].descriptionColor).toBe('#d97706');
  });

  it('handles slide without colors by keeping them undefined for global default fallback', () => {
    const rawJson = JSON.stringify({
      autoplayIntervalMs: 4000,
      defaultHeadingColor: '#1e3a8a',
      defaultDescriptionColor: '#18181b',
      slides: [
        {
          ...DEFAULT_HERO_CONFIG.slides[0],
          id: 'slide-plain',
          headingColor: '', // empty string sanitized to undefined
          descriptionColor: '', // empty string sanitized to undefined
        },
      ],
    });

    const parsed = parseHeroConfig(rawJson);
    expect(parsed.defaultHeadingColor).toBe('#1e3a8a');
    expect(parsed.defaultDescriptionColor).toBe('#18181b');
    expect(parsed.slides[0].headingColor).toBeUndefined();
    expect(parsed.slides[0].descriptionColor).toBeUndefined();
  });
});
