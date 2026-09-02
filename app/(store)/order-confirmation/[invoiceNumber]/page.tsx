import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { generateWhatsAppUrl } from '@/lib/services/whatsapp-service';
import { CheckCircle2, MessageSquare, ArrowRight, Truck, Store } from 'lucide-react';
import { StoreButton } from '@/components/ui/store-button';
import { OrderSuccessMotion } from '@/components/store/order-success-motion';
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
    <OrderSuccessMotion>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 space-y-8">
        {/* Success Celebration Header */}
        <div className="text-center space-y-3">
          <div className="success-icon inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="success-title space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Order registered
            </h1>

            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Thank you, {order.customerNameSnapshot}. Your booking has been received at our Sivakasi order desk.
            </p>
          </div>
        </div>

        {/* WhatsApp Confirmation CTA Card */}
        <div className="success-whatsapp p-6 rounded-2xl bg-background-secondary border border-border text-center space-y-4">
          <div className="space-y-1">
            <h2 className="font-bold text-base text-foreground">
              Confirm on WhatsApp
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Send your order reference to our dispatch counter for immediate invoice verification.
            </p>
          </div>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
            <StoreButton size="lg" variant="primary">
              <MessageSquare className="h-4.5 w-4.5" />
              Open WhatsApp Confirmation
            </StoreButton>
          </a>
        </div>

        {/* Itemized Order Receipt Card */}
        <div className="success-receipt p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
            <div>
              <span className="text-xs uppercase font-medium text-muted-foreground tracking-wider">
                Invoice Reference
              </span>
              <p className="font-mono font-bold text-lg text-foreground mt-0.5">
                {order.invoiceNumber}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs uppercase font-medium text-muted-foreground tracking-wider">
                Date Placed
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(order.placedAt)}
              </p>
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-3">
              Item Breakdown
            </h3>
            <div className="space-y-2.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-foreground font-medium">
                    {item.productNameSnapshot} <span className="text-muted-foreground font-normal">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(toNumber(item.lineTotal))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculation Table */}
          <div className="border-t border-border pt-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(toNumber(order.subtotal))}</span>
            </div>

            {toNumber(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount</span>
                <span>-{formatCurrency(toNumber(order.discountAmount))}</span>
              </div>
            )}

            {toNumber(order.deliveryCharge) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{formatCurrency(toNumber(order.deliveryCharge))}</span>
              </div>
            )}

            <div className="border-t border-border pt-2 flex justify-between font-bold text-base text-foreground">
              <span>Payable Amount</span>
              <span>{formatCurrency(toNumber(order.totalAmount))}</span>
            </div>
          </div>

          {/* Fulfillment Note */}
          <div className="p-3.5 rounded-xl bg-background-secondary border border-border text-xs text-muted-foreground flex items-center gap-3">
            {order.fulfillmentType === 'DELIVERY' ? (
              <>
                <Truck className="h-4.5 w-4.5 text-foreground shrink-0" />
                <span>
                  <strong>Home Delivery:</strong> Our dispatch agent will coordinate shipment details via WhatsApp.
                </span>
              </>
            ) : (
              <>
                <Store className="h-4.5 w-4.5 text-foreground shrink-0" />
                <span>
                  <strong>Store Pickup:</strong> Please present your invoice number at our Sivakasi counter to collect.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="success-nav flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link href="/products">
            <StoreButton variant="outline" size="md" className="w-full sm:w-auto">
              Continue shopping
            </StoreButton>
          </Link>
          <Link href="/track-order">
            <StoreButton variant="secondary" size="md" className="w-full sm:w-auto">
              Track order status
              <ArrowRight className="h-4 w-4" />
            </StoreButton>
          </Link>
        </div>
      </div>
    </OrderSuccessMotion>
  );
}
