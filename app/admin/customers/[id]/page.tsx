'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { ArrowLeft, Phone, Mail, MapPin, Truck, Store, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface AddressItem {
  id: number;
  address: string;
  city: string;
  pincode: string;
}

interface CustomerOrderItem {
  id: number;
  invoiceNumber: string;
  items?: Array<{ id: number }>;
  fulfillmentType: string;
  totalAmount: string | number;
  orderStatus: string;
  placedAt: string;
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customerId = parseInt(id);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'customers', 'detail', customerId],
    queryFn: () => fetch(`/api/admin/customers/${customerId}`).then((r) => r.json()),
  });

  const customer = data?.customer;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16 bg-card rounded-3xl border border-border">
        <p className="font-bold text-lg">Customer Not Found</p>
        <Link href="/admin/customers" className="text-xs text-primary hover:underline mt-2 block">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/80">
        <Link href="/admin/customers">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {customer.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Member since {formatDateTime(customer.createdAt)}
          </p>
        </div>
      </div>

      {/* Customer 3-Card Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-3">
          <h2 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
            Contact Information
          </h2>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span className="font-mono font-bold text-foreground">{customer.mobile}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{customer.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lifetime Value */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-3">
          <h2 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
            Lifetime Purchase Value
          </h2>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-foreground">
              {formatCurrency(customer.totalSpent)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              Across {customer.totalOrders} completed bookings
            </p>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-3">
          <h2 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
            Saved Delivery Destinations
          </h2>
          {customer.addresses && customer.addresses.length > 0 ? (
            <div className="space-y-2 text-xs">
              {customer.addresses.map((a: AddressItem) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/60"
                >
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">
                    {a.address}, {a.city} - {a.pincode}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No saved delivery addresses on file</p>
          )}
        </div>
      </div>

      {/* Customer Order History */}
      <div className="rounded-3xl bg-card border border-border/80 luxury-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border/80">
          <h2 className="font-extrabold text-base text-foreground tracking-tight">
            Order History ({customer.orders?.length || 0})
          </h2>
        </div>

        {customer.orders && customer.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Invoice</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Fulfillment</th>
                  <th className="px-5 py-3.5">Order Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date Placed</th>
                  <th className="px-5 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {customer.orders.map((o: CustomerOrderItem) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-foreground">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-primary hover:underline"
                      >
                        {o.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground font-medium">
                      {o.items?.length || 0} items
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-lg bg-muted text-foreground">
                        {o.fulfillmentType === 'DELIVERY' ? (
                          <>
                            <Truck className="h-3.5 w-3.5 text-primary" /> Delivery
                          </>
                        ) : (
                          <>
                            <Store className="h-3.5 w-3.5 text-primary" /> Pickup
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black text-foreground">
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={o.orderStatus} />
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(o.placedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        Details <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-xs">
            No orders placed by this customer yet.
          </div>
        )}
      </div>
    </div>
  );
}
