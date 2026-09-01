import 'dotenv/config';
import { db } from './index';
import { productMedia } from './schema';
import { eq } from 'drizzle-orm';

const productMediaMap: Record<
  string,
  Array<{ type: 'image' | 'video'; url: string; alt?: string; sortOrder: number }>
> = {
  '10 cm Electric Sparklers (10 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1531747056595-07f6cbbe10ad?w=800&auto=format&fit=crop&q=80',
      alt: '10 cm Electric Gold Sparklers',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
      alt: 'Electric Sparklers in Hand',
      sortOrder: 1,
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=0k2ZzkwWd5E',
      alt: 'Sparkler Live Demo Burst',
      sortOrder: 2,
    },
  ],
  '12 cm Green Sparklers (10 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
      alt: '12 cm Green Sparklers',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
      alt: 'Green Sparkler Night Glow',
      sortOrder: 1,
    },
  ],
  '15 cm Red Sparklers (10 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1576972405668-2d020a01cbfa?w=800&auto=format&fit=crop&q=80',
      alt: '15 cm Red Sparklers',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
      alt: 'Long Duration Red Sparkler',
      sortOrder: 1,
    },
  ],
  '30 cm Deluxe Gold Sparklers (5 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
      alt: '30 cm Deluxe Gold Sparklers',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1531747056595-07f6cbbe10ad?w=800&auto=format&fit=crop&q=80',
      alt: 'Deluxe Gold Mega Sparkler Burst',
      sortOrder: 1,
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=0k2ZzkwWd5E',
      alt: 'Mega Sparkler Video',
      sortOrder: 2,
    },
  ],
  'Flower Pot Small (10 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=800&auto=format&fit=crop&q=80',
      alt: 'Flower Pot Small Golden Shower',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
      alt: 'Flower Pot Fountain Spray',
      sortOrder: 1,
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      alt: 'Flower Pot Fountain Demo',
      sortOrder: 2,
    },
  ],
  'Flower Pot Special Deluxe (10 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
      alt: 'Flower Pot Special Deluxe Silver Crackling',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=800&auto=format&fit=crop&q=80',
      alt: 'High Altitude Flower Pot Burst',
      sortOrder: 1,
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      alt: 'Deluxe Flowerpot Demo Video',
      sortOrder: 2,
    },
  ],
  'Color Koti Tri-Colour Flower Pots (5 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1569930784237-ea65a2f40a8d?w=800&auto=format&fit=crop&q=80',
      alt: 'Color Koti Tri-Colour Flower Pots',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
      alt: 'Tri-Colour Fountain Shower',
      sortOrder: 1,
    },
  ],
  'Baby Rocket Whistling (10 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      alt: 'Baby Rocket Whistling Aerial Ascent',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1533230307786-dbd9907c0879?w=800&auto=format&fit=crop&q=80',
      alt: 'Night Sky Rocket Burst',
      sortOrder: 1,
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=0k2ZzkwWd5E',
      alt: 'Whistling Rocket Sound & Burst Demo',
      sortOrder: 2,
    },
  ],
  'Lunik Rocket with Parachute (5 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      alt: 'Lunik Rocket with Parachute',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      alt: 'Parachute Light Flare',
      sortOrder: 1,
    },
  ],
  'Ground Chakra Special (10 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      alt: 'Ground Chakra Special Spinning Wheel',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      alt: 'Ground Chakra Fiery Sparks',
      sortOrder: 1,
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      alt: 'Chakra Fast Spin Demo',
      sortOrder: 2,
    },
  ],
  'Chakra Deluxe Big Wheel (10 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&auto=format&fit=crop&q=80',
      alt: 'Chakra Deluxe Big Wheel Twin Fire Rings',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      alt: 'Big Chakra Ring Glow',
      sortOrder: 1,
    },
  ],
  '2¾ Kuruvi Sound Crackers (50 Pcs)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=800&auto=format&fit=crop&q=80',
      alt: '2¾ Kuruvi Sound Crackers Bundle',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?w=800&auto=format&fit=crop&q=80',
      alt: 'Traditional Red Crackers',
      sortOrder: 1,
    },
  ],
  '100 Wala Garland Crackers (1 Pack)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?w=800&auto=format&fit=crop&q=80',
      alt: '100 Wala Garland Chain Crackers',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80',
      alt: 'Festive Garland Crackers',
      sortOrder: 1,
    },
  ],
  '1000 Wala Mega Garland (1 Pack)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80',
      alt: '1000 Wala Mega Garland Roll',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?w=800&auto=format&fit=crop&q=80',
      alt: 'Grand Finale Garland Crackers',
      sortOrder: 1,
    },
  ],
  'Royal Delight Gift Box (22 Items)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
      alt: 'Royal Delight Festive Gift Box',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&auto=format&fit=crop&q=80',
      alt: 'Assorted Festive Pack Gift',
      sortOrder: 1,
    },
  ],
  'Maharaja Mega Family Celebration Pack (38 Items)': [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&auto=format&fit=crop&q=80',
      alt: 'Maharaja Mega Family Celebration Box',
      sortOrder: 0,
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
      alt: 'Family Complete Celebration Hamper',
      sortOrder: 1,
    },
  ],
};

async function seedPhotos() {
  console.log('📸 Seeding sample photos & demo videos for all crackers...');

  const allProducts = await db.query.products.findMany();
  console.log(`Found ${allProducts.length} products in database.`);

  let totalMediaAdded = 0;

  for (const product of allProducts) {
    const mediaList = productMediaMap[product.name];
    if (!mediaList || mediaList.length === 0) continue;

    // Remove old media for clean reload
    await db.delete(productMedia).where(eq(productMedia.productId, product.id));

    // Insert new sample photos and demo videos
    await db.insert(productMedia).values(
      mediaList.map((m) => ({
        productId: product.id,
        type: m.type,
        url: m.url,
        alt: m.alt || product.name,
        sortOrder: m.sortOrder,
      }))
    );

    totalMediaAdded += mediaList.length;
    console.log(`✓ Added ${mediaList.length} media items for: "${product.name}"`);
  }

  console.log(`\n🎉 Successfully seeded ${totalMediaAdded} photos and demo videos!`);
  process.exit(0);
}

seedPhotos().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
