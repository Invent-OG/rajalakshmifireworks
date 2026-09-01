
export interface OrderExportRow {
  invoiceNumber: string;
  customerName: string;
  customerMobile: string;
  orderStatus: string;
  fulfillmentType: string;
  subtotal: string;
  discountAmount: string;
  deliveryCharge: string;
  totalAmount: string;
  itemsSummary: string;
  placedAt: string;
  deliveryAddress: string;
}

export function generateOrdersCSV(orders: OrderExportRow[]): string {
  const headers = [
    'Invoice Number',
    'Customer Name',
    'Customer Mobile',
    'Status',
    'Fulfillment',
    'Subtotal (INR)',
    'Discount (INR)',
    'Delivery (INR)',
    'Total Amount (INR)',
    'Items',
    'Placed At',
    'Address',
  ];

  const escapeCSV = (field: string | null | undefined): string => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = orders.map((o) => [
    escapeCSV(o.invoiceNumber),
    escapeCSV(o.customerName),
    escapeCSV(o.customerMobile),
    escapeCSV(o.orderStatus),
    escapeCSV(o.fulfillmentType),
    escapeCSV(o.subtotal),
    escapeCSV(o.discountAmount),
    escapeCSV(o.deliveryCharge),
    escapeCSV(o.totalAmount),
    escapeCSV(o.itemsSummary),
    escapeCSV(o.placedAt),
    escapeCSV(o.deliveryAddress),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateProductsCSV(
  products: Array<{
    name: string;
    category: string;
    sku?: string | null;
    mrp: string;
    sellingPrice: string;
    stockQuantity: number;
    isActive: boolean;
  }>
): string {
  const headers = ['Product Name', 'Category', 'SKU', 'MRP (INR)', 'Selling Price (INR)', 'Stock', 'Status'];

  const escapeCSV = (field: string | null | undefined): string => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = products.map((p) => [
    escapeCSV(p.name),
    escapeCSV(p.category),
    escapeCSV(p.sku || ''),
    escapeCSV(p.mrp),
    escapeCSV(p.sellingPrice),
    escapeCSV(String(p.stockQuantity)),
    escapeCSV(p.isActive ? 'Active' : 'Inactive'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateCustomersCSV(
  customers: Array<{
    name: string;
    mobile: string;
    email?: string | null;
    totalOrders: number;
    totalSpent: string;
    createdAt: string;
  }>
): string {
  const headers = ['Customer Name', 'Mobile', 'Email', 'Total Orders', 'Total Spent (INR)', 'Customer Since'];

  const escapeCSV = (field: string | null | undefined): string => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = customers.map((c) => [
    escapeCSV(c.name),
    escapeCSV(c.mobile),
    escapeCSV(c.email || ''),
    escapeCSV(String(c.totalOrders)),
    escapeCSV(c.totalSpent),
    escapeCSV(c.createdAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
