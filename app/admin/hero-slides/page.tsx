'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Eye,
  Sliders,
  Palette,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  Loader2,
  ShoppingBag,
  ExternalLink,
  CloudUpload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  HeroSettingsConfig,
  HeroSlide,
  DEFAULT_HERO_CONFIG,
  parseHeroConfig,
} from '@/lib/hero-config';
import { OrganicHero } from '@/components/store/organic-hero';

const COLOR_PRESETS = [
  { label: 'Sky Powder Blue', hex: '#a6d7e7' },
  { label: 'Sage Mint', hex: '#bfe5da' },
  { label: 'Peach Coral', hex: '#fed7aa' },
  { label: 'Pastel Blush Pink', hex: '#fbcfe8' },
  { label: 'Soft Lavender', hex: '#e9d5ff' },
  { label: 'Sunny Butter', hex: '#fef08a' },
  { label: 'Clean Ice Slate', hex: '#e2e8f0' },
];

const CARD_COLOR_PRESETS = [
  { label: 'Berry Magenta', hex: '#b5144f' },
  { label: 'Navy Sapphire', hex: '#114b82' },
  { label: 'Emerald Forest', hex: '#1e6a39' },
  { label: 'Dark Pine', hex: '#0f5132' },
  { label: 'Crimson Ruby', hex: '#991b1b' },
  { label: 'Amber Bronze', hex: '#92400e' },
  { label: 'Deep Plum', hex: '#581c87' },
  { label: 'Obsidian Black', hex: '#18181b' },
];

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  sellingPrice: string | number;
  category?: { name: string };
  media?: { url: string }[];
}

export default function AdminHeroSlidesPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<HeroSettingsConfig>(DEFAULT_HERO_CONFIG);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'slides' | 'settings'>('slides');
  const [initialized, setInitialized] = useState(false);
  
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingCard1, setUploadingCard1] = useState(false);
  const [uploadingCard2, setUploadingCard2] = useState(false);

  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const card1FileInputRef = useRef<HTMLInputElement>(null);
  const card2FileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Settings
  const { isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json?.settings && !initialized) {
        const rawJson = json.settings.HERO_SLIDES_CONFIG;
        const parsed = parseHeroConfig(rawJson);
        setConfig(parsed);
        setInitialized(true);
      }
      return json;
    },
  });

  // Fetch Store Products for quick selection in Stacked Cards
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['admin', 'products-list-for-hero'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=100');
      const json = await res.json();
      return (json?.products || []) as ProductItem[];
    },
  });

  const productList = productsData || [];

  const saveMutation = useMutation({
    mutationFn: async (updatedConfig: HeroSettingsConfig) => {
      const payload = {
        HERO_SLIDES_CONFIG: JSON.stringify(updatedConfig),
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to save hero slides');
      return resData;
    },
    onSuccess: () => {
      toast.success('Hero carousel configuration saved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const activeSlide = config.slides[activeSlideIndex] || config.slides[0];

  const updateActiveSlide = (fields: Partial<HeroSlide>) => {
    setConfig((prev) => {
      const newSlides = [...prev.slides];
      newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], ...fields };
      return { ...prev, slides: newSlides };
    });
  };

  // Upload handler for Supabase storage
  async function handleFileUpload(file: File, target: 'bg' | 'card1' | 'card2') {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    if (target === 'bg') setUploadingBg(true);
    else if (target === 'card1') setUploadingCard1(true);
    else if (target === 'card2') setUploadingCard2(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload to Supabase');
      }

      if (target === 'bg') {
        updateActiveSlide({ backgroundImage: data.url });
        toast.success('Hero background image uploaded to Supabase Storage!');
      } else if (target === 'card1') {
        updateActiveSlide({
          card1: { ...activeSlide.card1, image: data.url },
        });
        toast.success('Card 1 image uploaded to Supabase Storage!');
      } else if (target === 'card2') {
        updateActiveSlide({
          card2: { ...activeSlide.card2, image: data.url },
        });
        toast.success('Card 2 image uploaded to Supabase Storage!');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Image upload failed');
    } finally {
      if (target === 'bg') setUploadingBg(false);
      else if (target === 'card1') setUploadingCard1(false);
      else if (target === 'card2') setUploadingCard2(false);
    }
  }

  // When a product is selected for Card 1 or Card 2
  const handleSelectProduct = (
    productIdStr: string,
    targetCard: 'card1' | 'card2'
  ) => {
    if (!productIdStr) return;
    const prodId = parseInt(productIdStr, 10);
    const prod = productList.find((p) => p.id === prodId);
    if (!prod) return;

    const prodImage = prod.media?.[0]?.url || '/images/hero/card-dried-fruits.jpg';
    const prodLink = `/product/${prod.slug}`;
    const prodSubtitle = `₹${prod.sellingPrice} • Shop Now`;

    if (targetCard === 'card1') {
      updateActiveSlide({
        card1: {
          ...activeSlide.card1,
          productId: prod.id,
          title: prod.name,
          subtitle: prodSubtitle,
          link: prodLink,
          image: prodImage,
        },
      });
      toast.success(`Attached "${prod.name}" to Card 1`);
    } else {
      updateActiveSlide({
        card2: {
          ...activeSlide.card2,
          productId: prod.id,
          title: prod.name,
          subtitle: prodSubtitle,
          link: prodLink,
          image: prodImage,
        },
      });
      toast.success(`Attached "${prod.name}" to Card 2`);
    }
  };

  const handleAddNewSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      headlineLine1: 'NEW',
      headlineLine2: 'SEASON',
      headlineLine3: 'ARRIVAL',
      subtitle: 'Discover our newest batch of handcrafted organic delicacies.',
      ctaText: 'EXPLORE NOW',
      ctaLink: '/products',
      backgroundImage: '',
      bgColor: '#bfe5da',
      card1: {
        id: `card-${Date.now()}-1`,
        title: 'Featured Product',
        subtitle: 'Shop Now',
        link: '/products',
        image: '/images/hero/thumb-red-berries.jpg',
        bgColor: '#b5144f',
      },
      card2: {
        id: `card-${Date.now()}-2`,
        title: 'Popular Special',
        subtitle: 'Shop Now',
        link: '/products',
        image: '/images/hero/card-advent-calendar.jpg',
        bgColor: '#114b82',
      },
    };
    setConfig((prev) => ({ ...prev, slides: [...prev.slides, newSlide] }));
    setActiveSlideIndex(config.slides.length);
    toast.info('New slide added');
  };

  const handleDeleteSlide = (idx: number) => {
    if (config.slides.length <= 1) {
      toast.error('You must keep at least 1 slide.');
      return;
    }
    setConfig((prev) => {
      const newSlides = prev.slides.filter((_, i) => i !== idx);
      return { ...prev, slides: newSlides };
    });
    setActiveSlideIndex((prev) => Math.max(0, Math.min(prev, config.slides.length - 2)));
    toast.info('Slide removed');
  };

  const moveSlide = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= config.slides.length) return;
    setConfig((prev) => {
      const newSlides = [...prev.slides];
      const [moved] = newSlides.splice(fromIdx, 1);
      newSlides.splice(toIdx, 0, moved);
      return { ...prev, slides: newSlides };
    });
    setActiveSlideIndex(toIdx);
  };

  const resetToDefaults = () => {
    if (confirm('Reset hero carousel to factory default slides?')) {
      setConfig(DEFAULT_HERO_CONFIG);
      setActiveSlideIndex(0);
      toast.info('Reset to default template');
    }
  };

  if (isLoadingSettings && !initialized) {
    return (
      <div className="max-w-6xl space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* Hidden file inputs for Supabase uploads */}
      <input
        type="file"
        ref={bgFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'bg');
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={card1FileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'card1');
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={card2FileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'card2');
          e.target.value = '';
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Storefront Visual Director</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Hero Carousel Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize slide headlines, background themes & images, CTA buttons, and select products for the stacked explore cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>

          <Button
            onClick={() => saveMutation.mutate(config)}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-white font-bold"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      {/* ── Live Interactive Preview ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Eye className="h-4 w-4 text-brand" />
            <span>Live Interactive Preview</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Reflects actual customer storefront appearance in real time
          </span>
        </div>

        <div className="border border-border rounded-3xl overflow-hidden bg-background p-2 sm:p-4 shadow-sm">
          <OrganicHero initialConfig={config} />
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('slides')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'slides'
              ? 'bg-foreground text-background shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Slides Manager ({config.slides.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'settings'
              ? 'bg-foreground text-background shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Carousel Timing & Controls
        </button>
      </div>

      {/* ── Tab Content: Slides Manager ── */}
      {activeTab === 'slides' && (
        <div className="space-y-6">
          {/* Slide Switcher Strip */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {config.slides.map((s, idx) => (
                <div key={s.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                      activeSlideIndex === idx
                        ? 'border-brand bg-brand/10 text-brand shadow-xs'
                        : 'border-border bg-card text-foreground hover:border-neutral-400'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: s.bgColor }}
                    />
                    <span>Slide {idx + 1}</span>
                    <span className="text-muted-foreground font-normal truncate max-w-[90px]">
                      ({s.headlineLine1})
                    </span>
                  </button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddNewSlide}
                className="flex items-center gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Slide
              </Button>
            </div>

            {/* Slide Action Controls */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveSlide(activeSlideIndex, activeSlideIndex - 1)}
                disabled={activeSlideIndex === 0}
                title="Move Slide Left"
              >
                <MoveUp className="h-3.5 w-3.5 rotate-[-90deg]" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveSlide(activeSlideIndex, activeSlideIndex + 1)}
                disabled={activeSlideIndex === config.slides.length - 1}
                title="Move Slide Right"
              >
                <MoveDown className="h-3.5 w-3.5 rotate-[-90deg]" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteSlide(activeSlideIndex)}
                disabled={config.slides.length <= 1}
                title="Delete this slide"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Active Slide Form Card */}
          {activeSlide && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xs">
              
              {/* Left Column: Background Theme & Typography */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Hero Background Image & Color */}
                <div className="p-4 rounded-xl bg-background-secondary border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-brand" />
                      Hero Background Image & Theme
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CloudUpload className="h-3 w-3" /> Supabase Storage
                    </span>
                  </div>

                  {/* Upload button & preview */}
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={uploadingBg}
                      onClick={() => bgFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs font-bold"
                    >
                      {uploadingBg ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Uploading to Supabase...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          Upload Background Image
                        </>
                      )}
                    </Button>

                    {activeSlide.backgroundImage && (
                      <button
                        type="button"
                        onClick={() => updateActiveSlide({ backgroundImage: '' })}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  <Input
                    value={activeSlide.backgroundImage || ''}
                    onChange={(e) => updateActiveSlide({ backgroundImage: e.target.value })}
                    placeholder="Background image URL (e.g. https://...)"
                    className="text-xs font-mono"
                  />

                  {/* Base Color Picker */}
                  <div className="pt-2 border-t border-border">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-2">
                      Base Background Color
                    </label>
                    <div className="flex items-center gap-3 mb-2.5">
                      <input
                        type="color"
                        value={activeSlide.bgColor}
                        onChange={(e) => updateActiveSlide({ bgColor: e.target.value })}
                        className="h-8 w-12 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                      />
                      <Input
                        value={activeSlide.bgColor}
                        onChange={(e) => updateActiveSlide({ bgColor: e.target.value })}
                        placeholder="#a6d7e7"
                        className="max-w-[130px] font-mono text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => updateActiveSlide({ bgColor: preset.hex })}
                          title={preset.label}
                          className={`h-6 px-2 rounded-md border text-[10px] font-semibold flex items-center gap-1 transition-all ${
                            activeSlide.bgColor.toLowerCase() === preset.hex.toLowerCase()
                              ? 'border-brand ring-2 ring-brand/30 scale-105'
                              : 'border-border hover:border-neutral-400'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                        >
                          <span className="text-neutral-900 font-bold">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground">
                    Headline (3 Stacked Bold Lines)
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase">
                        Line 1
                      </label>
                      <Input
                        value={activeSlide.headlineLine1}
                        onChange={(e) => updateActiveSlide({ headlineLine1: e.target.value })}
                        placeholder="ORGANIC"
                        className="font-bold text-sm uppercase mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase">
                        Line 2
                      </label>
                      <Input
                        value={activeSlide.headlineLine2}
                        onChange={(e) => updateActiveSlide({ headlineLine2: e.target.value })}
                        placeholder="COMES"
                        className="font-bold text-sm uppercase mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase">
                        Line 3
                      </label>
                      <Input
                        value={activeSlide.headlineLine3}
                        onChange={(e) => updateActiveSlide({ headlineLine3: e.target.value })}
                        placeholder="KNOCKING"
                        className="font-bold text-sm uppercase mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Subtitle Paragraph
                  </label>
                  <Textarea
                    rows={2}
                    value={activeSlide.subtitle}
                    onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                    placeholder="Our new nuts are the best food for your health. Choose your favourite!"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Primary CTA Button Text
                    </label>
                    <Input
                      value={activeSlide.ctaText}
                      onChange={(e) => updateActiveSlide({ ctaText: e.target.value })}
                      placeholder="SEE PRODUCTS"
                      className="font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Primary CTA Link URL
                    </label>
                    <Input
                      value={activeSlide.ctaLink}
                      onChange={(e) => updateActiveSlide({ ctaLink: e.target.value })}
                      placeholder="/products"
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>

              </div>

              {/* Right Column: Stacked Cards with Product Selector */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* ── Stacked Card 1 Editor with Product Selector ── */}
                <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-brand" />
                      Stacked Card 1 (Top Product)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Color:</span>
                      <input
                        type="color"
                        value={activeSlide.card1.bgColor}
                        onChange={(e) =>
                          updateActiveSlide({
                            card1: { ...activeSlide.card1, bgColor: e.target.value },
                          })
                        }
                        className="h-6 w-8 rounded-sm cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Select from catalog dropdown */}
                  <div className="space-y-1 bg-card p-3 rounded-xl border border-border">
                    <label className="text-[11px] font-bold text-brand uppercase flex items-center gap-1">
                      <span>⚡ 1-Click Select Product</span>
                    </label>
                    <select
                      className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                      value={activeSlide.card1.productId || ''}
                      onChange={(e) => handleSelectProduct(e.target.value, 'card1')}
                    >
                      <option value="">-- Choose a product to auto-fill --</option>
                      {productList.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} (₹{prod.sellingPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Card 1 Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                      <Input
                        value={activeSlide.card1.title}
                        onChange={(e) =>
                          updateActiveSlide({
                            card1: { ...activeSlide.card1, title: e.target.value },
                          })
                        }
                        placeholder="Product Name"
                        className="text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Subtitle / Action</label>
                      <Input
                        value={activeSlide.card1.subtitle}
                        onChange={(e) =>
                          updateActiveSlide({
                            card1: { ...activeSlide.card1, subtitle: e.target.value },
                          })
                        }
                        placeholder="₹450 • Shop Now"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Redirect Link URL</label>
                      <Input
                        value={activeSlide.card1.link}
                        onChange={(e) =>
                          updateActiveSlide({
                            card1: { ...activeSlide.card1, link: e.target.value },
                          })
                        }
                        placeholder="/product/my-product"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Image URL / Upload</label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={activeSlide.card1.image}
                          onChange={(e) =>
                            updateActiveSlide({
                              card1: { ...activeSlide.card1, image: e.target.value },
                            })
                          }
                          placeholder="Image URL"
                          className="text-xs font-mono flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingCard1}
                          onClick={() => card1FileInputRef.current?.click()}
                          title="Upload Image to Supabase"
                          className="px-2 shrink-0"
                        >
                          {uploadingCard1 ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Stacked Card 2 Editor with Product Selector ── */}
                <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-brand" />
                      Stacked Card 2 (Bottom Product)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Color:</span>
                      <input
                        type="color"
                        value={activeSlide.card2.bgColor}
                        onChange={(e) =>
                          updateActiveSlide({
                            card2: { ...activeSlide.card2, bgColor: e.target.value },
                          })
                        }
                        className="h-6 w-8 rounded-sm cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Select from catalog dropdown */}
                  <div className="space-y-1 bg-card p-3 rounded-xl border border-border">
                    <label className="text-[11px] font-bold text-brand uppercase flex items-center gap-1">
                      <span>⚡ 1-Click Select Product</span>
                    </label>
                    <select
                      className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                      value={activeSlide.card2.productId || ''}
                      onChange={(e) => handleSelectProduct(e.target.value, 'card2')}
                    >
                      <option value="">-- Choose a product to auto-fill --</option>
                      {productList.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} (₹{prod.sellingPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Card 2 Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                      <Input
                        value={activeSlide.card2.title}
                        onChange={(e) =>
                          updateActiveSlide({
                            card2: { ...activeSlide.card2, title: e.target.value },
                          })
                        }
                        placeholder="Product Name"
                        className="text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Subtitle / Action</label>
                      <Input
                        value={activeSlide.card2.subtitle}
                        onChange={(e) =>
                          updateActiveSlide({
                            card2: { ...activeSlide.card2, subtitle: e.target.value },
                          })
                        }
                        placeholder="₹450 • Shop Now"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Redirect Link URL</label>
                      <Input
                        value={activeSlide.card2.link}
                        onChange={(e) =>
                          updateActiveSlide({
                            card2: { ...activeSlide.card2, link: e.target.value },
                          })
                        }
                        placeholder="/product/my-product"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Image URL / Upload</label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={activeSlide.card2.image}
                          onChange={(e) =>
                            updateActiveSlide({
                              card2: { ...activeSlide.card2, image: e.target.value },
                            })
                          }
                          placeholder="Image URL"
                          className="text-xs font-mono flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingCard2}
                          onClick={() => card2FileInputRef.current?.click()}
                          title="Upload Image to Supabase"
                          className="px-2 shrink-0"
                        >
                          {uploadingCard2 ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Carousel Timings & Controls ── */}
      {activeTab === 'settings' && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-brand" />
            Carousel Rotation Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground">
                Autoplay Rotation Speed (Seconds)
              </label>
              <div className="flex items-center gap-3 mt-1.5">
                <Input
                  type="number"
                  min="2"
                  max="30"
                  value={Math.round((config.autoplayIntervalMs || 6000) / 1000)}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      autoplayIntervalMs: (parseInt(e.target.value, 10) || 6) * 1000,
                    }))
                  }
                  className="max-w-[120px] font-bold"
                />
                <span className="text-xs text-muted-foreground">
                  Default is 6 seconds. Automatically pauses on user hover.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Bar */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => saveMutation.mutate(config)}
          disabled={saveMutation.isPending}
          size="lg"
          className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-white font-bold shadow-xl rounded-full px-6"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Publishing Changes...' : 'Save & Publish Live'}
        </Button>
      </div>

    </div>
  );
}
