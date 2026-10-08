'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { useState } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { ORDER_STATUS_LABELS } from '@/lib/constants/order-status';
import type { OrderStatus, FulfillmentType } from '@/db/schema';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Package,
  Printer,
  Car,
  Calendar,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Edit,
} from 'lucide-react';
import Link from '@/components/ui/link';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceCustomizer } from '@/components/admin/invoice-customizer';
import { 
  getOrderWhatsAppTemplates, 
  generateCustomerWhatsAppQuotationUrl,
  buildWhatsAppShareUrl,
  type WhatsAppProcessType,
  type WhatsAppOrderData 
} from '@/lib/services/whatsapp-service';

interface WhatsAppMessageEntry {
  id: number;
  messageType: string;
  templateName: string;
  phoneNumber: string;
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  attemptCount: number;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
}

interface OrderItemDetail {
  id: number;
  productNameSnapshot: string;
  sellingPriceSnapshot: string | number;
  mrpSnapshot: string | number;
  quantity: number;
  lineTotal: string | number;
}

interface OrderStatusHistoryEntry {
  id: number;
  newStatus: string;
  note: string | null;
  createdAt: string;
  changedBy: string | null;
}

interface DeliveryAssignmentEntry {
  id: number;
  deliveryPartnerId: number;
  assignedBy: string | null;
  assignedAt: string;
  unassignedAt: string | null;
  status: string;
  deliveryPartner?: {
    name: string;
    mobileNumber: string;
    vehicleType?: string | null;
    vehicleNumber?: string | null;
  };
}

interface DeliveryPartnerItem {
  id: number;
  name: string;
  fullName?: string;
  mobileNumber: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  status: string;
  serviceableAreas?: string[] | null;
}

import { withAdminShell } from './admin-shell';

interface AdminOrderDetailPageProps {
  params?: { id?: string } | Promise<{ id: string }>;
  orderId?: number;
  initialOrder?: any;
}

function AdminOrderDetailPageContent({
  params,
  orderId: propOrderId,
  initialOrder,
}: AdminOrderDetailPageProps) {
  const pathId = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean).pop() : '';
  const paramId = params && typeof params === 'object' && 'id' in params && typeof params.id === 'string' ? params.id : '';
  const id = paramId || pathId || (propOrderId ? String(propOrderId) : '');
  const orderId = propOrderId || parseInt(id, 10);
  const isValidOrderId = !isNaN(orderId) && orderId > 0;
  const queryClient = useQueryClient();

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  // Fetch Order with SSR initialData support
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.orders.detail(orderId),
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to load order (HTTP ${res.status})`);
      }
      return res.json();
    },
    initialData: initialOrder ? { order: initialOrder } : undefined,
    enabled: isValidOrderId,
  });

  // Fetch Active Delivery Partners (All active partners across India)
  const { data: deliveryPartners = [], isLoading: isPartnersLoading } = useQuery<DeliveryPartnerItem[]>({
    queryKey: queryKeys.admin.deliveryPartners.list({ status: 'ACTIVE' }),
    queryFn: async () => {
      const res = await fetch('/api/admin/delivery-partners?status=ACTIVE');
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
  });

  // Status Progression Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ newStatus, note }: { newStatus: string; note?: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update order status');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Order status updated');
      if (variables.newStatus === 'CONFIRMED') setSelectedWhatsAppProcess('ORDER_CONFIRMED');
      else if (variables.newStatus === 'ASSIGNED') setSelectedWhatsAppProcess('ORDER_ASSIGNED');
      else if (variables.newStatus === 'OUT_FOR_DELIVERY') setSelectedWhatsAppProcess('ORDER_OUT_FOR_DELIVERY');
      else if (variables.newStatus === 'DELIVERED') setSelectedWhatsAppProcess('ORDER_DELIVERED');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Assign / Reassign Delivery Partner Mutation
  const assignDeliveryMutation = useMutation({
    mutationFn: async ({ partnerId, note }: { partnerId: number; note?: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPartnerId: partnerId, note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to assign delivery partner');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Delivery partner assigned successfully');
      setSelectedWhatsAppProcess('ORDER_ASSIGNED');
      setIsReassigning(false);
      setSelectedPartnerId('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const order = data?.order;
  if (!isValidOrderId || isError || !order) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-foreground">
            {!isValidOrderId ? 'Invalid Order Reference' : isError ? 'Failed to Load Order' : 'Order Not Found'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {error instanceof Error
              ? error.message
              : !isValidOrderId
              ? `Order ID "${id}" is not valid.`
              : `Order #${id} could not be found or may have been removed.`}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          {isError && (
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Try Again
            </Button>
          )}
          <Link href="/admin/orders">
            <Button size="sm" variant="primary">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = (order.orderStatus || 'NEW') as OrderStatus;
  const fulfillmentType = (order.fulfillmentType || 'DELIVERY') as FulfillmentType;
  const address = order.addressSnapshot as {
    deliveryStateName?: string;
    deliveryCityName?: string;
    deliveryAddress?: string;
    address?: string;
    city?: string;
    state?: string;
    area?: string;
    deliveryArea?: string;
    pincode?: string;
  } | null;

  const orderArea = address?.deliveryArea || address?.area || null;
  const cityName = address?.deliveryCityName || address?.city || order.city?.name;
  const stateName = address?.deliveryStateName || address?.state || order.state?.name;
  const streetAddress = address?.deliveryAddress || address?.address;
  const assignedPartner = order.deliveryPartner;

  const statusIcons: Record<string, typeof Clock> = {
    NEW: Clock,
    CONFIRMED: CheckCircle2,
    ASSIGNED: Truck,
    OUT_FOR_DELIVERY: Truck,
    DELIVERED: CheckCircle2,
    CANCELLED: XCircle,
  };

  // Retry / Dispatch WhatsApp Notification Mutation
  const retryWhatsAppMutation = useMutation({
    mutationFn: async ({ messageId, messageType }: { messageId?: number; messageType?: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}/whatsapp/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, messageType }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to dispatch WhatsApp notification');
      return resData;
    },
    onSuccess: (resData) => {
      toast.success(resData.message || 'WhatsApp notification dispatched');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const [selectedWhatsAppProcess, setSelectedWhatsAppProcess] = useState<WhatsAppProcessType>(() => {
    if (order?.orderStatus === 'ASSIGNED') return 'ORDER_ASSIGNED';
    if (order?.orderStatus === 'OUT_FOR_DELIVERY') return 'ORDER_OUT_FOR_DELIVERY';
    if (order?.orderStatus === 'DELIVERED') return 'ORDER_DELIVERED';
    return 'ORDER_CONFIRMED';
  });
  const [isCopied, setIsCopied] = useState(false);

  // Dynamic public tracking link for customer
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rajalakshmifireworks.com';
  const trackingUrl = `${origin}/en/order-confirmation/${order.invoiceNumber}`;

  const whatsAppOrderData: WhatsAppOrderData = {
    invoiceNumber: order.invoiceNumber || '',
    customerName: order.customerNameSnapshot || 'Customer',
    customerMobile: order.customerMobileSnapshot,
    items: (order.items || []).map((i: OrderItemDetail) => ({
      name: i.productNameSnapshot || 'Product',
      quantity: i.quantity || 1,
      price: toNumber(i.sellingPriceSnapshot),
    })),
    subtotal: toNumber(order.subtotal),
    discountAmount: toNumber(order.discountAmount),
    deliveryCharge: toNumber(order.deliveryCharge),
    totalAmount: toNumber(order.totalAmount),
    fulfillmentType: (order.fulfillmentType || 'DELIVERY') as 'DELIVERY' | 'PICKUP',
    address: order.addressSnapshot
      ? {
          address: streetAddress || '',
          city: cityName || '',
          state: stateName || '',
          pincode: address?.pincode || '',
        }
      : null,
    deliveryPartner: assignedPartner
      ? {
          name: assignedPartner.name || '',
          mobileNumber: assignedPartner.mobileNumber || null,
          vehicleNumber: assignedPartner.vehicleNumber || null,
        }
      : null,
    trackingUrl,
  };

  const templatesList = getOrderWhatsAppTemplates(whatsAppOrderData, order.customerMobileSnapshot);
  const activeTemplate =
    templatesList.find((t) => t.type === selectedWhatsAppProcess) || templatesList[0];

  const currentStatusTemplate =
    templatesList.find((t) => {
      if (currentStatus === 'CONFIRMED') return t.type === 'ORDER_CONFIRMED';
      if (currentStatus === 'ASSIGNED') return t.type === 'ORDER_ASSIGNED';
      if (currentStatus === 'OUT_FOR_DELIVERY') return t.type === 'ORDER_OUT_FOR_DELIVERY';
      if (currentStatus === 'DELIVERED') return t.type === 'ORDER_DELIVERED';
      return t.type === 'ORDER_CONFIRMED';
    }) || templatesList[0];

  // Editable WhatsApp Template message state keyed by process type
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.search.includes('print=true');
    }
    return false;
  });

  const activeDefaultText = activeTemplate.messageText;
  const currentMessageText = customMessages[selectedWhatsAppProcess] ?? activeDefaultText;
  const isCustomized =
    customMessages[selectedWhatsAppProcess] !== undefined &&
    customMessages[selectedWhatsAppProcess] !== activeDefaultText;

  const currentShareUrl = buildWhatsAppShareUrl(
    order.customerMobileSnapshot || '',
    currentMessageText
  );

  const handleMessageChange = (newText: string) => {
    setCustomMessages((prev) => ({
      ...prev,
      [selectedWhatsAppProcess]: newText,
    }));
  };

  const handleResetTemplate = () => {
    setCustomMessages((prev) => {
      const updated = { ...prev };
      delete updated[selectedWhatsAppProcess];
      return updated;
    });
    toast.info(`Reset ${activeTemplate.label} to default`);
  };

  const getProcessShareUrl = (processType: WhatsAppProcessType) => {
    const tpl = templatesList.find((t) => t.type === processType);
    const defaultText = tpl?.messageText || '';
    const text = customMessages[processType] ?? defaultText;
    return buildWhatsAppShareUrl(order.customerMobileSnapshot || '', text);
  };

  const handleCopyMessage = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('WhatsApp message template copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div className="flex items-center gap-3.5">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-foreground tracking-tight">
                {order.invoiceNumber}
              </h1>
              <StatusBadge status={currentStatus} className="text-sm px-3 py-1 font-bold" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Placed on {formatDateTime(order.placedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {order?.customerMobileSnapshot && (
            <a
              href={getProcessShareUrl(currentStatusTemplate.type)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              title={`Open WhatsApp chat with ${currentStatusTemplate.label}`}
            >
              <MessageSquare className="h-4 w-4" /> Share {currentStatusTemplate.badge}
            </a>
          )}
          <Button
            variant="outline"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-11 px-4 rounded-xl text-sm font-semibold cursor-pointer"
          >
            <Printer className="h-4 w-4 mr-1.5 text-muted-foreground" /> Print Slip
          </Button>
          <span className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-card border border-border text-foreground shadow-xs">
            {fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Sivakasi Counter Pickup'}
          </span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customer Details, Address, Ordered Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer & Delivery Address Card */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
            <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground pb-3 border-b border-border">
              Customer & Delivery Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-secondary dark:bg-[#242424] flex items-center justify-center text-foreground shrink-0 border border-border">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold">Customer Name</p>
                  <p className="font-bold text-foreground text-base">{order.customerNameSnapshot}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-secondary dark:bg-[#242424] flex items-center justify-center text-foreground shrink-0 border border-border">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold">WhatsApp / Contact Number</p>
                  <p className="font-mono font-bold text-foreground text-base">
                    {order.customerMobileSnapshot}
                  </p>
                </div>
              </div>

              {/* Delivery Address Details */}
              {fulfillmentType === 'DELIVERY' && address && (
                <div className="sm:col-span-2 flex items-start gap-3.5 pt-3 border-t border-border">
                  <div className="h-10 w-10 rounded-xl bg-secondary dark:bg-[#242424] flex items-center justify-center text-foreground shrink-0 mt-0.5 border border-border">
                    <MapPin className="h-5 w-5 text-brand" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase font-bold">Delivery Address (Historical Snapshot)</p>
                    <p className="font-semibold text-foreground text-base">{streetAddress}</p>
                    {(address.area || address.deliveryArea) && (
                      <p className="text-xs font-bold text-brand flex items-center gap-1.5 pt-0.5">
                        <span className="text-muted-foreground">Delivery Area:</span>
                        <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand border border-brand/20 font-bold">
                          {address.area || address.deliveryArea}
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-foreground font-bold">
                      {[cityName, stateName].filter(Boolean).join(', ')} {address.pincode ? `- ${address.pincode}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ordered Products Card */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
            <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground pb-3 border-b border-border">
              Ordered Products ({order.items?.length ?? 0})
            </h2>

            <div className="divide-y divide-border">
              {order.items?.map((item: OrderItemDetail) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4 text-sm sm:text-base">
                  <div className="space-y-1">
                    <p className="font-semibold text-base text-foreground">{item.productNameSnapshot}</p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {formatCurrency(toNumber(item.sellingPriceSnapshot))} × {item.quantity}
                      {toNumber(item.mrpSnapshot) > toNumber(item.sellingPriceSnapshot) && (
                        <span className="ml-2 line-through opacity-60">
                          {formatCurrency(toNumber(item.mrpSnapshot))}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-bold text-base text-foreground font-mono">
                    {formatCurrency(toNumber(item.lineTotal))}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-border space-y-2.5 text-sm sm:text-base">
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">{formatCurrency(toNumber(order.subtotal))}</span>
              </div>
              {toNumber(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Festival Discount</span>
                  <span className="font-mono">-{formatCurrency(toNumber(order.discountAmount))}</span>
                </div>
              )}
              {toNumber(order.deliveryCharge) > 0 && (
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Delivery Charge</span>
                  <span className="font-mono font-semibold">{formatCurrency(toNumber(order.deliveryCharge))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl text-foreground pt-3 border-t border-border">
                <span>Total Amount</span>
                <span className="font-mono text-xl">{formatCurrency(toNumber(order.totalAmount))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Actions & Delivery Assignment */}
        <div className="lg:col-span-4 space-y-6">
          {/* STEP 1: ORDER CONFIRMATION WORKFLOW */}
          {currentStatus === 'NEW' && (
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
                Order Action
              </h2>
              <p className="text-sm text-muted-foreground">
                Review this newly placed order and confirm it before delivery partner assignment.
              </p>
              <Button
                className="w-full h-12 justify-center font-bold text-base"
                onClick={() => statusMutation.mutate({ newStatus: 'CONFIRMED' })}
                disabled={statusMutation.isPending}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" /> Confirm Order
              </Button>

              <Button
                variant="destructive"
                className="w-full h-11 justify-center font-semibold text-sm mt-2"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this order?')) {
                    statusMutation.mutate({ newStatus: 'CANCELLED', note: 'Cancelled by store admin' });
                  }
                }}
                disabled={statusMutation.isPending}
              >
                Cancel Order
              </Button>
            </div>
          )}

          {/* STEP 2: DELIVERY PARTNER ASSIGNMENT (When CONFIRMED or reassigning) */}
          {fulfillmentType === 'DELIVERY' && (currentStatus === 'CONFIRMED' || isReassigning) && (
            <div className="p-6 rounded-2xl bg-card border-2 border-brand/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-brand" />
                  <h2 className="font-bold text-sm uppercase tracking-wider text-foreground">
                    {isReassigning ? 'Reassign Delivery Partner' : 'Assign Delivery Partner'}
                  </h2>
                </div>
                {isReassigning && (
                  <button
                    onClick={() => setIsReassigning(false)}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Select an active delivery personnel to fulfill this shipment across India:
              </p>

              {orderArea && (
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-[#1a1a1a] border border-border text-xs flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    📍 Customer Selected Area:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {orderArea}
                  </span>
                </div>
              )}

              {deliveryPartners.length > 0 ? (
                <div className="space-y-3.5">
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer shadow-xs"
                  >
                    <option value="">-- Select Active Delivery Partner --</option>
                    {deliveryPartners.map((p) => {
                      const coversArea =
                        orderArea &&
                        Array.isArray(p.serviceableAreas) &&
                        p.serviceableAreas.some(
                          (a: string) => a.toLowerCase().trim() === orderArea.toLowerCase().trim()
                        );
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name || p.fullName} ({p.mobileNumber}) {p.vehicleType ? `• ${p.vehicleType}` : ''} {coversArea ? '★ Covers Area' : ''}
                        </option>
                      );
                    })}
                  </select>

                  <Button
                    className="w-full h-12 justify-center font-bold text-base"
                    disabled={!selectedPartnerId || assignDeliveryMutation.isPending}
                    onClick={() => {
                      if (!selectedPartnerId) return;
                      assignDeliveryMutation.mutate({ partnerId: Number(selectedPartnerId) });
                    }}
                  >
                    <Truck className="h-5 w-5 mr-2" />
                    {assignDeliveryMutation.isPending ? 'Assigning...' : 'Assign Delivery'}
                  </Button>

                  {currentStatus === 'CONFIRMED' && (
                    <a
                      href={getProcessShareUrl('ORDER_CONFIRMED')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" /> Share Confirmed Quotation via WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-sm text-amber-800 dark:text-amber-300 space-y-2">
                  <p className="font-semibold">No active delivery partners available.</p>
                  <p className="text-xs">Please add or activate a delivery partner before assigning this order.</p>
                  <Link href="/admin/delivery-partners" className="inline-block font-bold underline">
                    Go to Delivery Partners →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: ASSIGNED / OUT FOR DELIVERY / DELIVERED DETAILS */}
          {assignedPartner && !isReassigning && (
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-brand" />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Assigned Delivery Partner
                  </h2>
                </div>
                {(currentStatus === 'ASSIGNED' || currentStatus === 'CONFIRMED') && (
                  <button
                    onClick={() => setIsReassigning(true)}
                    className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" /> Change
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 dark:bg-[#242424]/50 border border-border space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground text-base">{assignedPartner.name || assignedPartner.fullName}</p>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-2 text-foreground font-mono font-bold text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {assignedPartner.mobileNumber}
                </div>

                {(assignedPartner.vehicleType || assignedPartner.vehicleNumber) && (
                  <div className="flex items-center gap-2 text-muted-foreground font-medium">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{assignedPartner.vehicleType || 'Vehicle'}</span>
                    {assignedPartner.vehicleNumber && <span className="font-mono uppercase font-semibold text-foreground">({assignedPartner.vehicleNumber})</span>}
                  </div>
                )}

                {order.assignedAt && (
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
                    <span>Assigned Date:</span>
                    <span className="font-semibold text-foreground">{formatDateTime(order.assignedAt)}</span>
                  </div>
                )}

                {order.assignedBy && (
                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Assigned By:</span>
                    <span className="font-semibold text-foreground">{order.assignedBy}</span>
                  </div>
                )}
              </div>

              {/* Status Actions for Assigned Orders */}
              {currentStatus === 'ASSIGNED' && (
                <div className="space-y-2.5 pt-2 border-t border-border">
                  <Button
                    className="w-full h-12 justify-center font-bold text-base"
                    onClick={() => statusMutation.mutate({ newStatus: 'OUT_FOR_DELIVERY' })}
                    disabled={statusMutation.isPending}
                  >
                    <Truck className="h-5 w-5 mr-2" /> Mark Out for Delivery
                  </Button>

                  <a
                    href={getProcessShareUrl('ORDER_ASSIGNED')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" /> Share Dispatch Info via WhatsApp
                  </a>

                  <Button
                    variant="destructive"
                    className="w-full h-11 justify-center font-semibold text-sm"
                    onClick={() => {
                      if (confirm('Cancel this assigned order?')) {
                        statusMutation.mutate({ newStatus: 'CANCELLED', note: 'Cancelled by admin' });
                      }
                    }}
                    disabled={statusMutation.isPending}
                  >
                    Cancel Order
                  </Button>
                </div>
              )}

              {/* Status Actions for Out for Delivery */}
              {currentStatus === 'OUT_FOR_DELIVERY' && (
                <div className="space-y-2.5 pt-2 border-t border-border">
                  <Button
                    className="w-full h-12 justify-center font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => statusMutation.mutate({ newStatus: 'DELIVERED' })}
                    disabled={statusMutation.isPending}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" /> Mark Delivered
                  </Button>

                  <a
                    href={getProcessShareUrl('ORDER_OUT_FOR_DELIVERY')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" /> Share Out-for-Delivery Alert via WhatsApp
                  </a>
                </div>
              )}

              {/* Status Actions for Delivered */}
              {currentStatus === 'DELIVERED' && (
                <div className="space-y-2.5">
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Order Delivered Successfully
                  </div>

                  <a
                    href={getProcessShareUrl('ORDER_DELIVERED')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" /> Share Delivered Wishes via WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Cancellation View */}
          {currentStatus === 'CANCELLED' && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs space-y-1">
              <p className="font-bold text-destructive flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> Order Cancelled
              </p>
              <p className="text-muted-foreground">Reserved inventory was restored back to stock.</p>
            </div>
          )}

          {/* Order Status History Timeline */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Audit Trail
            </h2>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {Array.isArray(order.statusHistory) && order.statusHistory.map((entry: OrderStatusHistoryEntry, idx: number) => {
                const isLatest = idx === 0;
                const Icon = (entry.newStatus && statusIcons[entry.newStatus]) || Clock;
                return (
                  <div key={entry.id} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 border-card ${
                        isLatest
                          ? 'bg-foreground text-background ring-2 ring-foreground/10'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-2.5 w-2.5" />
                    </div>

                    <div className="space-y-0.5">
                      <p
                        className={`text-xs font-semibold ${
                          isLatest ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {(entry.newStatus && ORDER_STATUS_LABELS[entry.newStatus as OrderStatus]) || entry.newStatus || 'Status Update'}
                      </p>
                      {entry.note && (
                        <p className="text-[11px] text-muted-foreground leading-snug">{entry.note}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateTime(entry.createdAt)} {entry.changedBy ? `• ${entry.changedBy}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Direct Share Hub */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-emerald-600" /> WhatsApp Direct Share
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Send live updates and quotation to customer via direct WhatsApp link (No Meta API required)
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
                wa.me Link
              </span>
            </div>

            {/* Process Stage Selector Pills */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Select Process Template:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templatesList.map((tpl) => {
                  const isCurrent =
                    (currentStatus === 'CONFIRMED' && tpl.type === 'ORDER_CONFIRMED') ||
                    (currentStatus === 'ASSIGNED' && tpl.type === 'ORDER_ASSIGNED') ||
                    (currentStatus === 'OUT_FOR_DELIVERY' && tpl.type === 'ORDER_OUT_FOR_DELIVERY') ||
                    (currentStatus === 'DELIVERED' && tpl.type === 'ORDER_DELIVERED') ||
                    (currentStatus === 'NEW' && tpl.type === 'ORDER_RECEIVED');
                  const isSelected = selectedWhatsAppProcess === tpl.type;
                  const isTplCustomized =
                    customMessages[tpl.type] !== undefined &&
                    customMessages[tpl.type] !== tpl.messageText;

                  return (
                    <button
                      key={tpl.type}
                      type="button"
                      onClick={() => setSelectedWhatsAppProcess(tpl.type)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-medium shadow-xs'
                          : 'border-border/80 hover:border-border hover:bg-muted/30 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-[11px] truncate">{tpl.label}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isTplCustomized && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-md">
                              Edited
                            </span>
                          )}
                          {isCurrent && (
                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-emerald-600 text-white rounded-full">
                              Current Status
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{tpl.badge}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient info & description */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-medium text-foreground text-xs">
                    {order.customerNameSnapshot || 'Customer'}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    {order.customerMobileSnapshot ? `+91 ${order.customerMobileSnapshot}` : 'No phone specified'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium text-right">
                {activeTemplate.badge}
              </span>
            </div>

            {/* WhatsApp Text Preview / Editable Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <Edit className="h-3.5 w-3.5 text-emerald-600" />
                    WhatsApp Message (Editable):
                  </span>
                  {isCustomized ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      Modified
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Auto-generated
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isCustomized && (
                    <button
                      type="button"
                      onClick={handleResetTemplate}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-medium transition-colors"
                      title="Reset to default template text"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(currentMessageText)}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-medium transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Editable Text Area */}
              <div className="relative">
                <textarea
                  value={currentMessageText}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  rows={9}
                  placeholder="Type or edit WhatsApp message here..."
                  className="w-full p-3.5 rounded-xl bg-emerald-950/5 dark:bg-[#161616] border border-emerald-500/25 dark:border-[#282828] focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-[12px] font-mono leading-relaxed text-foreground dark:text-gray-100 transition-all resize-y min-h-[180px] shadow-2xs"
                />
              </div>

              {/* Quick Inserts & Character Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted-foreground pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-medium text-muted-foreground">Quick add:</span>
                  {[
                    { label: 'Order #', value: order.invoiceNumber },
                    { label: 'Total', value: formatCurrency(order.finalAmount ?? order.totalAmount ?? 0) },
                    ...(order.customerMobileSnapshot ? [{ label: 'Mobile', value: order.customerMobileSnapshot }] : []),
                    ...(trackingUrl ? [{ label: 'Tracking', value: trackingUrl }] : []),
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleMessageChange(currentMessageText ? `${currentMessageText}\n${chip.value}` : chip.value)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border/60 transition-colors cursor-pointer"
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[10px]">
                  <span>{currentMessageText.length} chars</span>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <a
                href={currentShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                Send on WhatsApp
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto h-10 text-xs font-semibold"
                onClick={() => handleCopyMessage(currentMessageText)}
              >
                {isCopied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {isCopied ? 'Copied' : 'Copy Text'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Customizer Modal (Shows in current page without redirecting) */}
      {isPrintModalOpen && (
        <div className="invoice-no-print fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="relative w-full max-w-5xl bg-white dark:bg-[#121212] rounded-2xl shadow-2xl border border-neutral-300 dark:border-neutral-800 overflow-hidden print:border-none print:shadow-none print:rounded-none">
            {/* Modal Header */}
            <div className="invoice-no-print px-5 py-3.5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800 print:hidden">
              <div className="flex items-center gap-2.5">
                <Printer className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-sm">Invoice Slip Preview & Customizer</span>
                <span className="text-xs text-neutral-400 font-mono">#{order.invoiceNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible">
              <InvoiceCustomizer
                order={order}
                isModal={true}
                onClose={() => setIsPrintModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAdminShell(AdminOrderDetailPageContent);

