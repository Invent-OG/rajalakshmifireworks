import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { generateWhatsAppUrl } from '@/lib/services/whatsapp-service';
import { CheckCircle2, MessageCircle, ArrowRight, Sparkles, Truck, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order Confirmed | Rajalakshmi Fireworks' };

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(orders.invoiceNumber, invoiceNumber),
    with: { items: true },
  });

  if (!order) notFound();

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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 animate-fade-in space-y-8">
      {/* Success Celebration Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10 animate-scale-up">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Order Registered Successfully</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
          Thank You, {order.customerNameSnapshot}!
        </h1>

        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Your order has been recorded in our Sivakasi order desk. Click below to verify and receive instant WhatsApp order updates.
        </p>
      </div>

      {/* Prominent WhatsApp Confirmation Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border-2 border-emerald-500/30 text-center space-y-4 luxury-card shadow-xl shadow-emerald-500/10">
        <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
          <MessageCircle className="h-6 w-6" />
        </div>

        <div className="space-y-1 max-w-md mx-auto">
          <h2 className="font-extrabold text-lg sm:text-xl text-foreground">
            Confirm Your Order on WhatsApp
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Send your generated order summary to our dispatch team for priority packing and tracking.
          </p>
        </div>

        <div className="pt-2">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 px-8 py-3.5"
            >
              <MessageCircle className="h-5 w-5" />
              Confirm on WhatsApp
            </Button>
          </a>
        </div>
      </div>

      {/* Itemized Order Receipt Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 luxury-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-2">
          <div>
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              Invoice Reference
            </span>
            <p className="font-mono font-extrabold text-xl text-foreground mt-0.5">
              {order.invoiceNumber}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              Date Placed
            </span>
            <p className="text-xs font-semibold text-foreground mt-0.5">
              {formatDateTime(order.placedAt)}
            </p>
          </div>
        </div>

        {/* Items List */}
        <div>
          <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-3">
            Item Breakdown
          </h3>
          <div className="space-y-2.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-foreground font-medium">
                  {item.productNameSnapshot} <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="font-bold text-foreground">
                  {formatCurrency(toNumber(item.lineTotal))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation Table */}
        <div className="border-t border-border/80 pt-4 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(toNumber(order.subtotal))}</span>
          </div>

          {toNumber(order.discountAmount) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Festive Discount</span>
              <span>-{formatCurrency(toNumber(order.discountAmount))}</span>
            </div>
          )}

          {toNumber(order.deliveryCharge) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Charges</span>
              <span>{formatCurrency(toNumber(order.deliveryCharge))}</span>
            </div>
          )}

          <div className="flex justify-between font-black text-lg pt-3 border-t border-border/80 text-foreground">
            <span>Total Payable Amount</span>
            <span className="gold-gradient-text">{formatCurrency(toNumber(order.totalAmount))}</span>
          </div>
        </div>

        {/* Fulfillment Mode */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center gap-3 text-xs text-muted-foreground">
          {order.fulfillmentType === 'DELIVERY' ? (
            <>
              <Truck className="h-5 w-5 text-primary shrink-0" />
              <span>
                <strong>Home Delivery:</strong> Our Sivakasi dispatch agent will contact you before delivery.
              </span>
            </>
          ) : (
            <>
              <Store className="h-5 w-5 text-primary shrink-0" />
              <span>
                <strong>Store Pickup:</strong> Please show your invoice number at our Sivakasi counter to collect.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2">
        <Link href="/products">
          <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold">
            Continue Shopping
          </Button>
        </Link>
        <Link href="/track-order">
          <Button variant="ghost" size="lg" className="w-full sm:w-auto">
            Track Consignment
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
