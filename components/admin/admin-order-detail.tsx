'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { useState, useMemo } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { ORDER_STATUS_LABELS, PAYMENT_METHODS } from '@/lib/constants/order-status';
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
  X,
  CreditCard,
  ChevronRight,
  Mail,
  Store,
  FileText,
  Sparkles,
  Lock,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
  Search,
  ShoppingBag,
} from 'lucide-react';
import Link from '@/components/ui/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Portal } from '@/components/ui/portal';
import { InvoiceCustomizer } from '@/components/admin/invoice-customizer';
import {
  getOrderWhatsAppTemplates,
  generateCustomerWhatsAppQuotationUrl,
  buildWhatsAppShareUrl,
  type WhatsAppProcessType,
  type WhatsAppOrderData,
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
  productId?: number;
}

interface EditableOrderItem {
  productId: number;
  productNameSnapshot: string;
  productSkuSnapshot?: string | null;
  sellingPriceSnapshot: number;
  mrpSnapshot: number;
  quantity: number;
  stockQuantity?: number;
}

interface OrderStatusHistoryEntry {
  id: number;
  oldStatus?: string | null;
  newStatus?: string | null;
  changedBy?: string | null;
  note?: string | null;
  createdAt: string;
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

  // Fetch Active Delivery Partners
  const { data: deliveryPartners = [] } = useQuery<DeliveryPartnerItem[]>({
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

  // Payment Modal State & Mutation
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethodInput, setPaymentMethodInput] = useState('UPI');
  const [paymentRefInput, setPaymentRefInput] = useState('');

  const paymentMutation = useMutation({
    mutationFn: async ({
      paymentStatus,
      paymentMethod,
      paymentReference,
    }: {
      paymentStatus: 'PAID' | 'PENDING';
      paymentMethod?: string;
      paymentReference?: string;
    }) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus,
          paymentMethod,
          paymentReference,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update payment status');
      }
      return res.json();
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success(
        resData.paymentStatus === 'PAID'
          ? 'Payment recorded: Marked as PAID!'
          : 'Payment status changed to PENDING'
      );
      setIsPaymentModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update payment status');
    },
  });

  const [selectedWhatsAppProcess, setSelectedWhatsAppProcess] = useState<WhatsAppProcessType>('ORDER_CONFIRMED');
  const [isCopied, setIsCopied] = useState(false);
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.search.includes('print=true');
    }
    return false;
  });

  // Customer Edit Modal State & Mutation
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    mobile: '',
    email: '',
    deliveryAddress: '',
    deliveryCityName: '',
    deliveryStateName: '',
    pincode: '',
    notes: '',
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (customerDetails: typeof customerForm) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerDetails }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update customer details');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all });
      toast.success('Customer details updated successfully!');
      setIsCustomerModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update customer details');
    },
  });

  // Order Items Alteration Modal State, Query & Mutation
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [editableItems, setEditableItems] = useState<EditableOrderItem[]>([]);
  const [editDeliveryCharge, setEditDeliveryCharge] = useState<string>('0');
  const [editDiscountAmount, setEditDiscountAmount] = useState<string>('0');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState<string>('');

  const { data: allCatalogProducts = [], isLoading: isCatalogLoading } = useQuery({
    queryKey: ['admin', 'catalog-products-all-for-order'],
    queryFn: async () => {
      const res = await fetch('/api/admin/products?limit=500&statusFilter=active');
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.products) ? json.products : [];
    },
    enabled: isItemsModalOpen,
  });

  const filteredCatalogProducts = useMemo(() => {
    if (!itemSearchQuery.trim()) return allCatalogProducts;
    const q = itemSearchQuery.toLowerCase();
    return allCatalogProducts.filter((p: any) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [allCatalogProducts, itemSearchQuery]);

  const updateOrderItemsMutation = useMutation({
    mutationFn: async ({
      items,
      deliveryCharge,
      discountAmount,
    }: {
      items: EditableOrderItem[];
      deliveryCharge: number;
      discountAmount: number;
    }) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            productId: it.productId,
            productNameSnapshot: it.productNameSnapshot,
            productSkuSnapshot: it.productSkuSnapshot,
            sellingPriceSnapshot: it.sellingPriceSnapshot,
            mrpSnapshot: it.mrpSnapshot,
            quantity: it.quantity,
          })),
          deliveryCharge,
          discountAmount,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update order items');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Order products and charges updated successfully!');
      setIsItemsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update order products');
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
        <h2 className="text-lg font-bold text-foreground">Order Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {error?.message || `Order #${orderId} does not exist or has been removed.`}
        </p>
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

  const activeDefaultText = activeTemplate.messageText;
  const currentMessageText = customMessages[selectedWhatsAppProcess] ?? activeDefaultText;

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

  // Google Maps Search Link
  const fullAddressString = [streetAddress, orderArea, cityName, stateName, address?.pincode]
    .filter(Boolean)
    .join(', ');
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fullAddressString || `${cityName || 'Tamil Nadu'}, India`
  )}`;

  // Stepper Calculation & Sequential Gating
  const isPaid = order.paymentStatus === 'PAID';

  const deliverySteps = [
    { id: 'REVIEW', stepNum: 1, label: 'Review order', desc: 'Placed by customer', icon: FileText },
    { id: 'CONFIRMED', stepNum: 2, label: 'Confirm order', desc: 'Confirmed by store', icon: ShieldCheck },
    { id: 'PAYMENT', stepNum: 3, label: 'Check payment', desc: isPaid ? 'Payment verified' : 'Payment pending', icon: CreditCard },
    { id: 'ASSIGNED', stepNum: 4, label: 'Delivery partner', desc: assignedPartner ? (assignedPartner.name || assignedPartner.fullName) : 'Partner assignment', icon: Truck },
    { id: 'OUT_FOR_DELIVERY', stepNum: 5, label: 'Shipping', desc: 'Out for delivery', icon: Package },
    { id: 'DELIVERED', stepNum: 6, label: 'Delivered', desc: 'Received by customer', icon: CheckCircle2 },
  ];

  const pickupSteps = [
    { id: 'REVIEW', stepNum: 1, label: 'Review order', desc: 'Placed by customer', icon: FileText },
    { id: 'CONFIRMED', stepNum: 2, label: 'Confirm order', desc: 'Stock reserved', icon: ShieldCheck },
    { id: 'PAYMENT', stepNum: 3, label: 'Check payment', desc: isPaid ? 'Payment verified' : 'Payment pending', icon: CreditCard },
    { id: 'READY', stepNum: 4, label: 'Ready for pickup', desc: 'Counter ready in Sivakasi', icon: Store },
    { id: 'DELIVERED', stepNum: 5, label: 'Delivered', desc: 'Collected at counter', icon: CheckCircle2 },
  ];

  const activeSteps = fulfillmentType === 'DELIVERY' ? deliverySteps : pickupSteps;

  const getStepState = (stepId: string): 'completed' | 'current' | 'upcoming' | 'locked' | 'cancelled' => {
    if (currentStatus === 'CANCELLED') return 'cancelled';

    if (stepId === 'REVIEW') {
      return currentStatus === 'NEW' ? 'current' : 'completed';
    }

    if (stepId === 'CONFIRMED') {
      if (currentStatus === 'NEW') return 'upcoming';
      return 'completed';
    }

    if (stepId === 'PAYMENT') {
      if (currentStatus === 'NEW') {
        return isPaid ? 'completed' : 'locked';
      }
      return isPaid ? 'completed' : 'current';
    }

    if (stepId === 'ASSIGNED') {
      if (currentStatus === 'NEW' || !isPaid) return 'locked';
      if (currentStatus === 'CONFIRMED') {
        return assignedPartner ? 'completed' : 'current';
      }
      return 'completed';
    }

    if (stepId === 'READY') {
      if (currentStatus === 'NEW' || !isPaid) return 'locked';
      if (currentStatus === 'CONFIRMED' || currentStatus === 'ASSIGNED') {
        return 'current';
      }
      return 'completed';
    }

    if (stepId === 'OUT_FOR_DELIVERY') {
      if (currentStatus === 'NEW' || currentStatus === 'CONFIRMED' || !isPaid) return 'locked';
      if (currentStatus === 'ASSIGNED') return 'current';
      return 'completed';
    }

    if (stepId === 'DELIVERED') {
      if (fulfillmentType === 'DELIVERY') {
        if (currentStatus === 'OUT_FOR_DELIVERY') return 'current';
        if (currentStatus === 'DELIVERED') return 'completed';
        return 'locked';
      } else {
        if (currentStatus === 'DELIVERED') return 'completed';
        if ((currentStatus === 'CONFIRMED' || currentStatus === 'ASSIGNED') && isPaid) return 'upcoming';
        return 'locked';
      }
    }

    return 'upcoming';
  };

  const completedStepsCount = activeSteps.filter((s) => getStepState(s.id) === 'completed').length;
  const progressPercent = Math.round((completedStepsCount / activeSteps.length) * 100);

  // Customer Edit Helpers
  const openCustomerModal = () => {
    setCustomerForm({
      name: order.customerNameSnapshot || order.customer?.name || '',
      mobile: order.customerMobileSnapshot || order.customer?.mobile || '',
      email: order.customer?.email || '',
      deliveryAddress: streetAddress || '',
      deliveryCityName: cityName || '',
      deliveryStateName: stateName || 'Tamil Nadu',
      pincode: address?.pincode || '',
      notes: order.notes || '',
    });
    setIsCustomerModalOpen(true);
  };

  // Order Items Alteration Helpers
  const openItemsModal = () => {
    const current: EditableOrderItem[] = (order.items || []).map((it: OrderItemDetail) => ({
      productId: it.productId || it.id,
      productNameSnapshot: it.productNameSnapshot || 'Product',
      productSkuSnapshot: (it as any).productSkuSnapshot || '',
      sellingPriceSnapshot: toNumber(it.sellingPriceSnapshot),
      mrpSnapshot: toNumber(it.mrpSnapshot || it.sellingPriceSnapshot),
      quantity: it.quantity || 1,
    }));
    setEditableItems(current);
    setEditDeliveryCharge(String(toNumber(order.deliveryCharge)));
    // In pricing logic, subtotal already reflects wholesale selling prices.
    // order.discountAmount in DB often records MRP retail savings (e.g. MRP - sellingPrice),
    // NOT an extra order-level discount from subtotal.
    // True order-level extra discount = max(0, subtotal + deliveryCharge - totalAmount)
    const actualExtraDiscount = Math.max(
      0,
      Math.round((toNumber(order.subtotal) + toNumber(order.deliveryCharge) - toNumber(order.totalAmount)) * 100) / 100
    );
    setEditDiscountAmount(actualExtraDiscount > 0 ? String(actualExtraDiscount) : '0');
    setItemSearchQuery('');
    setSelectedCatalogProductId('');
    setIsItemsModalOpen(true);
  };

  const handleItemQuantityChange = (productId: number, newQty: number) => {
    if (newQty < 1) return;
    setEditableItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, quantity: newQty } : it))
    );
  };

  const handleRemoveItem = (productId: number) => {
    if (editableItems.length <= 1) {
      toast.error('An order must contain at least one product');
      return;
    }
    setEditableItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const handleAddProductToOrder = (prod: any) => {
    const existing = editableItems.find((it) => it.productId === prod.id);
    if (existing) {
      handleItemQuantityChange(prod.id, existing.quantity + 1);
      toast.success(`Increased ${prod.name} quantity to ${existing.quantity + 1}`);
    } else {
      setEditableItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productNameSnapshot: prod.name,
          productSkuSnapshot: prod.sku || '',
          sellingPriceSnapshot: toNumber(prod.sellingPrice),
          mrpSnapshot: toNumber(prod.mrp || prod.sellingPrice),
          quantity: 1,
          stockQuantity: prod.stockQuantity,
        },
      ]);
      toast.success(`Added ${prod.name} to order`);
    }
  };

  const editableSubtotal = editableItems.reduce(
    (acc, it) => acc + it.sellingPriceSnapshot * it.quantity,
    0
  );
  const parsedDeliveryCharge = parseFloat(editDeliveryCharge) || 0;
  const parsedDiscountAmount = parseFloat(editDiscountAmount) || 0;
  const editableTotal = Math.max(0, editableSubtotal - parsedDiscountAmount + parsedDeliveryCharge);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* 1. TOP HEADER (PATTERN MATCH) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border gap-4">
        <div className="flex items-center gap-3.5">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full cursor-pointer hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-foreground tracking-tight">
                Order-{order.invoiceNumber}
              </h1>

              {/* Payment Status Pill */}
              {order.paymentStatus === 'PAID' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Paid {order.paymentMethod ? `• ${order.paymentMethod}` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Payment Pending
                </span>
              )}

              {/* Order Status Pill */}
              <StatusBadge status={currentStatus} className="text-xs px-3 py-1 font-bold" />
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <span>Order date {formatDateTime(order.placedAt)}</span>
              <span>•</span>
              <span>
                Order from{' '}
                <strong className="text-foreground font-semibold">
                  {order.customerNameSnapshot}
                </strong>
              </span>
              <span>•</span>
              <span className="capitalize">
                Purchased via online store ({fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Counter Pickup'})
              </span>
            </p>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-10 px-4 rounded-full text-xs sm:text-sm font-semibold cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4 mr-1.5 text-muted-foreground" /> Print Slip
          </Button>

          <a
            href={getProcessShareUrl(
              currentStatus === 'ASSIGNED'
                ? 'ORDER_ASSIGNED'
                : currentStatus === 'OUT_FOR_DELIVERY'
                ? 'ORDER_OUT_FOR_DELIVERY'
                : currentStatus === 'DELIVERED'
                ? 'ORDER_DELIVERED'
                : 'ORDER_CONFIRMED'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" /> Share WhatsApp
          </a>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN GRID (PATTERN MATCH) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. ADVANCED STEPPER & COMMAND CENTER */}
          <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden">
            {/* Ambient Background Glow for depth */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 dark:bg-brand/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            {/* Top Hub & Progress Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/80 gap-3 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Dispatch Hub:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Rajalakshmi Fireworks 🇮🇳 Sivakasi
                  </span>
                </div>
                <span className="text-border hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground font-medium">Fulfillment:</span>
                  <span className="font-bold text-foreground">
                    {fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Sivakasi Counter Pickup'}
                  </span>
                </div>
              </div>

              {/* Overall Progress Indicator */}
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <span className="text-xs font-semibold text-muted-foreground">
                  {completedStepsCount} of {activeSteps.length} Steps Complete
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Visual Stepper - Connected Interactive Timeline */}
            <div className="relative pt-2 pb-1">
              {/* Connected Background Track Line (desktop) */}
              <div className="hidden md:block absolute top-[38px] left-[8.33%] right-[8.33%] h-1 bg-border/60 rounded-full z-0 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-brand transition-all duration-500 ease-out rounded-full"
                  style={{
                    width: `${
                      currentStatus === 'DELIVERED'
                        ? 100
                        : Math.min(100, (completedStepsCount / (activeSteps.length - 1)) * 100)
                    }%`,
                  }}
                />
              </div>

              {/* Step Nodes Grid */}
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 ${
                  fulfillmentType === 'DELIVERY' ? 'md:grid-cols-6' : 'md:grid-cols-5'
                } gap-2.5 sm:gap-3 relative z-10`}
              >
                {activeSteps.map((step) => {
                  const state = getStepState(step.id);
                  const isCompleted = state === 'completed';
                  const isCurrent = state === 'current';
                  const isLocked = state === 'locked';
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={`group relative flex flex-col items-center text-center p-3 sm:p-3.5 rounded-2xl transition-all duration-200 ${
                        isCurrent
                          ? 'bg-brand/10 border-2 border-brand/80 shadow-md ring-4 ring-brand/10 scale-[1.02]'
                          : isCompleted
                          ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-500/25 hover:border-emerald-500/40'
                          : isLocked
                          ? 'bg-muted/15 border border-border/40 opacity-60'
                          : 'bg-muted/20 border border-border/60'
                      }`}
                    >
                      {/* Milestone Icon Circle */}
                      <div
                        className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-4 ring-card'
                            : isCurrent
                            ? 'bg-brand text-brand-foreground shadow-lg shadow-brand/30 ring-4 ring-card scale-105 animate-pulse'
                            : isLocked
                            ? 'bg-muted/80 text-muted-foreground/60 border border-border/80 ring-4 ring-card'
                            : 'bg-muted text-muted-foreground border border-border ring-4 ring-card'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5 stroke-[2.5]" />
                        ) : isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>

                      {/* Step Title */}
                      <p
                        className={`text-xs sm:text-sm font-bold mt-2.5 leading-snug whitespace-normal break-words text-center ${
                          isCurrent
                            ? 'text-foreground font-extrabold'
                            : isCompleted
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isLocked
                            ? 'text-muted-foreground/60'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </p>

                      {/* Status Chip */}
                      <div className="mt-1.5 flex items-center justify-center">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Done ✓
                          </span>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand text-brand-foreground shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                            Active
                          </span>
                        )}
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground/60">
                            <Lock className="h-2.5 w-2.5" /> Locked
                          </span>
                        )}
                        {!isCompleted && !isCurrent && !isLocked && (
                          <span className="inline-flex items-center text-[10px] text-muted-foreground/60 font-medium px-2 py-0.5">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Stage Command Bar (Redesigned & Elevated) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 dark:bg-muted/15 border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                    currentStatus === 'DELIVERED'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : currentStatus === 'CANCELLED'
                      ? 'bg-destructive/15 text-destructive border border-destructive/30'
                      : 'bg-brand/20 text-foreground border border-brand/40'
                  }`}
                >
                  {currentStatus === 'DELIVERED' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : currentStatus === 'CANCELLED' ? (
                    <XCircle className="h-6 w-6 text-destructive" />
                  ) : currentStatus === 'NEW' ? (
                    <FileText className="h-6 w-6 text-brand-foreground" />
                  ) : currentStatus === 'CONFIRMED' && !isPaid ? (
                    <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : currentStatus === 'CONFIRMED' && isPaid && !assignedPartner ? (
                    <Truck className="h-6 w-6 text-foreground" />
                  ) : currentStatus === 'ASSIGNED' ? (
                    <Package className="h-6 w-6 text-foreground" />
                  ) : (
                    <Truck className="h-6 w-6 text-foreground" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      {currentStatus === 'DELIVERED' && 'Order Fulfilled & Delivered'}
                      {currentStatus === 'CANCELLED' && 'Order Cancelled'}
                      {currentStatus === 'NEW' && 'Step 1: Review Order & Reserve Inventory'}
                      {currentStatus === 'CONFIRMED' && !isPaid && 'Step 3: Check & Verify Payment'}
                      {currentStatus === 'CONFIRMED' && isPaid && fulfillmentType === 'DELIVERY' && (!assignedPartner ? 'Step 4: Assign Delivery Partner' : 'Step 5: Ready for Dispatch')}
                      {currentStatus === 'CONFIRMED' && isPaid && fulfillmentType === 'PICKUP' && 'Step 4: Ready for Counter Pickup'}
                      {currentStatus === 'ASSIGNED' && (isPaid ? 'Step 5: Handover & Out for Delivery' : 'Step 3: Verify Payment')}
                      {currentStatus === 'OUT_FOR_DELIVERY' && 'Step 6: Out for Delivery Handover'}
                    </h3>
                    {currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand/20 text-foreground font-bold">
                        Action Required
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentStatus === 'DELIVERED' && 'All crackers delivered and received by customer. Fulfilled successfully.'}
                    {currentStatus === 'CANCELLED' && 'This order has been cancelled and will not be dispatched.'}
                    {currentStatus === 'NEW' && 'Review item quantities, festive discounts, and customer details before confirming.'}
                    {currentStatus === 'CONFIRMED' && !isPaid && 'Order is confirmed. Verify and record payment (UPI/Cash/Bank) to unlock dispatch.'}
                    {currentStatus === 'CONFIRMED' && isPaid && fulfillmentType === 'DELIVERY' && (!assignedPartner ? 'Payment verified (PAID). Select an active delivery partner for dispatch.' : `Partner ${assignedPartner.name} assigned. Ready to dispatch.`)}
                    {currentStatus === 'CONFIRMED' && isPaid && fulfillmentType === 'PICKUP' && 'Payment verified (PAID). Crackers are packed and ready at Sivakasi counter.'}
                    {currentStatus === 'ASSIGNED' && (isPaid ? `Cracker parcel is ready with partner ${assignedPartner?.name || ''}. Mark out for delivery.` : 'Payment verification is required before dispatching.')}
                    {currentStatus === 'OUT_FOR_DELIVERY' && 'Fireworks parcel is on the way. Mark delivered upon customer handover.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0">
                {currentStatus !== 'CANCELLED' && currentStatus !== 'DELIVERED' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this order?')) {
                        statusMutation.mutate({ newStatus: 'CANCELLED', note: 'Cancelled by admin' });
                      }
                    }}
                    disabled={statusMutation.isPending}
                    className="text-xs font-semibold text-muted-foreground hover:text-destructive underline-offset-4 hover:underline cursor-pointer transition-colors px-2 py-1"
                  >
                    Cancel Order
                  </button>
                )}

                {/* 1. Review -> Confirm Order */}
                {currentStatus === 'NEW' && (
                  <Button
                    className="w-full md:w-auto h-11 px-6 rounded-full font-bold text-sm bg-brand text-brand-foreground hover:brightness-105 shadow-sm cursor-pointer"
                    onClick={() => statusMutation.mutate({ newStatus: 'CONFIRMED' })}
                    disabled={statusMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Confirm Order
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {/* 2. Confirmed & Unpaid -> Check & Mark as Paid */}
                {currentStatus === 'CONFIRMED' && !isPaid && (
                  <Button
                    className="w-full md:w-auto h-11 px-6 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                    onClick={() => {
                      setPaymentMethodInput(order.paymentMethod || 'UPI');
                      setPaymentRefInput(order.paymentReference || '');
                      setIsPaymentModalOpen(true);
                    }}
                    disabled={paymentMutation.isPending}
                  >
                    <CreditCard className="h-4 w-4 mr-1.5" /> Check & Mark as Paid
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {/* 3. Confirmed & Paid (Delivery) & No Partner -> Assign Partner */}
                {currentStatus === 'CONFIRMED' && isPaid && fulfillmentType === 'DELIVERY' && !assignedPartner && (
                  <Button
                    className="w-full md:w-auto h-11 px-6 rounded-full font-bold text-sm bg-brand text-brand-foreground hover:brightness-105 shadow-sm cursor-pointer"
                    onClick={() => {
                      setIsReassigning(true);
                      const el = document.getElementById('delivery-partner-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Truck className="h-4 w-4 mr-1.5" /> Assign Delivery Partner
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {/* 3. Confirmed & Paid (Delivery) & Has Partner -> Out for Delivery */}
                {currentStatus === 'CONFIRMED' && isPaid && fulfillmentType === 'DELIVERY' && assignedPartner && (
                  <Button
                    className="w-full md:w-auto h-11 px-6 rounded-full font-bold text-sm bg-brand text-brand-foreground hover:brightness-105 shadow-sm cursor-pointer"
                    onClick={() => statusMutation.mutate({ newStatus: 'OUT_FOR_DELIVERY' })}
                    disabled={statusMutation.isPending}
                  >
                    <Truck className="h-4 w-4 mr-1.5" /> Mark Out for Delivery
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {/* 3. Confirmed & Paid (Pickup) -> Complete Counter Pickup */}
                {currentStatus === 'CONFIRMED' && isPaid && fulfillmentType === 'PICKUP' && (
                  <Button
                    className="w-full md:w-auto h-11 px-6 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                    onClick={() =>
                      statusMutation.mutate({
                        newStatus: 'DELIVERED',
                        note: 'Customer collected crackers from counter',
                      })
                    }
                    disabled={statusMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Complete Counter Pickup
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {/* 4. Assigned & Unpaid -> Must Check Payment */}
                {currentStatus === 'ASSIGNED' && !isPaid && (
                  <Button
                    className="w-full md:w-auto h-11 px-6 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                    onClick={() => {
                      setPaymentMethodInput(order.paymentMethod || 'UPI');
                      setPaymentRefInput(order.paymentReference || '');
                      setIsPaymentModalOpen(true);
                    }}
                    disabled={paymentMutation.isPending}
                  >
                    <CreditCard className="h-4 w-4 mr-1.5" /> Check & Mark as Paid
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {/* 4. Assigned & Paid -> Mark Out for Delivery */}
                {currentStatus === 'ASSIGNED' && isPaid && (
                  <Button
                    className="w-full md:w-auto h-11 px-6 rounded-full font-bold text-sm bg-brand text-brand-foreground hover:brightness-105 shadow-sm cursor-pointer"
                    onClick={() => statusMutation.mutate({ newStatus: 'OUT_FOR_DELIVERY' })}
                    disabled={statusMutation.isPending}
                  >
                    <Truck className="h-4 w-4 mr-1.5" /> Mark Out for Delivery
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {/* 5. Out For Delivery -> Mark Delivered */}
                {currentStatus === 'OUT_FOR_DELIVERY' && (
                  <Button
                    className="w-full md:w-auto h-11 px-6 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                    onClick={() => statusMutation.mutate({ newStatus: 'DELIVERED' })}
                    disabled={statusMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Delivered
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {/* 6. Delivered -> Success Badge */}
                {currentStatus === 'DELIVERED' && (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                    Delivered Successfully
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* B. DELIVERY PARTNER ASSIGNMENT CARD (Only shown once payment is verified or partner is already assigned) */}
          {fulfillmentType === 'DELIVERY' && (isPaid || assignedPartner) && (currentStatus === 'CONFIRMED' || currentStatus === 'ASSIGNED' || isReassigning) && (
            <div id="delivery-partner-section" className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-brand" />
                  <h2 className="font-bold text-sm uppercase tracking-wider text-foreground">
                    {assignedPartner && !isReassigning ? 'Assigned Delivery Partner' : 'Assign Delivery Partner'}
                  </h2>
                </div>
                {assignedPartner && !isReassigning ? (
                  <button
                    onClick={() => setIsReassigning(true)}
                    className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" /> Change Partner
                  </button>
                ) : isReassigning && assignedPartner ? (
                  <button
                    onClick={() => setIsReassigning(false)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              {/* Locked Notice if Payment Pending */}
              {!isPaid && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold">Step Locked: Payment Verification Required</p>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        Check and mark payment as PAID before assigning a delivery partner.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 px-4 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 cursor-pointer shadow-2xs"
                    onClick={() => {
                      setPaymentMethodInput(order.paymentMethod || 'UPI');
                      setPaymentRefInput(order.paymentReference || '');
                      setIsPaymentModalOpen(true);
                    }}
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1" /> Mark Paid Now
                  </Button>
                </div>
              )}

              {assignedPartner && !isReassigning ? (
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground text-base">
                      {assignedPartner.name || assignedPartner.fullName}
                    </p>
                    <p className="font-mono text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {assignedPartner.mobileNumber}
                    </p>
                    {(assignedPartner.vehicleType || assignedPartner.vehicleNumber) && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5" />
                        <span>{assignedPartner.vehicleType || 'Vehicle'}</span>
                        {assignedPartner.vehicleNumber && <span className="font-mono font-semibold">({assignedPartner.vehicleNumber})</span>}
                      </p>
                    )}
                  </div>
                  <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active Partner
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Select a delivery partner to dispatch this order across India:
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => setSelectedPartnerId(e.target.value)}
                      disabled={!isPaid}
                      className="w-full sm:flex-1 h-11 px-4 rounded-full border border-border bg-card text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full sm:w-auto h-11 px-5 rounded-full font-semibold text-xs sm:text-sm"
                      disabled={!isPaid || !selectedPartnerId || assignDeliveryMutation.isPending}
                      onClick={() => {
                        if (!selectedPartnerId) return;
                        assignDeliveryMutation.mutate({ partnerId: Number(selectedPartnerId) });
                      }}
                    >
                      <Truck className="h-4 w-4 mr-1.5" />
                      {assignDeliveryMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* C. PRODUCTS SECTION (PATTERN MATCH) */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-base text-foreground">
                  Products
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {order.items?.length ?? 0} {order.items?.length === 1 ? 'Product' : 'Products'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openItemsModal}
                className="h-8 px-3 rounded-full text-xs font-bold border-brand/40 text-brand hover:bg-brand/10 hover:text-brand cursor-pointer shadow-2xs"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" /> Alter Order Products
              </Button>
            </div>

            <div className="divide-y divide-border/60">
              {order.items?.map((item: OrderItemDetail) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4 text-sm sm:text-base">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {item.productNameSnapshot}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        SKU: PRD-{item.productId || item.id} • Quantity {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-base text-foreground font-mono">
                      {formatCurrency(toNumber(item.lineTotal))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(toNumber(item.sellingPriceSnapshot))} / unit
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reserved Stock Info */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Reserved Inventory
              </span>
              <span>All fireworks items verified from Sivakasi warehouse</span>
            </div>
          </div>

          {/* D. PAYMENT DETAILS SECTION (PATTERN MATCH) */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-bold text-base text-foreground">
                Payment Details
              </h2>
              {order.paymentStatus === 'PAID' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Pending
                </span>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Payment Method</span>
                <span className="font-semibold text-foreground font-mono">
                  {order.paymentMethod || 'UPI / NetBanking / Cash'}
                  {order.paymentReference ? ` (#${order.paymentReference})` : ''}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground font-mono">
                  {order.items?.length ?? 0} items • {formatCurrency(toNumber(order.subtotal))}
                </span>
              </div>

              {toNumber(order.discountAmount) > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Festival Discount</span>
                  <span className="font-mono">-{formatCurrency(toNumber(order.discountAmount))}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Shipping Type</span>
                <span className="font-medium text-foreground">
                  {fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Sivakasi Counter Pickup'}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Shipping Fee</span>
                <span className="font-semibold text-foreground font-mono">
                  {toNumber(order.deliveryCharge) > 0 ? formatCurrency(toNumber(order.deliveryCharge)) : '₹0.00 (Free)'}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-border font-bold text-lg text-foreground">
                <span>Total Amount</span>
                <span className="font-mono text-xl">{formatCurrency(toNumber(order.totalAmount))}</span>
              </div>

              {order.paidAt && (
                <div className="pt-2 text-xs text-muted-foreground flex justify-between items-center">
                  <span>Paid Timestamp:</span>
                  <span className="font-mono font-medium text-foreground">{formatDateTime(order.paidAt)}</span>
                </div>
              )}
            </div>

            {/* Payment Actions Row */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              {order.paymentStatus === 'PAID' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethodInput(order.paymentMethod || 'UPI');
                      setPaymentRefInput(order.paymentReference || '');
                      setIsPaymentModalOpen(true);
                    }}
                    className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                  >
                    Edit Payment Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Revert payment status to UNPAID / Pending?')) {
                        paymentMutation.mutate({ paymentStatus: 'PENDING' });
                      }
                    }}
                    disabled={paymentMutation.isPending}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline cursor-pointer"
                  >
                    Mark as Unpaid
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Record payment once customer sends UPI or cash:
                  </p>
                  <Button
                    className="h-10 px-5 rounded-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                    onClick={() => {
                      setPaymentMethodInput(order.paymentMethod || 'UPI');
                      setPaymentRefInput(order.paymentReference || '');
                      setIsPaymentModalOpen(true);
                    }}
                    disabled={paymentMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark as Paid
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* E. WHATSAPP DIRECT SHARE HUB */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-emerald-600" /> WhatsApp Direct Share
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Send updates & quotation to customer via direct WhatsApp link (No Meta API required)
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
                wa.me Link
              </span>
            </div>

            {/* Template Selector Pills */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Select Process Template:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templatesList.map((tpl) => {
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
                        {isTplCustomized && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-md">
                            Edited
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{tpl.badge}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Message Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-muted-foreground">
                  WhatsApp Message (Editable):
                </label>
                {customMessages[selectedWhatsAppProcess] !== undefined &&
                  customMessages[selectedWhatsAppProcess] !== activeDefaultText && (
                    <button
                      type="button"
                      onClick={handleResetTemplate}
                      className="text-[11px] text-brand hover:underline font-medium cursor-pointer"
                    >
                      Reset to default
                    </button>
                  )}
              </div>
              <textarea
                value={currentMessageText}
                onChange={(e) => handleMessageChange(e.target.value)}
                rows={5}
                className="w-full text-xs font-mono p-3 rounded-xl border border-border bg-card dark:bg-[#181818] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-y shadow-2xs"
                placeholder="Custom WhatsApp message..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <a
                href={buildWhatsAppShareUrl(order.customerMobileSnapshot || '', currentMessageText)}
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

        {/* ================= RIGHT COLUMN (SIDEBAR) ================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. ORDER NOTE CARD (PATTERN IN IMAGE) */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-brand" /> Order Note
              </h2>
              <button
                type="button"
                onClick={openCustomerModal}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                title="Edit Order Note"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            {order.notes ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-foreground leading-relaxed">
                <p className="font-medium italic">"{order.notes}"</p>
                <p className="text-[10px] text-muted-foreground mt-2 font-sans">
                  Provided by customer during online booking checkout
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No special packing or delivery instructions provided for this order.
              </p>
            )}
          </div>

          {/* 2. CUSTOMER CARD (PATTERN IN IMAGE) */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Customer
              </h2>
              <button
                type="button"
                onClick={openCustomerModal}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                title="Edit Customer"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-full bg-brand/15 text-brand flex items-center justify-center font-bold text-base shrink-0 border border-brand/20">
                  {order.customerNameSnapshot ? order.customerNameSnapshot.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">
                    {order.customerNameSnapshot}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Customer ID #{order.customerId}
                  </p>
                </div>
              </div>

              {order.customerMobileSnapshot && (
                <a
                  href={buildWhatsAppShareUrl(order.customerMobileSnapshot, `Hi ${order.customerNameSnapshot}, greeting from Rajalakshmi Fireworks!`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full border border-border bg-muted/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                  title="Direct Message"
                >
                  <MessageSquare className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* 3. SHIPPING ADDRESS CARD (PATTERN IN IMAGE) */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand" />
                {fulfillmentType === 'DELIVERY' ? 'Shipping Address' : 'Counter Pickup Location'}
              </h2>
              <button
                type="button"
                onClick={openCustomerModal}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                title="Edit Shipping Address"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            {fulfillmentType === 'DELIVERY' ? (
              <div className="space-y-2 text-xs sm:text-sm">
                <p className="font-bold text-foreground">{order.customerNameSnapshot}</p>
                <p className="text-muted-foreground leading-relaxed">
                  {streetAddress || 'No street address specified'}
                </p>
                <p className="text-muted-foreground">
                  {orderArea ? `${orderArea}, ` : ''}{cityName || 'Tamil Nadu'}, {stateName || 'Tamil Nadu'} {address?.pincode ? `- ${address.pincode}` : ''}
                </p>

                <div className="pt-2">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                  >
                    View on Map <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs sm:text-sm">
                <p className="font-bold text-foreground">Rajalakshmi Fireworks Outlet</p>
                <p className="text-muted-foreground">
                  Main Retail Counter, Sivakasi Fireworks Hub, Virudhunagar District, Tamil Nadu - 626123
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground">
                  Store Pickup
                </span>
              </div>
            )}
          </div>

          {/* 4. CONTACT INFORMATION CARD (PATTERN IN IMAGE) */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Contact Information
              </h2>
              <button
                type="button"
                onClick={openCustomerModal}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                title="Edit Contact Information"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <div className="space-y-2.5">
              {order.customerMobileSnapshot && (
                <a
                  href={`tel:${order.customerMobileSnapshot}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-secondary/40 text-xs sm:text-sm font-semibold font-mono text-foreground hover:bg-secondary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  +91 {order.customerMobileSnapshot}
                </a>
              )}

              {order.customer?.email ? (
                <div>
                  <a
                    href={`mailto:${order.customer.email}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-secondary/40 text-xs sm:text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {order.customer.email}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic pl-1">
                  No email address recorded for customer
                </p>
              )}
            </div>
          </div>

          {/* 5. AUDIT TRAIL TIMELINE */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
            <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Audit Trail
            </h2>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {Array.isArray(order.statusHistory) &&
                order.statusHistory.map((entry: OrderStatusHistoryEntry, idx: number) => {
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

                      <div className="space-y-0.5 min-w-0">
                        <p
                          className={`text-xs font-semibold ${
                            isLatest ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {(entry.newStatus && ORDER_STATUS_LABELS[entry.newStatus as OrderStatus]) ||
                            entry.newStatus ||
                            'Status Update'}
                        </p>
                        {entry.note && (
                          <p className="text-[11px] text-muted-foreground leading-snug break-words">
                            {entry.note}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {formatDateTime(entry.createdAt)} {entry.changedBy ? `• ${entry.changedBy}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Customizer Modal */}
      {isPrintModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in print:p-0 print:bg-white print:static print:overflow-visible">
            <div className="relative w-full max-w-5xl bg-white dark:bg-[#121212] rounded-2xl shadow-2xl border border-neutral-300 dark:border-neutral-800 overflow-hidden print:border-none print:shadow-none print:rounded-none print:bg-white print:overflow-visible z-[101]">
              <div className="invoice-no-print px-5 py-3.5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800 print:hidden">
                <div className="flex items-center gap-2.5">
                  <Printer className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-sm">Invoice Slip Preview & Customizer</span>
                  <span className="text-xs text-neutral-400 font-mono">#{order.invoiceNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible">
                <InvoiceCustomizer
                  order={order}
                  isModal={true}
                  onClose={() => setIsPrintModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Record / Edit Payment Modal */}
      {isPaymentModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-scale-in relative z-[101]">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {order.paymentStatus === 'PAID' ? 'Update Payment Details' : 'Record Order Payment'}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">{order.invoiceNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Order Total Amount:</span>
                <span className="text-lg font-bold font-mono text-foreground">
                  {formatCurrency(toNumber(order.totalAmount))}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value)}
                    className="w-full h-11 px-4 rounded-full border border-border bg-card text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer shadow-xs"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Transaction Reference / UTR / Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-402910482910 or GPay Ref"
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value)}
                    className="w-full h-11 px-4 rounded-full border border-border bg-card text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-full font-semibold text-sm cursor-pointer"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={paymentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                  onClick={() => {
                    paymentMutation.mutate({
                      paymentStatus: 'PAID',
                      paymentMethod: paymentMethodInput,
                      paymentReference: paymentRefInput.trim() || undefined,
                    });
                  }}
                  disabled={paymentMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {paymentMutation.isPending ? 'Saving...' : 'Confirm as Paid'}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Customer & Delivery Details Modal */}
      {isCustomerModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-scale-in max-h-[88vh] overflow-y-auto relative z-[101]">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      Edit Customer & Delivery Details
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">Order #{order.invoiceNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateCustomerMutation.mutate(customerForm);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerForm.mobile}
                      onChange={(e) => setCustomerForm((prev) => ({ ...prev, mobile: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      className="w-full h-11 px-4 rounded-xl border border-border bg-card text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. customer@gmail.com"
                      className="w-full h-11 px-4 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Delivery Street Address
                  </label>
                  <textarea
                    rows={2}
                    value={customerForm.deliveryAddress}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                    placeholder="Door number, street name, landmark..."
                    className="w-full p-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      City / Area
                    </label>
                    <input
                      type="text"
                      value={customerForm.deliveryCityName}
                      onChange={(e) => setCustomerForm((prev) => ({ ...prev, deliveryCityName: e.target.value }))}
                      placeholder="e.g. Madurai"
                      className="w-full h-11 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={customerForm.deliveryStateName}
                      onChange={(e) => setCustomerForm((prev) => ({ ...prev, deliveryStateName: e.target.value }))}
                      placeholder="Tamil Nadu"
                      className="w-full h-11 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={customerForm.pincode}
                      onChange={(e) => setCustomerForm((prev) => ({ ...prev, pincode: e.target.value }))}
                      placeholder="625001"
                      className="w-full h-11 px-3 rounded-xl border border-border bg-card text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Order Note / Packing Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special instructions from customer or admin notes..."
                    className="w-full p-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs resize-y"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 rounded-full font-semibold text-sm cursor-pointer"
                    onClick={() => setIsCustomerModalOpen(false)}
                    disabled={updateCustomerMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 rounded-full font-bold text-sm !bg-[#e24000] hover:!bg-[#c93800] !text-white cursor-pointer shadow-md shadow-[#e24000]/20 transition-all border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={updateCustomerMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 shrink-0 text-white" />
                    {updateCustomerMutation.isPending ? 'Saving...' : 'Save Customer Details'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Alter Order Products & Items Modal */}
      {isItemsModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-card border border-border rounded-3xl p-5 sm:p-7 w-full max-w-4xl shadow-2xl space-y-5 animate-scale-in max-h-[86vh] flex flex-col relative z-[101] my-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-foreground">
                      Alter Order Products & Items
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Add new products, adjust quantities, or remove items for Order #{order.invoiceNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsItemsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1.5">
                {/* 1. Add Product From Catalog (Search + Dropdown) */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-brand" /> Add Product From Catalog
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {isCatalogLoading ? 'Loading catalog...' : `${filteredCatalogProducts.length} products available`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    {/* Search Input Filter */}
                    <div className="relative md:col-span-5">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        placeholder="Filter catalog by name or SKU..."
                        className="w-full h-11 pl-10 pr-8 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                      />
                      {itemSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setItemSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full text-xs"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown Selector */}
                    <div className="md:col-span-5">
                      <select
                        value={selectedCatalogProductId}
                        onChange={(e) => setSelectedCatalogProductId(e.target.value)}
                        disabled={isCatalogLoading || filteredCatalogProducts.length === 0}
                        className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs font-sans truncate"
                      >
                        <option value="">
                          {isCatalogLoading
                            ? 'Loading catalog products...'
                            : filteredCatalogProducts.length === 0
                            ? 'No products match filter'
                            : `-- Select a product (${filteredCatalogProducts.length}) --`}
                        </option>
                        {filteredCatalogProducts.map((prod: any) => (
                          <option key={prod.id} value={String(prod.id)}>
                            {prod.name} ({prod.sku || `PRD-${prod.id}`}) — ₹{toNumber(prod.sellingPrice).toFixed(0)} [Stock: {prod.stockQuantity ?? 0}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Add Button */}
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        className="w-full h-11 rounded-xl text-xs font-semibold cursor-pointer shadow-xs flex items-center justify-center gap-1.5 !bg-[#e24000] hover:!bg-[#c93800] !text-white disabled:opacity-50 disabled:cursor-not-allowed border-0"
                        disabled={!selectedCatalogProductId}
                        onClick={() => {
                          const prod = allCatalogProducts.find((p: any) => String(p.id) === selectedCatalogProductId);
                          if (prod) {
                            handleAddProductToOrder(prod);
                            setSelectedCatalogProductId('');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 shrink-0 text-white" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Quick-Pick Matching Results (if searching) */}
                  {itemSearchQuery.trim().length > 0 && (
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border/60 shadow-md">
                      {isCatalogLoading ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">Searching catalog...</div>
                      ) : filteredCatalogProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No matching products found</div>
                      ) : (
                        filteredCatalogProducts.slice(0, 8).map((prod: any) => {
                          const isAlreadyAdded = editableItems.some((it) => it.productId === prod.id);
                          return (
                            <div
                              key={prod.id}
                              className="p-3 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{prod.name}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  SKU: {prod.sku || `PRD-${prod.id}`} • Available Stock: {prod.stockQuantity ?? 0}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-bold text-xs sm:text-sm font-mono text-foreground">
                                  {formatCurrency(toNumber(prod.sellingPrice))}
                                </span>
                                <Button
                                  size="sm"
                                  variant={isAlreadyAdded ? 'outline' : 'primary'}
                                  className="h-8 px-3 rounded-full text-xs font-semibold cursor-pointer shadow-2xs"
                                  onClick={() => handleAddProductToOrder(prod)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {isAlreadyAdded ? 'Add More' : 'Add to Order'}
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Order Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Items in Order ({editableItems.length})
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      At least 1 product required
                    </span>
                  </div>

                  {editableItems.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 text-destructive text-sm font-medium">
                      Order cannot be empty. Please add at least one product from above.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                      {editableItems.map((item) => (
                        <div
                          key={item.productId}
                          className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                              <Package className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{item.productNameSnapshot}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {formatCurrency(item.sellingPriceSnapshot)} / unit
                                {item.productSkuSnapshot ? ` • ${item.productSkuSnapshot}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Quantity Counter & Line Total */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <div className="flex items-center border border-border rounded-full bg-muted/30 p-0.5">
                              <button
                                type="button"
                                onClick={() => handleItemQuantityChange(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted cursor-pointer transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-10 text-center font-mono font-bold text-xs text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleItemQuantityChange(item.productId, item.quantity + 1)}
                                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="w-24 text-right">
                              <span className="font-mono font-bold text-foreground text-sm">
                                {formatCurrency(item.sellingPriceSnapshot * item.quantity)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors cursor-pointer"
                              title="Remove Product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Financial Calculation & Summary Bar */}
                <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Order Summary & Charges Breakdown
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-muted-foreground font-medium mb-1">
                        Products Subtotal (₹)
                      </label>
                      <div className="h-10 px-3.5 rounded-xl border border-border bg-card flex items-center font-mono font-bold text-foreground">
                        {formatCurrency(editableSubtotal)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Wholesale selling prices</p>
                    </div>

                    <div>
                      <label className="block text-muted-foreground font-medium mb-1">
                        Delivery Charge (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editDeliveryCharge}
                        onChange={(e) => setEditDeliveryCharge(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-border bg-card font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Added to order total</p>
                    </div>

                    <div>
                      <label className="block text-muted-foreground font-medium mb-1">
                        Additional Discount / Coupon (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editDiscountAmount}
                        onChange={(e) => setEditDiscountAmount(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-border bg-card font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Extra cash discount deduction</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-foreground">Calculated Grand Total:</span>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {formatCurrency(editableSubtotal)} + {formatCurrency(parsedDeliveryCharge)} - {formatCurrency(parsedDiscountAmount)}
                      </p>
                    </div>
                    <span className="font-mono text-lg sm:text-xl font-bold text-brand">
                      {formatCurrency(editableTotal)}
                    </span>
                  </div>
                </div>

                {/* Automatic Stock Notice */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Inventory reconciling is active: Stock will be automatically reserved or restored in the database when you save changes.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center gap-3 pt-3 border-t border-border shrink-0">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-full font-semibold text-sm cursor-pointer"
                  onClick={() => setIsItemsModalOpen(false)}
                  disabled={updateOrderItemsMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 rounded-full font-bold text-sm !bg-[#e24000] hover:!bg-[#c93800] !text-white cursor-pointer shadow-md shadow-[#e24000]/20 transition-all border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (editableItems.length === 0) {
                      toast.error('Please add at least one product');
                      return;
                    }
                    updateOrderItemsMutation.mutate({
                      items: editableItems,
                      deliveryCharge: parsedDeliveryCharge,
                      discountAmount: parsedDiscountAmount,
                    });
                  }}
                  disabled={editableItems.length === 0 || updateOrderItemsMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 shrink-0 text-white" />
                  {updateOrderItemsMutation.isPending ? 'Saving Changes...' : 'Save Order Changes'}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export default withAdminShell(AdminOrderDetailPageContent);
