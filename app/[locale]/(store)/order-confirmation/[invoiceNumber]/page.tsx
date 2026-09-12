import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { generateWhatsAppUrl } from '@/lib/services/whatsapp-service';
import { CheckCircle2, MessageSquare, ArrowRight, Truck, Store } from 'lucide-react';
import { StoreButton } from '@/components/ui/store-button';
import { OrderSuccessMotion } from '@/components/store/order-success-motion';
import { OrderFireworksCelebration } from '@/components/store/order-fireworks-celebration';
import Link from 'next/link';
import type { Metadata } from 'next';
import { isValidLocale, Locale } from '@/lib/i18n/config';
import { getTranslations } from '@/lib/i18n/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; invoiceNumber: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return { title: 'Not Found' };
  return {
    title: locale === 'ta' ? 'முன்பதிவு உறுதிசெய்யப்பட்டது | ராஜலக்ஷ்மி பட்டாசு' : 'Order Confirmed | Rajalakshmi Fireworks',
  };
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; invoiceNumber: string }>;
}) {
  const { locale, invoiceNumber } = await params;
  if (!isValidLocale(locale)) notFound();

  const order = await db.query.orders.findFirst({
    where: eq(orders.invoiceNumber, invoiceNumber),
    with: { items: true },
  });

  if (!order) notFound();

  const tNav = getTranslations(locale, 'navigation');
  const tTrack = getTranslations(locale, 'trackOrder');
  const tCart = getTranslations(locale, 'cart');

  const getHref = (path: string) => (locale === 'en' ? path : `/${locale}${path}`);

  const whatsappUrl = generateWhatsAppUrl({
    invoiceNumber: order.invoiceNumber,
    customerName: order.customerNameSnapshot,
    items: order.items.map((item) => ({
      name: item.productNameSnapshot,
      quantity: item.quantity,
      price: toNumber(item.sellingPriceSnapshot),
    })),
    subtotal: toNumber(order.subtotal),
    discountAmount: toNumber(order.discountAmount),
    deliveryCharge: toNumber(order.deliveryCharge),
    totalAmount: toNumber(order.totalAmount),
    fulfillmentType: order.fulfillmentType as 'DELIVERY' | 'PICKUP',
    address: order.addressSnapshot as { address: string; city: string; pincode: string } | null,
  });

  return (
    <OrderSuccessMotion>
      {/* Sivakasi Celebratory Fireworks Effect via fireworks-js */}
      <OrderFireworksCelebration />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 space-y-8 relative z-10 font-sans">
        {/* Success Celebration Header */}
        <div className="text-center space-y-3">
          <div className="success-icon inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mx-auto shadow-sm">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="success-title space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-heading">
              {locale === 'ta' ? 'முன்பதிவு விசாரணை பதிவு செய்யப்பட்டது!' : 'Order registered'}
            </h1>

            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {locale === 'ta'
                ? `நன்றி ${order.customerNameSnapshot}! உங்கள் தீபாவளி முன்பதிவு விசாரணை சிவகாசி அலுவலகத்தில் பெறப்பட்டுள்ளது.`
                : `Thank you, ${order.customerNameSnapshot}. Your booking has been received at our Sivakasi order desk.`}
            </p>
          </div>
        </div>

        {/* WhatsApp Confirmation CTA Card */}
        <div className="success-whatsapp p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white shadow-sm text-center space-y-4">
          <div className="space-y-1">
            <h2 className="font-bold text-base text-foreground font-heading">
              {locale === 'ta' ? 'வாட்ஸ்அப்பில் உறுதிசெய்யவும்' : 'Confirm on WhatsApp'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {locale === 'ta'
                ? 'உடனடி ரசீது மற்றும் இருப்பு உறுதிப்படுத்தலுக்கு உங்கள் முன்பதிவு எண்ணை வாட்ஸ்அப் மூலம் அனுப்பவும்.'
                : 'Send your order reference to our dispatch counter for immediate invoice verification.'}
            </p>
          </div>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
            <StoreButton size="lg" variant="primary">
              <MessageSquare className="h-4.5 w-4.5" />
              {locale === 'ta' ? 'வாட்ஸ்அப் உறுதிப்படுத்தலைத் திறக்க' : 'Open WhatsApp Confirmation'}
            </StoreButton>
          </a>
        </div>

        {/* Itemized Order Receipt Card */}
        <div className="success-receipt p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-2">
            <div>
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                {tTrack('orderId')}
              </span>
              <p className="font-mono font-bold text-lg text-foreground mt-0.5">
                {order.invoiceNumber}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                {tTrack('bookingDate')}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(order.placedAt)}
              </p>
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-wider mb-3">
              {tTrack('itemsOrdered')}
            </h3>
            <div className="space-y-2.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-foreground font-medium">
                    {item.productNameSnapshot} <span className="text-muted-foreground font-normal font-mono">× {item.quantity}</span>
                  </span>
                  <span className="font-bold text-foreground font-mono">
                    {formatCurrency(toNumber(item.lineTotal))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculation Table */}
          <div className="border-t border-neutral-100 pt-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tCart('estimatedTotal')}</span>
              <span className="font-semibold font-mono">{formatCurrency(toNumber(order.subtotal))}</span>
            </div>

            {toNumber(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>{tCart('totalSavings')}</span>
                <span className="font-mono">-{formatCurrency(toNumber(order.discountAmount))}</span>
              </div>
            )}

            {toNumber(order.deliveryCharge) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{locale === 'ta' ? 'பார்சல் கட்டணம்' : 'Delivery'}</span>
                <span className="font-mono">{formatCurrency(toNumber(order.deliveryCharge))}</span>
              </div>
            )}

            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex justify-between font-bold text-base text-foreground">
              <span>{locale === 'ta' ? 'செலுத்த வேண்டிய உத்தேச தொகை' : 'Payable Amount'}</span>
              <span className="font-mono">{formatCurrency(toNumber(order.totalAmount))}</span>
            </div>
          </div>

          {/* Fulfillment Note */}
          <div className="p-4 rounded-[20px] sm:rounded-[22px] bg-neutral-50 dark:bg-neutral-800/60 text-xs text-muted-foreground flex items-center gap-3">
            {order.fulfillmentType === 'DELIVERY' ? (
              <>
                <Truck className="h-4.5 w-4.5 text-foreground shrink-0" />
                <span>
                  <strong>{locale === 'ta' ? 'வீட்டு முகவரி டெலிவரி:' : 'Home Delivery:'}</strong>{' '}
                  {locale === 'ta'
                    ? 'எங்கள் பார்சல் முகவர் வாட்ஸ்அப் மூலம் லாரி சர்வீஸ் மற்றும் பார்சல் விவரங்களை ஒருங்கிணைப்பார்.'
                    : 'Our dispatch agent will coordinate shipment details via WhatsApp.'}
                </span>
              </>
            ) : (
              <>
                <Store className="h-4.5 w-4.5 text-foreground shrink-0" />
                <span>
                  <strong>{locale === 'ta' ? 'சிவகாசி நேரடி கவுண்டர்:' : 'Store Pickup:'}</strong>{' '}
                  {locale === 'ta'
                    ? 'சிவகாசி அலுவலகத்தில் உங்கள் முன்பதிவு எண்ணைக் காண்பித்து பட்டாசுகளைப் பெற்றுக்கொள்ளலாம்.'
                    : 'Please present your invoice number at our Sivakasi counter to collect.'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="success-nav flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link href={getHref('/products')}>
            <StoreButton variant="outline" size="md" className="w-full sm:w-auto">
              {locale === 'ta' ? 'மேலும் பட்டாசுகளைப் பார்க்க' : 'Continue shopping'}
            </StoreButton>
          </Link>
          <Link href={getHref('/track-order')}>
            <StoreButton variant="secondary" size="md" className="w-full sm:w-auto">
              {tTrack('title')}
              <ArrowRight className="h-4 w-4" />
            </StoreButton>
          </Link>
        </div>
      </div>
    </OrderSuccessMotion>
  );
}
