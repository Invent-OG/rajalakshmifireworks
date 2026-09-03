import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './index';
import {
  categories,
  products,
  customers,
  customerAddresses,
  orders,
  orderItems,
  orderStatusHistory,
  inventoryTransactions,
  adminUsers,
  settings,
} from './schema';
import { hashPassword } from '../lib/auth/password';
import { slugify } from '../lib/utils/format';

async function seed() {
  console.log('🌱 Starting Rajalakshmi Fireworks database seed...');

  // 1. Seed Admin User
  console.log('👤 Seeding default admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rajalakshmifireworks.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await hashPassword(adminPassword);

  await db
    .insert(adminUsers)
    .values({
      name: 'Store Manager',
      email: adminEmail,
      passwordHash,
      role: 'superadmin',
    })
    .onConflictDoNothing();

  // 2. Seed Default Settings
  console.log('⚙️ Seeding default store settings...');
  const defaultSettings = [
    { key: 'MIN_ORDER_VALUE', value: '500', description: 'Minimum cart value required to checkout' },
    { key: 'DELIVERY_CHARGE', value: '50', description: 'Standard flat delivery fee in INR' },
    { key: 'FREE_DELIVERY_ABOVE', value: '2000', description: 'Order threshold for free delivery' },
    { key: 'MAX_QUANTITY_PER_ITEM', value: '50', description: 'Maximum quantity of single item allowed per order' },
    { key: 'STORE_PHONE', value: '+91 98765 43210', description: 'Customer support contact phone' },
    { key: 'WHATSAPP_NUMBER', value: '919876543210', description: 'WhatsApp order confirmation phone number' },
    { key: 'STORE_ADDRESS', value: '123 Main Road, Sivakasi, Tamil Nadu 626123', description: 'Physical store pickup address' },
    { key: 'ANNOUNCEMENT_BANNER_ENABLED', value: 'true', description: 'Show or hide store announcement banner' },
    { key: 'ANNOUNCEMENT_BANNER_TEXT', value: 'Direct from Sivakasi • 100% Genuine Factory Sealed Fireworks • Wholesale Pricing', description: 'Top announcement banner text' },
    { key: 'ANNOUNCEMENT_BANNER_LINK', value: '/products', description: 'Top announcement banner link URL' },
    { key: 'ANNOUNCEMENT_BANNER_VARIANT', value: 'rainbow', description: 'Banner variant (rainbow or normal)' },
  ];

  for (const s of defaultSettings) {
    await db.insert(settings).values(s).onConflictDoNothing();
  }

  // 3. Seed Categories
  console.log('📦 Seeding fireworks categories...');
  const categoryData = [
    { name: 'Sparklers', description: 'Safe and sparkling handheld crackers in gold, silver, and colors', sortOrder: 1 },
    { name: 'Flower Pots', description: 'Colorful sparkling fountain cones of vibrant lights and glitter', sortOrder: 2 },
    { name: 'Rockets', description: 'High-flying aerial whistles and multi-color bursts in the night sky', sortOrder: 3 },
    { name: 'Chakras', description: 'Fast-spinning ground wheels with dazzling golden rings', sortOrder: 4 },
    { name: 'Fountains', description: 'Long-duration multi-color fountain cones and fountain pots', sortOrder: 5 },
    { name: 'Sound Crackers', description: 'Traditional Sivakasi single sound and garland wala crackers', sortOrder: 6 },
    { name: 'Gift Boxes', description: 'Premium curated gift packages with crackers for the whole family', sortOrder: 7 },
    { name: 'Family Packs', description: 'Mega value celebration packages with 25+ assorted cracker items', sortOrder: 8 },
  ];

  const insertedCategories: (typeof categories.$inferSelect)[] = [];
  for (const cat of categoryData) {
    const slug = slugify(cat.name);
    const [inserted] = await db
      .insert(categories)
      .values({
        name: cat.name,
        slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      insertedCategories.push(inserted);
    } else {
      const existing = await db.query.categories.findFirst({
        where: eq(categories.slug, slug),
      });
      if (existing) insertedCategories.push(existing);
    }
  }

  const categoryMap = new Map(insertedCategories.map((c) => [c.name, c.id]));

  // 4. Seed Products
  console.log('🎆 Seeding realistic fireworks products...');
  const productsData = [
    // Sparklers
    {
      category: 'Sparklers',
      name: '10 cm Electric Sparklers (10 Pcs)',
      description: 'Classic gold electric sparklers with crackling golden sparks. Ideal for children with parental supervision.',
      sku: 'SPK-10CM-ELEC',
      mrp: '100.00',
      sellingPrice: '60.00',
      stockQuantity: 150,
      lowStockThreshold: 20,
      isFeatured: true,
      isBestseller: true,
    },
    {
      category: 'Sparklers',
      name: '12 cm Green Sparklers (10 Pcs)',
      description: 'Vibrant emerald green light sparklers with minimal smoke emission.',
      sku: 'SPK-12CM-GRN',
      mrp: '130.00',
      sellingPrice: '85.00',
      stockQuantity: 120,
      lowStockThreshold: 15,
      isFeatured: false,
      isBestseller: false,
    },
    {
      category: 'Sparklers',
      name: '15 cm Red Sparklers (10 Pcs)',
      description: 'Bright ruby red sparkling crackers with long burning duration.',
      sku: 'SPK-15CM-RED',
      mrp: '180.00',
      sellingPrice: '120.00',
      stockQuantity: 90,
      lowStockThreshold: 15,
      isFeatured: false,
      isBestseller: true,
    },
    {
      category: 'Sparklers',
      name: '30 cm Deluxe Gold Sparklers (5 Pcs)',
      description: 'Giant mega sparklers burning for over 90 seconds with bright golden sparks.',
      sku: 'SPK-30CM-GLD',
      mrp: '280.00',
      sellingPrice: '190.00',
      stockQuantity: 75,
      lowStockThreshold: 10,
      isFeatured: true,
      isBestseller: true,
    },

    // Flower Pots
    {
      category: 'Flower Pots',
      name: 'Flower Pot Small (10 Pcs)',
      description: 'Traditional golden spray flower pots producing bright conical fountain showers.',
      sku: 'FP-SML-10',
      mrp: '250.00',
      sellingPrice: '160.00',
      stockQuantity: 100,
      lowStockThreshold: 15,
      isFeatured: false,
      isBestseller: true,
    },
    {
      category: 'Flower Pots',
      name: 'Flower Pot Special Deluxe (10 Pcs)',
      description: 'Large sized flower pots with extra height and intense silver crackling sprays.',
      sku: 'FP-DLX-10',
      mrp: '450.00',
      sellingPrice: '310.00',
      stockQuantity: 80,
      lowStockThreshold: 10,
      isFeatured: true,
      isBestseller: true,
    },
    {
      category: 'Flower Pots',
      name: 'Color Koti Tri-Colour Flower Pots (5 Pcs)',
      description: 'Changing three-color fountain displaying Red, Green, and Golden showers.',
      sku: 'FP-TRICOLOR-5',
      mrp: '550.00',
      sellingPrice: '380.00',
      stockQuantity: 60,
      lowStockThreshold: 10,
      isFeatured: true,
      isBestseller: false,
    },

    // Rockets
    {
      category: 'Rockets',
      name: 'Baby Rocket Whistling (10 Pcs)',
      description: 'High pitched whistle ascending into the night sky with small report burst.',
      sku: 'RKT-WHISTLE-10',
      mrp: '220.00',
      sellingPrice: '145.00',
      stockQuantity: 90,
      lowStockThreshold: 15,
      isFeatured: false,
      isBestseller: false,
    },
    {
      category: 'Rockets',
      name: 'Lunik Rocket with Parachute (5 Pcs)',
      description: 'High altitude rocket that ejects a glowing parachute drifting down softly.',
      sku: 'RKT-PARACHUTE-5',
      mrp: '420.00',
      sellingPrice: '290.00',
      stockQuantity: 45,
      lowStockThreshold: 8,
      isFeatured: true,
      isBestseller: true,
    },

    // Chakras
    {
      category: 'Chakras',
      name: 'Ground Chakra Special (10 Pcs)',
      description: 'Smooth spinning ground chakras with bright silver sparks and steady spin speed.',
      sku: 'CHK-SML-10',
      mrp: '180.00',
      sellingPrice: '110.00',
      stockQuantity: 110,
      lowStockThreshold: 20,
      isFeatured: false,
      isBestseller: true,
    },
    {
      category: 'Chakras',
      name: 'Chakra Deluxe Big Wheel (10 Pcs)',
      description: 'Large diameter ground wheel producing twin rings of gold and green fire.',
      sku: 'CHK-DLX-10',
      mrp: '320.00',
      sellingPrice: '220.00',
      stockQuantity: 70,
      lowStockThreshold: 10,
      isFeatured: true,
      isBestseller: false,
    },

    // Sound Crackers
    {
      category: 'Sound Crackers',
      name: '2¾ Kuruvi Sound Crackers (50 Pcs)',
      description: 'Crisp single sound crackers packed in waterproof bundle packaging.',
      sku: 'SND-KURUVI-50',
      mrp: '120.00',
      sellingPrice: '75.00',
      stockQuantity: 200,
      lowStockThreshold: 30,
      isFeatured: false,
      isBestseller: true,
    },
    {
      category: 'Sound Crackers',
      name: '100 Wala Garland Crackers (1 Pack)',
      description: 'Long running chain of 100 crackers with continuous rhythmic sound bursts.',
      sku: 'SND-100WALA',
      mrp: '160.00',
      sellingPrice: '105.00',
      stockQuantity: 130,
      lowStockThreshold: 20,
      isFeatured: false,
      isBestseller: true,
    },
    {
      category: 'Sound Crackers',
      name: '1000 Wala Mega Garland (1 Pack)',
      description: 'Grand Diwali celebration 1000 crackers roll with grand finale sound.',
      sku: 'SND-1000WALA',
      mrp: '1400.00',
      sellingPrice: '950.00',
      stockQuantity: 40,
      lowStockThreshold: 5,
      isFeatured: true,
      isBestseller: true,
    },

    // Gift Boxes & Family Packs
    {
      category: 'Gift Boxes',
      name: 'Royal Delight Gift Box (22 Items)',
      description: 'Curated assortment containing sparklers, chakras, flower pots, and small rockets. Perfect gift for relatives and friends.',
      sku: 'GFT-ROYAL-22',
      mrp: '2500.00',
      sellingPrice: '1699.00',
      stockQuantity: 35,
      lowStockThreshold: 5,
      isFeatured: true,
      isBestseller: true,
    },
    {
      category: 'Family Packs',
      name: 'Maharaja Mega Family Celebration Pack (38 Items)',
      description: 'Complete festival package packed in high grade wooden look crate with every variety of sparkler, ground item, fountain, and aerial novelty.',
      sku: 'FAM-MAHARAJA-38',
      mrp: '6500.00',
      sellingPrice: '4499.00',
      stockQuantity: 20,
      lowStockThreshold: 3,
      isFeatured: true,
      isBestseller: true,
    },
  ];

  for (const p of productsData) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) continue;

    const slug = slugify(p.name);
    const [insertedProd] = await db
      .insert(products)
      .values({
        categoryId,
        name: p.name,
        slug,
        description: p.description,
        sku: p.sku,
        mrp: p.mrp,
        sellingPrice: p.sellingPrice,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
        isActive: true,
        isFeatured: p.isFeatured,
        isBestseller: p.isBestseller,
      })
      .onConflictDoNothing()
      .returning();

    if (insertedProd) {
      // Record initial inventory transaction
      await db.insert(inventoryTransactions).values({
        productId: insertedProd.id,
        type: 'STOCK_ADDED',
        quantityChange: p.stockQuantity,
        quantityAfter: p.stockQuantity,
        note: 'Initial factory stock seeding',
        performedBy: 'system',
      });
    }
  }

  // 5. Seed Sample Customer & Sample Completed Order
  console.log('🛒 Seeding sample customer and orders...');
  const [customer1] = await db
    .insert(customers)
    .values({
      name: 'Ramesh Kumar',
      mobile: '9840123456',
      email: 'ramesh.kumar@example.com',
    })
    .onConflictDoNothing()
    .returning();

  if (customer1) {
    await db.insert(customerAddresses).values({
      customerId: customer1.id,
      address: 'Plot 42, 3rd Cross Street, Anna Nagar',
      city: 'Chennai',
      pincode: '600040',
      isDefault: true,
    });

    const sampleProduct = await db.query.products.findFirst();
    if (sampleProduct) {
      const [sampleOrder] = await db
        .insert(orders)
        .values({
          invoiceNumber: 'FW-20260830-0001',
          customerId: customer1.id,
          orderStatus: 'COMPLETED',
          fulfillmentType: 'DELIVERY',
          subtotal: sampleProduct.sellingPrice,
          discountAmount: String(parseFloat(sampleProduct.mrp) - parseFloat(sampleProduct.sellingPrice)),
          deliveryCharge: '0',
          totalAmount: sampleProduct.sellingPrice,
          customerNameSnapshot: customer1.name,
          customerMobileSnapshot: customer1.mobile,
          addressSnapshot: {
            address: 'Plot 42, 3rd Cross Street, Anna Nagar',
            city: 'Chennai',
            pincode: '600040',
          },
          notes: 'Please ring bell upon arrival',
          placedAt: new Date(),
          confirmedAt: new Date(),
          completedAt: new Date(),
        })
        .returning();

      if (sampleOrder) {
        await db.insert(orderItems).values({
          orderId: sampleOrder.id,
          productId: sampleProduct.id,
          productNameSnapshot: sampleProduct.name,
          productSkuSnapshot: sampleProduct.sku,
          mrpSnapshot: sampleProduct.mrp,
          sellingPriceSnapshot: sampleProduct.sellingPrice,
          quantity: 1,
          discountPerUnit: String(parseFloat(sampleProduct.mrp) - parseFloat(sampleProduct.sellingPrice)),
          lineTotal: sampleProduct.sellingPrice,
        });

        await db.insert(orderStatusHistory).values([
          {
            orderId: sampleOrder.id,
            oldStatus: null,
            newStatus: 'PENDING',
            changedBy: 'system',
            note: 'Order placed by customer',
          },
          {
            orderId: sampleOrder.id,
            oldStatus: 'PENDING',
            newStatus: 'CONFIRMED',
            changedBy: adminEmail,
            note: 'Order confirmed via WhatsApp',
          },
          {
            orderId: sampleOrder.id,
            oldStatus: 'CONFIRMED',
            newStatus: 'COMPLETED',
            changedBy: adminEmail,
            note: 'Order delivered to customer successfully',
          },
        ]);
      }
    }
  }

  console.log('✅ Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
