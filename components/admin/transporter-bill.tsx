'use client';

import React, { useRef } from 'react';
import {
  Printer,
  Truck,
  Package,
  Phone,
  MapPin,
  User,
  Building,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { APP_CONFIG } from '@/lib/constants/config';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Portal } from '@/components/ui/portal';

export interface TransporterBillData {
  orderId: number;
  invoiceNumber: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string | null;
  shippingAddress: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  customerNotes?: string | null;
  packageCount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  placedAt: string | Date;
  // Carrier / Transport details
  carrierName?: string | null;
  driverMobile?: string | null;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  lrNumber?: string | null;
  carriageDetails?: string | null;
  itemsCount?: number;
}

export interface TransporterBillProps {
  data: TransporterBillData;
  storeSettings?: Record<string, string>;
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

/**
 * Isolated print helper for the Transporter Bill.
 * Renders in a dedicated offscreen iframe to ensure crisp, 100% black & white / print-adjusted styling
 * without any administrative UI or dark mode interference.
 */
export function printTransporterBillSheet(billTitle?: string, billNumber?: string) {
  if (typeof window === 'undefined') return;

  const container = document.getElementById('transporter-bill-sheet');
  if (!container) {
    window.print();
    return;
  }

  const existingFrame = document.getElementById('transporter-bill-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'transporter-bill-print-frame';
  iframe.setAttribute(
    'style',
    'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-9999;'
  );
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${billTitle || 'Transporter Bill'} - #${billNumber || 'Order'}</title>
      ${styles}
      <style>
        @page {
          size: A4 portrait;
          margin: 6mm 8mm 8mm 8mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          width: 100% !important;
          overflow: visible !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        #transporter-bill-sheet {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 14px !important;
          border: 2px solid #000000 !important;
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        .no-print {
          display: none !important;
        }
      </style>
    </head>
    <body>
      ${container.outerHTML}
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 400);
}

/**
 * Procedural SVG Barcode graphic representing the Bill / Waybill No.
 */
function VisualBarcode({ value }: { value: string }) {
  // Generate consistent bar widths based on char codes
  const bars: number[] = [];
  const cleanVal = (value || 'FW-20261013-0001').replace(/[^a-zA-Z0-9]/g, '');
  for (let i = 0; i < cleanVal.length; i++) {
    const code = cleanVal.charCodeAt(i);
    bars.push((code % 3) + 1);
    bars.push(1);
    bars.push(((code * 2) % 4) + 1);
    bars.push(2);
  }

  return (
    <div className="flex flex-col items-center">
      <svg className="h-9 w-48 text-black" viewBox="0 0 200 36" fill="currentColor">
        <rect x="0" y="0" width="3" height="36" />
        <rect x="5" y="0" width="2" height="36" />
        <rect x="10" y="0" width="4" height="36" />
        {bars.slice(0, 24).map((w, idx) => (
          <rect
            key={idx}
            x={16 + idx * 7}
            y="0"
            width={Math.min(w, 4)}
            height="36"
          />
        ))}
        <rect x="188" y="0" width="3" height="36" />
        <rect x="194" y="0" width="2" height="36" />
      </svg>
      <span className="font-mono text-[10px] tracking-widest font-bold uppercase mt-0.5 text-neutral-800">
        *{value}*
      </span>
    </div>
  );
}

export function TransporterBillView({
  data,
  storeSettings = {},
  isOpen = true,
  onClose,
  isModal = true,
}: TransporterBillProps) {
  const storeName = storeSettings.INVOICE_STORE_NAME || APP_CONFIG.STORE_NAME || 'Rajalakshmi Fireworks';
  const storeAddress =
    storeSettings.INVOICE_STORE_ADDRESS ||
    APP_CONFIG.STORE_ADDRESS ||
    '123 Factory Road, Sivakasi, Tamil Nadu - 626123';
  const storePhone = storeSettings.INVOICE_STORE_PHONE || APP_CONFIG.STORE_PHONE || '+91 98421 00001';
  const storeEmail = storeSettings.INVOICE_STORE_EMAIL || APP_CONFIG.STORE_EMAIL || 'sales@rajalakshmifireworks.com';
  const storeGstin = storeSettings.INVOICE_GSTIN || '33CKMPR3170C1Z9';
  const storeLicenseNo = storeSettings.INVOICE_LICENSE_NO || 'E/SC/TN/2024/00142 (Green Fireworks)';

  const boxesCount = Math.max(1, data.packageCount || 1);
  const formattedDate = formatDateTime(data.placedAt);

  const handlePrint = () => {
    printTransporterBillSheet('Transporter Bill', data.invoiceNumber);
  };

  const handleCopySummary = () => {
    const text = `
TRANSPORTER BILL / DISPATCH SLIP
-----------------------------------
Company: ${storeName} (Sivakasi)
Phone: ${storePhone}
Bill No: ${data.invoiceNumber}
Date: ${formattedDate}
Boxes / Cases: ${boxesCount} ${boxesCount === 1 ? 'Box' : 'Boxes'}
Customer: ${data.customerName}
Phone: ${data.customerMobile}
Address: ${data.shippingAddress?.address || ''}, ${data.shippingAddress?.city || ''} - ${data.shippingAddress?.pincode || ''}
${data.customerNotes ? `Landmark: ${data.customerNotes}` : ''}
Carrier: ${data.carrierName || data.carriageDetails || 'Assigned Partner'}
${data.driverMobile ? `Driver: ${data.driverMobile}` : ''}
    `.trim();

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Transporter bill summary copied!');
    }
  };

  // The actual printable Transporter Bill Sheet
  const billContent = (
    <div
      id="transporter-bill-sheet"
      className="bg-white text-black p-5 sm:p-7 rounded-2xl border-2 border-black space-y-4 font-sans text-xs max-w-4xl mx-auto shadow-sm select-text"
    >
      {/* 1. TOP HEADER & TITLE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b-2 border-black gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 font-black uppercase tracking-wider text-[11px] rounded-xs">
              Sivakasi Parcel Logistics
            </span>
            <span className="font-bold text-[10px] text-neutral-600 uppercase tracking-wider">
              Waybill / Transport Challan
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            TRANSPORTER DISPATCH BILL
          </h1>
          <p className="text-[11px] text-neutral-600 font-medium">
            Parcel Lorry Carriage Voucher • Consignment Box Paste Slip
          </p>
        </div>

        {/* Barcode & Bill No */}
        <div className="sm:text-right flex flex-col items-start sm:items-end">
          <VisualBarcode value={data.invoiceNumber} />
          <div className="mt-1 font-mono font-bold text-xs">
            BILL NO: <span className="text-sm font-black">{data.invoiceNumber}</span>
          </div>
        </div>
      </div>

      {/* 2. PROMINENT BOX / CASES COUNT BANNER */}
      <div className="p-3 bg-neutral-100 border-2 border-black rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-600">
              Total Consignment Quantity
            </div>
            <div className="text-base sm:text-lg font-black uppercase tracking-tight text-black">
              NO. OF BOXES / CASES: {boxesCount} {boxesCount === 1 ? 'CASE / BOX' : 'CASES / BOXES'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-300">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-600 block">Total Items</span>
            <span className="font-mono font-black text-sm text-black">
              {data.itemsCount || 1} {data.itemsCount === 1 ? 'Item' : 'Items'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. CONSIGNOR (COMPANY) & CONSIGNEE (CUSTOMER) 2-COLUMN GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* LEFT COLUMN: COMPANY DETAILS (CONSIGNOR) */}
        <div className="p-3.5 rounded-lg border-2 border-neutral-800 bg-white space-y-2">
          <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-300 font-bold uppercase text-[11px] text-neutral-700 tracking-wider">
            <Building className="h-3.5 w-3.5 text-neutral-800" />
            <span>Consignor (Company Details)</span>
          </div>

          <div className="space-y-1">
            <h2 className="font-black text-sm uppercase text-black">{storeName}</h2>
            <p className="text-[11px] text-neutral-700 leading-snug">
              {storeAddress}
            </p>
            <div className="pt-1 flex flex-col gap-0.5 text-[11px]">
              <div>
                <span className="font-bold">Phone / Dispatch:</span>{' '}
                <span className="font-mono font-bold text-black">{storePhone}</span>
              </div>
              <div>
                <span className="font-bold">Email:</span> {storeEmail}
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-0.5 font-mono text-[10px]">
                <span className="bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300 font-bold">
                  GSTIN: {storeGstin}
                </span>
                <span className="bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300 font-bold">
                  PESO: {storeLicenseNo}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER DETAILS (CONSIGNEE / DELIVER TO) */}
        <div className="p-3.5 rounded-lg border-2 border-neutral-800 bg-white space-y-2">
          <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-300 font-bold uppercase text-[11px] text-neutral-700 tracking-wider">
            <User className="h-3.5 w-3.5 text-neutral-800" />
            <span>Consignee (Customer Details)</span>
          </div>

          <div className="space-y-1">
            <h2 className="font-black text-sm uppercase text-black">{data.customerName}</h2>

            <div className="flex items-center gap-1.5 py-0.5">
              <Phone className="h-3.5 w-3.5 text-black shrink-0" />
              <span className="font-mono text-sm font-black text-black tracking-wide">
                +91 {data.customerMobile}
              </span>
            </div>

            {data.customerEmail && (
              <p className="text-[11px] text-neutral-600">Email: {data.customerEmail}</p>
            )}

            <div className="pt-1 border-t border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-600 uppercase block mb-0.5">
                Shipping / Destination Address:
              </span>
              <p className="font-medium text-xs leading-relaxed text-neutral-900">
                {data.shippingAddress?.address || 'Direct godown collection / Counter delivery'}
                {data.shippingAddress?.city ? `, ${data.shippingAddress.city}` : ''}
                {data.shippingAddress?.state ? `, ${data.shippingAddress.state}` : ''}
                {data.shippingAddress?.pincode ? ` - ${data.shippingAddress.pincode}` : ''}
              </p>

              {data.customerNotes && (
                <div className="mt-1.5 p-1.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-medium">
                  <strong className="uppercase text-[10px] block">Landmark / Delivery Instructions:</strong>
                  {data.customerNotes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. TRANSPORTER & LOGISTICS ASSIGNMENT SECTION */}
      <div className="p-3.5 rounded-lg border-2 border-black bg-neutral-50 space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-300 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-black tracking-wider">
            <Truck className="h-4 w-4 text-black" />
            <span>Assigned Carrier / Transporter Details</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-neutral-200 px-2 py-0.5 rounded border border-neutral-400">
            Date: {formattedDate}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div>
            <span className="text-[10px] font-bold text-neutral-600 uppercase block">Transporter / Partner</span>
            <p className="font-black text-black text-sm mt-0.5">
              {data.carrierName || data.carriageDetails || 'Assigned Delivery Partner'}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-neutral-600 uppercase block">Driver / Partner Phone</span>
            <p className="font-mono font-bold text-black text-sm mt-0.5">
              {data.driverMobile || 'Available on booking'}
            </p>
          </div>
        </div>
      </div>

      {/* 5. BOX LABELS CHECKLIST & HANDLING INSTRUCTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Box Checklist */}
        <div className="p-3 rounded-lg border border-neutral-300 bg-white">
          <span className="text-[10px] font-bold uppercase text-neutral-600 block mb-1.5">
            Carton Verification Matrix
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: Math.min(boxesCount, 8) }).map((_, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-1 rounded bg-neutral-100 border border-neutral-300"
              >
                <span className="h-2 w-2 rounded-full border border-black inline-block" />
                Box {idx + 1}/{boxesCount}
              </span>
            ))}
          </div>
        </div>

        {/* Green Fireworks Declaration */}
        <div className="p-3 rounded-lg border border-neutral-300 bg-white sm:col-span-2">
          <span className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
            Statutory Green Crackers Safety Declaration
          </span>
          <p className="text-[10px] text-neutral-700 leading-snug">
            Consignment contains certified <strong>PESO Green Fireworks (Class 1.4G)</strong> compliant with Supreme Court of India standards. Handle with care. Keep in dry storage away from open flame or sparks.
          </p>
        </div>
      </div>

      {/* 6. SIGNATURE & STAMP FOOTER */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-black text-center text-[10px]">
        <div className="space-y-6">
          <div className="font-serif italic text-neutral-400 text-xs">Rajalakshmi Sivakasi</div>
          <div className="border-t border-dashed border-neutral-400 pt-1 font-bold uppercase text-neutral-700">
            Consignor Signature (Store)
          </div>
        </div>

        <div className="space-y-6">
          <div className="font-serif italic text-neutral-400 text-xs">Driver / Lorry Agent</div>
          <div className="border-t border-dashed border-neutral-400 pt-1 font-bold uppercase text-neutral-700">
            Transporter Handover Sign
          </div>
        </div>

        <div className="space-y-6">
          <div className="font-serif italic text-neutral-400 text-xs">Customer Handover</div>
          <div className="border-t border-dashed border-neutral-400 pt-1 font-bold uppercase text-neutral-700">
            Receiver / Consignee Sign
          </div>
        </div>
      </div>

      {/* Footer watermark */}
      <div className="text-center text-[9px] text-neutral-500 font-mono pt-1">
        Rajalakshmi Fireworks Sivakasi • Generated Auto-Waybill for Order #{data.invoiceNumber} • www.rajalakshmifireworks.com
      </div>
    </div>
  );

  // If rendered as standalone (non-modal)
  if (!isModal) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto p-4 animate-fade-in">
        <div className="flex items-center justify-between gap-3 no-print pb-3 border-b border-border flex-wrap">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
              <Truck className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-bold text-sm text-foreground">Transporter Bill / Dispatch Note</h2>
              <p className="text-xs text-muted-foreground">Order-{data.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="h-9 px-3 text-xs font-semibold rounded-full cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy Summary
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-9 px-4 text-xs font-bold rounded-full bg-black text-white hover:bg-neutral-800 cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print Transporter Bill
            </Button>
          </div>
        </div>

        {billContent}
      </div>
    );
  }

  // If rendered as modal popup
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-card border border-border shadow-2xl z-10 overflow-hidden animate-scale-in">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card shrink-0 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                    Transporter Bill Auto-Generated
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    Ready to Print
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Order-{data.invoiceNumber} • {boxesCount} {boxesCount === 1 ? 'Box' : 'Boxes'} • Deliver to {data.customerName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                className="hidden sm:inline-flex h-8 px-3 text-xs font-semibold rounded-full cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
              </Button>

              <Button
                size="sm"
                onClick={handlePrint}
                className="h-8.5 px-4 text-xs font-bold rounded-full bg-black hover:bg-neutral-800 text-white cursor-pointer shadow-sm"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print Bill
              </Button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Modal Body / Scrollable Sheet Preview */}
          <div className="p-4 sm:p-6 overflow-y-auto bg-muted/20 flex-1">
            {billContent}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Paste this bill onto the shipment boxes or hand it over to the lorry driver.</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/admin/orders/${data.orderId}/transporter-bill`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-xs text-brand hover:underline mr-2"
              >
                Open Fullscreen <ExternalLink className="h-3 w-3" />
              </a>

              {onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-8 px-4 rounded-full text-xs font-bold cursor-pointer"
                >
                  Close
                </Button>
              )}

              <Button
                size="sm"
                onClick={handlePrint}
                className="h-8 px-4 text-xs font-bold rounded-full bg-black text-white hover:bg-neutral-800 cursor-pointer shadow-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print Bill
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
