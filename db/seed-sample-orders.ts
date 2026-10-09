import 'dotenv/config';
import { db } from './index';
import {
  customers,
  customerAddresses,
  orders,
  orderItems,
  orderStatusHistory,
  orderDeliveryAssignments,
  products,
  states,
  cities,
  deliveryPartners,
} from './schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

const SAMPLE_CUSTOMERS = [
  {
    name: 'Rajesh Kannan',
    mobile: '9840123456',
    email: 'rajesh.kannan@gmail.com',
    city: 'Chennai',
    area: 'Anna Nagar',
    address: 'Plot 42, 3rd Main Road, Anna Nagar West',
    pincode: '600040',
    fulfillment: 'DELIVERY' as const,
    notes: 'Please pack sparklers and flower pots in separate cartons.',
  },
  {
    name: 'Priya Sundaram',
    mobile: '9841234567',
    email: 'priya.sundaram@outlook.com',
    city: 'Coimbatore',
    area: 'RS Puram',
    address: '14/2 DB Road, Near Flower Market, RS Puram',
    pincode: '641002',
    fulfillment: 'DELIVERY' as const,
    notes: 'Call before delivery. Deliver strictly after 6:00 PM.',
  },
  {
    name: 'Venkatesh Iyer',
    mobile: '9842345678',
    email: 'venkat.iyer@yahoo.com',
    city: 'Madurai',
    area: 'KK Nagar',
    address: '77 East Veli Street, Near Temple, KK Nagar',
    pincode: '625020',
    fulfillment: 'DELIVERY' as const,
    notes: 'Fragile aerial repeaters included, please handle with care.',
  },
  {
    name: 'Anitha Murugan',
    mobile: '9843456789',
    email: 'anitha.m@gmail.com',
    city: 'Chennai',
    area: 'T. Nagar',
    address: '28 Usman Road, Opp. Panagal Park, T. Nagar',
    pincode: '600017',
    fulfillment: 'DELIVERY' as const,
    notes: 'Diwali festive gift packing required.',
  },
  {
    name: 'Karthik Raja',
    mobile: '9844567890',
    email: 'karthik.raja99@gmail.com',
    city: 'Sivakasi',
    area: 'Main Depot',
    address: '12 Factory Bypass Road, Sivakasi',
    pincode: '626123',
    fulfillment: 'PICKUP' as const,
    notes: 'Will collect directly from factory counter on Saturday morning.',
  },
  {
    name: 'Meenakshi Natarajan',
    mobile: '9845678901',
    email: 'meena.nat@gmail.com',
    city: 'Tiruchirappalli',
    area: 'Thillai Nagar',
    address: '5B Main Road, 11th Cross, Thillai Nagar',
    pincode: '620018',
    fulfillment: 'DELIVERY' as const,
    notes: 'Gate code 4021. Leave with security supervisor if door locked.',
  },
  {
    name: 'Saravanan Balaji',
    mobile: '9846789012',
    email: 'saravanan.b@gmail.com',
    city: 'Salem',
    area: 'Fairlands',
    address: '102 Omalur Main Road, Fairlands',
    pincode: '636016',
    fulfillment: 'DELIVERY' as const,
    notes: null,
  },
  {
    name: 'Deepa Subramanian',
    mobile: '9847890123',
    email: 'deepa.subramanian@gmail.com',
    city: 'Chennai',
    area: 'Velachery',
    address: 'Flat 302, Green Meadows Apt, 100 Feet Road, Velachery',
    pincode: '600042',
    fulfillment: 'DELIVERY' as const,
    notes: 'Please double box against rain or moisture.',
  },
  {
    name: 'Vijay Anand',
    mobile: '9848901234',
    email: 'vijayanand.crick@gmail.com',
    city: 'Sivakasi',
    area: 'Bazaar Branch',
    address: '56 South Car Street, Sivakasi',
    pincode: '626123',
    fulfillment: 'PICKUP' as const,
    notes: 'Counter pickup by driver. Vehicle No TN 67 AB 1234.',
  },
  {
    name: 'Kavitha Ramanathan',
    mobile: '9849012345',
    email: 'kavitha.r@hotmail.com',
    city: 'Coimbatore',
    area: 'Gandhipuram',
    address: '45 Cross Cut Road, Gandhipuram',
    pincode: '641012',
    fulfillment: 'DELIVERY' as const,
    notes: 'Urgent delivery needed before Dhanteras celebration.',
  },
  {
    name: 'Suresh Kumar',
    mobile: '9789012345',
    email: 'suresh.kumar@tcs.com',
    city: 'Chennai',
    area: 'Adyar',
    address: '19 Lattice Bridge Road, Gandhi Nagar, Adyar',
    pincode: '600020',
    fulfillment: 'DELIVERY' as const,
    notes: 'Deliver on weekend morning between 9 AM and 1 PM.',
  },
  {
    name: 'Divya Krishnan',
    mobile: '9788123456',
    email: 'divya.krishnan@gmail.com',
    city: 'Madurai',
    area: 'Villapuram',
    address: '88 Meenakshi Nagar Main Road, Villapuram',
    pincode: '625012',
    fulfillment: 'DELIVERY' as const,
    notes: null,
  },
  {
    name: 'Murali Dharan',
    mobile: '9787234567',
    email: 'murali.dharan@gmail.com',
    city: 'Tirunelveli',
    area: 'Palayamkottai',
    address: '32 High Ground Road, Palayamkottai',
    pincode: '627002',
    fulfillment: 'DELIVERY' as const,
    notes: 'Call alternate mobile 9787999888 if primary unreachable.',
  },
  {
    name: 'Revathi Shankar',
    mobile: '9786345678',
    email: 'revathi.shankar@gmail.com',
    city: 'Erode',
    area: 'Perundurai Road',
    address: '121 Brough Road, Near Railway Colony',
    pincode: '638001',
    fulfillment: 'DELIVERY' as const,
    notes: 'Send tax invoice copy with delivery agent.',
  },
  {
    name: 'Arun Prakash',
    mobile: '9785456789',
    email: 'arun.prakash@infosys.com',
    city: 'Sivakasi',
    area: 'Factory Counter',
    address: '88 Sattur Road, Sivakasi',
    pincode: '626123',
    fulfillment: 'PICKUP' as const,
    notes: 'Will collect this evening with order confirmation SMS.',
  },
  {
    name: 'Gayathri Sridhar',
    mobile: '9784567890',
    email: 'gayathri.sridhar@gmail.com',
    city: 'Chennai',
    area: 'Mylapore',
    address: '15 North Mada Street, Mylapore',
    pincode: '600004',
    fulfillment: 'DELIVERY' as const,
    notes: 'Handle ground wheels carefully, don’t press carton.',
  },
  {
    name: 'Bala Murugan',
    mobile: '9783678901',
    email: 'bala.murugan@gmail.com',
    city: 'Vellore',
    area: 'Katpadi',
    address: '67 Chittoor Main Road, Katpadi',
    pincode: '632014',
    fulfillment: 'DELIVERY' as const,
    notes: null,
  },
  {
    name: 'Shanti Swaminathan',
    mobile: '9782789012',
    email: 'shanti.swami@gmail.com',
    city: 'Thanjavur',
    area: 'Medical College Road',
    address: '22 South Rampart Street, Thanjavur',
    pincode: '613001',
    fulfillment: 'DELIVERY' as const,
    notes: 'Apartment 4B, 4th floor. Lift available.',
  },
  {
    name: 'Dinesh Babu',
    mobile: '9781890123',
    email: 'dinesh.babu@gmail.com',
    city: 'Sivakasi',
    area: 'Central Depot',
    address: 'Factory Gate 2, Sivakasi Industrial Area',
    pincode: '626123',
    fulfillment: 'PICKUP' as const,
    notes: 'Pickup authorized for brother Dinesh.',
  },
  {
    name: 'Lakshmi Narayanan',
    mobile: '9780901234',
    email: 'lakshmi.narayan@gmail.com',
    city: 'Kanchipuram',
    area: 'Ennaikaran',
    address: '9 Gandhi Road, Ennaikaran',
    pincode: '631501',
    fulfillment: 'DELIVERY' as const,
    notes: 'Customer requested duplicate order removal.',
  },
];

const ORDER_CONFIGS = [
  // 5 NEW Orders
  { status: 'NEW' as const, daysAgo: 0, hoursAgo: 2 },
  { status: 'NEW' as const, daysAgo: 0, hoursAgo: 4 },
  { status: 'NEW' as const, daysAgo: 0, hoursAgo: 7 },
  { status: 'NEW' as const, daysAgo: 1, hoursAgo: 3 },
  { status: 'NEW' as const, daysAgo: 1, hoursAgo: 8 },

  // 4 CONFIRMED Orders
  { status: 'CONFIRMED' as const, daysAgo: 1, hoursAgo: 12 },
  { status: 'CONFIRMED' as const, daysAgo: 2, hoursAgo: 5 },
  { status: 'CONFIRMED' as const, daysAgo: 2, hoursAgo: 14 },
  { status: 'CONFIRMED' as const, daysAgo: 3, hoursAgo: 6 },

  // 4 ASSIGNED Orders
  { status: 'ASSIGNED' as const, daysAgo: 3, hoursAgo: 16 },
  { status: 'ASSIGNED' as const, daysAgo: 4, hoursAgo: 8 },
  { status: 'ASSIGNED' as const, daysAgo: 4, hoursAgo: 18 },
  { status: 'ASSIGNED' as const, daysAgo: 5, hoursAgo: 9 },

  // 3 OUT_FOR_DELIVERY Orders
  { status: 'OUT_FOR_DELIVERY' as const, daysAgo: 5, hoursAgo: 15 },
  { status: 'OUT_FOR_DELIVERY' as const, daysAgo: 6, hoursAgo: 7 },
  { status: 'OUT_FOR_DELIVERY' as const, daysAgo: 6, hoursAgo: 14 },

  // 3 DELIVERED Orders
  { status: 'DELIVERED' as const, daysAgo: 6, hoursAgo: 20 },
  { status: 'DELIVERED' as const, daysAgo: 7, hoursAgo: 10 },
  { status: 'DELIVERED' as const, daysAgo: 7, hoursAgo: 18 },

  // 1 CANCELLED Order
  { status: 'CANCELLED' as const, daysAgo: 2, hoursAgo: 20 },
];

async function seedSampleOrders() {
  console.log('🚀 Seeding 20 realistic sample orders...');

  // Fetch available products from catalog
  const allProducts = await db.select().from(products).where(eq(products.isActive, true));
  if (allProducts.length === 0) {
    throw new Error('No active products found in database. Run db:seed first.');
  }

  // Fetch states and cities
  const allStates = await db.select().from(states);
  const allCities = await db.select().from(cities);
  const tnState = allStates.find((s) => s.name === 'Tamil Nadu') || allStates[0];

  // Fetch delivery partners
  const partners = await db.select().from(deliveryPartners);
  const primaryPartner = partners[0] || null;
  const secondaryPartner = partners[1] || partners[0] || null;

  const now = new Date();
  const dateStr = format(now, 'yyyyMMdd');

  for (let i = 0; i < 20; i++) {
    const custData = SAMPLE_CUSTOMERS[i];
    const cfg = ORDER_CONFIGS[i];

    // Calculate dates
    const placedDate = new Date(
      now.getTime() - (cfg.daysAgo * 24 * 60 * 60 * 1000 + cfg.hoursAgo * 60 * 60 * 1000)
    );

    const confirmedDate =
      cfg.status !== 'NEW'
        ? new Date(placedDate.getTime() + 15 * 60 * 1000)
        : null;

    const assignedDate =
      ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(cfg.status)
        ? new Date(placedDate.getTime() + 45 * 60 * 1000)
        : null;

    const deliveredDate =
      cfg.status === 'DELIVERED'
        ? new Date(placedDate.getTime() + 4 * 60 * 60 * 1000)
        : null;

    const cancelledDate =
      cfg.status === 'CANCELLED'
        ? new Date(placedDate.getTime() + 30 * 60 * 1000)
        : null;

    // Pick partner
    const assignedPartner =
      ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(cfg.status) && custData.fulfillment === 'DELIVERY'
        ? (i % 2 === 0 ? primaryPartner : secondaryPartner)
        : null;

    // Resolve city and state
    const matchedCity =
      allCities.find((c) => c.name.toLowerCase() === custData.city.toLowerCase()) ||
      allCities[0] ||
      null;

    // 1. Create or Find Customer
    let customer = await db.query.customers.findFirst({
      where: (c, { eq }) => eq(c.mobile, custData.mobile),
    });

    if (!customer) {
      const [newCust] = await db
        .insert(customers)
        .values({
          name: custData.name,
          mobile: custData.mobile,
          email: custData.email,
        })
        .returning();
      customer = newCust;
    }

    // 2. Customer address
    if (custData.fulfillment === 'DELIVERY') {
      await db
        .insert(customerAddresses)
        .values({
          customerId: customer.id,
          stateId: tnState?.id || null,
          cityId: matchedCity?.id || null,
          address: custData.address,
          city: custData.city,
          state: tnState?.name || 'Tamil Nadu',
          pincode: custData.pincode,
          isDefault: true,
        })
        .onConflictDoNothing();
    }

    // 3. Select 2 to 4 products for this order
    const numItems = 2 + (i % 3); // 2, 3, or 4 items
    const selectedProds: typeof allProducts = [];
    const step = Math.floor(allProducts.length / numItems);
    for (let k = 0; k < numItems; k++) {
      const prodIdx = (i * 7 + k * step) % allProducts.length;
      selectedProds.push(allProducts[prodIdx]);
    }

    // Calculate line totals
    let subtotalNum = 0;
    let discountNum = 0;
    const itemsToInsert = selectedProds.map((prod, idx) => {
      const qty = 1 + ((i + idx) % 3); // 1 to 3 items
      const mrp = parseFloat(prod.mrp) || 100;
      const sp = parseFloat(prod.sellingPrice) || 80;
      const lineTotal = sp * qty;
      const discount = Math.max(0, mrp - sp) * qty;

      subtotalNum += lineTotal;
      discountNum += discount;

      return {
        productId: prod.id,
        productNameSnapshot: prod.name,
        productSkuSnapshot: prod.sku,
        mrpSnapshot: String(mrp.toFixed(2)),
        sellingPriceSnapshot: String(sp.toFixed(2)),
        quantity: qty,
        discountPerUnit: String(Math.max(0, mrp - sp).toFixed(2)),
        lineTotal: String(lineTotal.toFixed(2)),
      };
    });

    const deliveryChargeNum =
      custData.fulfillment === 'PICKUP' || subtotalNum >= 2000 ? 0 : 50;
    const totalAmountNum = subtotalNum + deliveryChargeNum;

    const invoiceNumber = `FW-${dateStr}-${String(i + 1).padStart(4, '0')}`;

    const addressSnapshot =
      custData.fulfillment === 'DELIVERY'
        ? {
            stateId: tnState?.id || null,
            cityId: matchedCity?.id || null,
            deliveryStateName: tnState?.name || 'Tamil Nadu',
            deliveryCityName: custData.city,
            deliveryAddress: custData.address,
            address: custData.address,
            city: custData.city,
            state: tnState?.name || 'Tamil Nadu',
            area: custData.area,
            deliveryArea: custData.area,
            pincode: custData.pincode,
          }
        : null;

    // 4. Insert Order
    const [insertedOrder] = await db
      .insert(orders)
      .values({
        invoiceNumber,
        customerId: customer.id,
        stateId: tnState?.id || null,
        cityId: matchedCity?.id || null,
        deliveryPartnerId: assignedPartner ? assignedPartner.id : null,
        assignedAt: assignedDate,
        assignedBy: assignedPartner ? 'admin@rajalakshmifireworks.com' : null,
        orderStatus: cfg.status,
        fulfillmentType: custData.fulfillment,
        subtotal: String(subtotalNum.toFixed(2)),
        discountAmount: String(discountNum.toFixed(2)),
        deliveryCharge: String(deliveryChargeNum.toFixed(2)),
        totalAmount: String(totalAmountNum.toFixed(2)),
        customerNameSnapshot: custData.name,
        customerMobileSnapshot: custData.mobile,
        addressSnapshot,
        notes: custData.notes,
        idempotencyKey: `seed-order-${i + 1}-${Date.now()}`,
        placedAt: placedDate,
        confirmedAt: confirmedDate,
        deliveredAt: deliveredDate,
        cancelledAt: cancelledDate,
        createdAt: placedDate,
        updatedAt: deliveredDate || confirmedDate || placedDate,
      })
      .returning();

    // 5. Insert Order Items
    for (const item of itemsToInsert) {
      await db.insert(orderItems).values({
        orderId: insertedOrder.id,
        ...item,
      });
    }

    // 6. Insert Order Status History
    const historyEntries: Array<{
      orderId: number;
      oldStatus: string | null;
      newStatus: string;
      changedBy: string;
      note: string;
      createdAt: Date;
    }> = [
      {
        orderId: insertedOrder.id,
        oldStatus: null,
        newStatus: 'NEW',
        changedBy: 'system',
        note: 'Order placed by customer',
        createdAt: placedDate,
      },
    ];

    if (confirmedDate) {
      historyEntries.push({
        orderId: insertedOrder.id,
        oldStatus: 'NEW',
        newStatus: 'CONFIRMED',
        changedBy: 'admin@rajalakshmifireworks.com',
        note: 'Order confirmed with customer via WhatsApp/Call',
        createdAt: confirmedDate,
      });
    }

    if (assignedDate && assignedPartner) {
      historyEntries.push({
        orderId: insertedOrder.id,
        oldStatus: 'CONFIRMED',
        newStatus: 'ASSIGNED',
        changedBy: 'admin@rajalakshmifireworks.com',
        note: `Assigned to delivery partner: ${assignedPartner.name} (${assignedPartner.mobileNumber})`,
        createdAt: assignedDate,
      });

      // Also record delivery assignment entry
      await db.insert(orderDeliveryAssignments).values({
        orderId: insertedOrder.id,
        deliveryPartnerId: assignedPartner.id,
        assignedBy: 'admin@rajalakshmifireworks.com',
        assignedAt: assignedDate,
        status: 'ACTIVE',
      });
    }

    if (cfg.status === 'OUT_FOR_DELIVERY') {
      historyEntries.push({
        orderId: insertedOrder.id,
        oldStatus: 'ASSIGNED',
        newStatus: 'OUT_FOR_DELIVERY',
        changedBy: assignedPartner?.name || 'system',
        note: 'Dispatched from Sivakasi fulfillment hub, out for delivery',
        createdAt: new Date(assignedDate!.getTime() + 60 * 60 * 1000),
      });
    }

    if (deliveredDate) {
      historyEntries.push({
        orderId: insertedOrder.id,
        oldStatus: 'OUT_FOR_DELIVERY',
        newStatus: 'DELIVERED',
        changedBy: assignedPartner?.name || 'admin@rajalakshmifireworks.com',
        note: 'Customer received package. Delivered successfully.',
        createdAt: deliveredDate,
      });
    }

    if (cancelledDate) {
      historyEntries.push({
        orderId: insertedOrder.id,
        oldStatus: 'NEW',
        newStatus: 'CANCELLED',
        changedBy: 'admin@rajalakshmifireworks.com',
        note: custData.notes || 'Order cancelled upon customer request',
        createdAt: cancelledDate,
      });
    }

    for (const h of historyEntries) {
      await db.insert(orderStatusHistory).values(h);
    }

    console.log(
      `  [${i + 1}/20] Created ${invoiceNumber} - ${custData.name} (${cfg.status}, ₹${totalAmountNum.toFixed(2)}) ${custData.notes ? '📝 with notes' : ''}`
    );
  }

  console.log('✅ Successfully created 20 sample orders!');
  process.exit(0);
}

seedSampleOrders().catch((err) => {
  console.error('❌ Failed seeding sample orders:', err);
  process.exit(1);
});
