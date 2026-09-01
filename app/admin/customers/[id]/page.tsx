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
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <p className="font-semibold text-base">Customer not found</p>
        <Link href="/admin/customers" className="text-xs text-brand hover:underline mt-2 block">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Link href="/admin/customers">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
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
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Contact Information
          </h2>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-mono font-medium text-foreground">{customer.mobile}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{customer.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lifetime Value */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Lifetime Purchase Value
          </h2>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(customer.totalSpent)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {customer.totalOrders} bookings
            </p>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Delivery Destinations
          </h2>
          {customer.addresses && customer.addresses.length > 0 ? (
            <div className="space-y-2 text-xs">
              {customer.addresses.map((a: AddressItem) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2 bg-muted/40 p-2.5 rounded-xl border border-border"
                >
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground font-normal">
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
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-base text-foreground tracking-tight">
            Order History ({customer.orders?.length || 0})
          </h2>
        </div>

        {customer.orders && customer.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Fulfillment</th>
                  <th className="px-5 py-3 text-right">Order Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date Placed</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customer.orders.map((o: CustomerOrderItem) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-foreground">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="hover:underline"
                      >
                        {o.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {o.items?.length || 0} items
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-foreground">
                        {o.fulfillmentType === 'DELIVERY' ? (
                          <>
                            <Truck className="h-3 w-3 text-muted-foreground" /> Delivery
                          </>
                        ) : (
                          <>
                            <Store className="h-3 w-3 text-muted-foreground" /> Pickup
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground text-right">
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.orderStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(o.placedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                      >
                        Inspect <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
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
