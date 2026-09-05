import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { APP_CONFIG } from '@/lib/constants/config';
import { PrintButton } from './print-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Print Dispatch Invoice | Rajalakshmi Fireworks',
};

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) notFound();

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: true,
      customer: true,
    },
  });

  if (!order) notFound();

  const address = order.addressSnapshot as {
    address: string;
    city: string;
    pincode: string;
  } | null;

  return (
    <div className="min-h-screen bg-white text-black p-6 sm:p-10 font-sans print:p-0 print:m-0">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Actions bar (Hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 print:hidden">
          <a
            href={`/admin/orders/${order.id}`}
            className="text-xs text-gray-600 hover:text-black font-medium underline"
          >
            ← Back to Order #{order.invoiceNumber}
          </a>
          <PrintButton />
        </div>

        {/* Invoice Container for Print */}
        <div className="border border-gray-300 p-8 rounded-xl shadow-xs print:border-none print:p-0 print:shadow-none space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-6 border-gray-200">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">
                {APP_CONFIG.STORE_NAME}
              </h1>
              <p className="text-xs text-gray-600 mt-1">{APP_CONFIG.STORE_ADDRESS}</p>
              <p className="text-xs text-gray-600">
                Phone: {APP_CONFIG.STORE_PHONE} • Email: {APP_CONFIG.STORE_EMAIL}
              </p>
            </div>
            <div className="text-right space-y-1">
              <span className="inline-block bg-gray-100 text-gray-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">
                DISPATCH SLIP / INVOICE
              </span>
              <p className="font-mono text-xl font-bold text-gray-900 mt-1">
                {order.invoiceNumber}
              </p>
              <p className="text-xs text-gray-500">Date: {formatDateTime(order.placedAt)}</p>
            </div>
          </div>

          {/* Customer & Fulfillment Info */}
          <div className="grid grid-cols-2 gap-6 text-xs border-b pb-6 border-gray-200">
            <div className="space-y-1">
              <h2 className="font-bold uppercase tracking-wider text-gray-500 text-[10px]">
                Customer Details
              </h2>
              <p className="font-bold text-gray-900 text-sm">{order.customerNameSnapshot}</p>
              <p className="font-mono text-gray-700">Mobile: {order.customerMobileSnapshot}</p>
              {order.customer?.email && (
                <p className="text-gray-600">Email: {order.customer.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="font-bold uppercase tracking-wider text-gray-500 text-[10px]">
                Fulfillment & Destination
              </h2>
              <p className="font-bold text-gray-900">
                {order.fulfillmentType === 'DELIVERY'
                  ? 'Doorstep Home Delivery'
                  : 'Sivakasi Counter Pickup'}
              </p>
              {address && (
                <p className="text-gray-700 leading-relaxed">
                  {address.address}, {address.city} - {address.pincode}
                </p>
              )}
              <p className="text-[11px] text-gray-600 font-semibold">
                Status: {order.orderStatus}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h2 className="font-bold uppercase tracking-wider text-gray-500 text-[10px]">
              Item Breakdown ({order.items.length} items)
            </h2>
            <table className="w-full text-left text-xs border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-semibold text-[11px]">
                  <th className="p-2.5 border-r border-gray-200 w-12 text-center">#</th>
                  <th className="p-2.5 border-r border-gray-200">Firework Item</th>
                  <th className="p-2.5 border-r border-gray-200 text-center w-20">Qty</th>
                  <th className="p-2.5 border-r border-gray-200 text-right w-28">Rate</th>
                  <th className="p-2.5 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2.5 border-r border-gray-200 text-center text-gray-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 border-r border-gray-200 font-medium text-gray-900">
                      {item.productNameSnapshot}
                      {item.productSkuSnapshot && (
                        <span className="text-[10px] text-gray-500 font-mono block">
                          SKU: {item.productSkuSnapshot}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-gray-200 text-center font-bold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="p-2.5 border-r border-gray-200 text-right font-mono text-gray-700">
                      {formatCurrency(toNumber(item.sellingPriceSnapshot))}
                    </td>
                    <td className="p-2.5 text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(toNumber(item.lineTotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs border-t pt-3 border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(toNumber(order.subtotal))}</span>
              </div>
              {toNumber(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(toNumber(order.discountAmount))}</span>
                </div>
              )}
              {toNumber(order.deliveryCharge) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge</span>
                  <span className="font-mono">+{formatCurrency(toNumber(order.deliveryCharge))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-300">
                <span>Total Payable</span>
                <span className="font-mono">{formatCurrency(toNumber(order.totalAmount))}</span>
              </div>
            </div>
          </div>

          {/* Special Instructions & Signatures */}
          {order.notes && (
            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs">
              <span className="font-bold text-gray-700 block text-[10px] uppercase">
                Customer Instructions:
              </span>
              <p className="text-gray-800 italic mt-0.5">{order.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs text-gray-500 border-t border-gray-200 mt-8">
            <div className="border-t border-gray-400 pt-2 font-medium">Checked & Packed By</div>
            <div className="border-t border-gray-400 pt-2 font-medium">Verified By Dispatch</div>
            <div className="border-t border-gray-400 pt-2 font-medium">Customer Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
