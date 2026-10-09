'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { sharedQueryClient } from '@/components/providers';
import { queryKeys } from '@/lib/query/keys';
import {
  Printer,
  Sliders,
  RotateCcw,
  Check,
  Save,
  FileText,
  Building2,
  CreditCard,
  Upload,
  X,
  Sparkles,
  ArrowLeft,
  Trash2,
  Image as ImageIcon,
  PenTool,
} from 'lucide-react';
import { formatCurrency, toNumber } from '@/lib/utils/format';
import { APP_CONFIG } from '@/lib/constants/config';
import { toast } from 'sonner';

export interface InvoiceCustomizerConfig {
  // Style Template: 'minimalist' matches Image 2 exactly
  templateStyle: 'minimalist' | 'classic';

  // Document Identity
  documentTitle: string; // e.g. "INVOICE"
  documentSubtitle: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;

  // Customer / Issued To
  customerName: string;
  customerCompany: string;
  customerAddress: string;
  customerCityState: string;
  customerMobile: string;
  customerEmail: string;

  // Store / Company Details
  storeName: string;
  storeTagline: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeGstin: string;
  storeLicenseNo: string;

  // Uploaded Media
  logoImageUrl: string | null;
  showLogo: boolean;
  signatureImageUrl: string | null;
  showSignature: boolean;
  signatoryName: string;

  // Visibility Toggles
  showCustomerPhone: boolean;
  showCustomerEmail: boolean;
  showDeliveryAddress: boolean;
  showPaymentInfo: boolean;
  showTaxOrSavings: boolean;
  showTerms: boolean;
  showGstin: boolean;

  // Bank & Payment Info
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;

  // Terms & Notes
  notes: string;
  termsAndConditions: string;

  // Typography scale
  fontSize: 'compact' | 'standard' | 'large';
}

function formatDateDots(d: string | Date | undefined): string {
  if (!d) return '07.10.2026';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

const DEFAULT_INVOICE_CONFIG: InvoiceCustomizerConfig = {
  templateStyle: 'minimalist',
  documentTitle: 'INVOICE',
  documentSubtitle: '',
  invoiceNumber: '',
  invoiceDate: '',
  dueDate: 'Immediate / Dispatch',
  customerName: '',
  customerCompany: '',
  customerAddress: '',
  customerCityState: '',
  customerMobile: '',
  customerEmail: '',
  storeName: APP_CONFIG.STORE_NAME || 'Rajalakshmi Fireworks',
  storeTagline: 'Factory Direct Sivakasi Fireworks',
  storeAddress: '123 Factory Road, Sivakasi, Tamil Nadu 626123',
  storePhone: APP_CONFIG.STORE_PHONE || '+91 98421 00001',
  storeEmail: APP_CONFIG.STORE_EMAIL || 'sales@rajalakshmifireworks.com',
  storeGstin: '33AAAAA0000A1Z5',
  storeLicenseNo: 'E/SC/TN/2024/00142',
  logoImageUrl: null,
  showLogo: true,
  signatureImageUrl: null,
  showSignature: true,
  signatoryName: 'Authorized Signatory',
  showCustomerPhone: true,
  showCustomerEmail: true,
  showDeliveryAddress: true,
  showPaymentInfo: true,
  showTaxOrSavings: true,
  showTerms: true,
  showGstin: true,
  bankName: 'State Bank of India',
  accountName: 'Rajalakshmi Fireworks',
  accountNumber: '0123 4567 8901',
  ifscCode: 'SBIN0001234',
  upiId: 'rajalakshmifireworks@sbi',
  notes: 'All items conform to Supreme Court & PESO green fireworks standards.',
  termsAndConditions:
    '1. All fireworks are manufactured & dispatched under Supreme Court & PESO safety standards.\n2. Goods once sold cannot be returned or exchanged.\n3. Goods transported at buyer\'s risk through authorized transport operators.\n4. Subject exclusively to Sivakasi Jurisdiction.',
  fontSize: 'standard',
};

interface InvoiceCustomizerProps {
  order: any;
  initialSettings?: Record<string, string>;
  isModal?: boolean;
  onClose?: () => void;
}

function InvoiceCustomizerContent({
  order,
  initialSettings = {},
  isModal = false,
  onClose,
}: InvoiceCustomizerProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const address = order?.addressSnapshot as {
    address?: string;
    city?: string;
    pincode?: string;
    area?: string;
    deliveryArea?: string;
  } | null;

  const [config, setConfig] = useState<InvoiceCustomizerConfig>(() => {
    let savedLocalLogo: string | null = null;
    let savedLocalSignature: string | null = null;
    let savedConfig: Partial<InvoiceCustomizerConfig> = {};

    if (typeof window !== 'undefined') {
      savedLocalLogo = localStorage.getItem('raj_invoice_custom_logo');
      savedLocalSignature = localStorage.getItem('raj_invoice_custom_signature');
      const savedStr = localStorage.getItem('raj_invoice_config_v2');
      if (savedStr) {
        try {
          savedConfig = JSON.parse(savedStr);
        } catch {}
      }
    }

    const areaName = address?.area || address?.deliveryArea;
    const cityState = address
      ? [areaName, address.city, address.pincode].filter(Boolean).join(' · ')
      : 'Sivakasi, Tamil Nadu';

    const resolvedTerms =
      (savedConfig.termsAndConditions && savedConfig.termsAndConditions.trim().length > 0)
        ? savedConfig.termsAndConditions
        : (initialSettings['INVOICE_TERMS'] && initialSettings['INVOICE_TERMS'].trim().length > 0)
          ? initialSettings['INVOICE_TERMS']
          : DEFAULT_INVOICE_CONFIG.termsAndConditions;

    return {
      ...DEFAULT_INVOICE_CONFIG,
      ...savedConfig,
      documentTitle: initialSettings['INVOICE_DEFAULT_TITLE'] || savedConfig.documentTitle || DEFAULT_INVOICE_CONFIG.documentTitle,
      invoiceNumber: order?.invoiceNumber || '01234',
      invoiceDate: formatDateDots(order?.placedAt),
      customerName: order?.customerNameSnapshot || 'Valued Customer',
      customerAddress: address?.address || 'Direct counter pickup / Sivakasi Depot',
      customerCityState: cityState,
      customerMobile: order?.customerMobileSnapshot ? `+91 ${order.customerMobileSnapshot}` : '',
      customerEmail: order?.customer?.email || '',
      logoImageUrl: savedLocalLogo || savedConfig.logoImageUrl || null,
      signatureImageUrl: savedLocalSignature || savedConfig.signatureImageUrl || null,
      storeGstin: initialSettings['INVOICE_GSTIN'] || savedConfig.storeGstin || DEFAULT_INVOICE_CONFIG.storeGstin,
      bankName: initialSettings['INVOICE_BANK_NAME'] || savedConfig.bankName || DEFAULT_INVOICE_CONFIG.bankName,
      accountName: initialSettings['INVOICE_ACCOUNT_NAME'] || savedConfig.accountName || DEFAULT_INVOICE_CONFIG.accountName,
      accountNumber: initialSettings['INVOICE_ACCOUNT_NUMBER'] || savedConfig.accountNumber || DEFAULT_INVOICE_CONFIG.accountNumber,
      ifscCode: initialSettings['INVOICE_IFSC'] || savedConfig.ifscCode || DEFAULT_INVOICE_CONFIG.ifscCode,
      upiId: initialSettings['INVOICE_UPI_ID'] || savedConfig.upiId || DEFAULT_INVOICE_CONFIG.upiId,
      termsAndConditions: resolvedTerms,
      showTerms: savedConfig.showTerms !== false,
    };
  });

  // Fetch store settings via TanStack Query when initialSettings is empty
  const { data: storeSettingsData } = useQuery<{ settings?: Record<string, string> }>({
    queryKey: queryKeys.admin.settings.all,
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json();
    },
    enabled: Object.keys(initialSettings).length === 0,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (storeSettingsData?.settings) {
      const s = storeSettingsData.settings;
      setConfig((prev) => ({
        ...prev,
        storeGstin: s.INVOICE_GSTIN || prev.storeGstin,
        bankName: s.INVOICE_BANK_NAME || prev.bankName,
        accountName: s.INVOICE_ACCOUNT_NAME || prev.accountName,
        accountNumber: s.INVOICE_ACCOUNT_NUMBER || prev.accountNumber,
        ifscCode: s.INVOICE_IFSC || prev.ifscCode,
        upiId: s.INVOICE_UPI_ID || prev.upiId,
        termsAndConditions:
          prev.termsAndConditions && prev.termsAndConditions.trim().length > 0
            ? prev.termsAndConditions
            : (s.INVOICE_TERMS || DEFAULT_INVOICE_CONFIG.termsAndConditions),
      }));
    }
  }, [storeSettingsData]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'style' | 'media' | 'details' | 'payment' | 'terms'>('style');

  const handleUpdate = <K extends keyof InvoiceCustomizerConfig>(
    key: K,
    val: InvoiceCustomizerConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  // Handle Logo file upload (PNG/JPG/SVG/WEBP)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Logo image must be under 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        handleUpdate('logoImageUrl', result);
        if (typeof window !== 'undefined') {
          localStorage.setItem('raj_invoice_custom_logo', result);
        }
        toast.success('Logo uploaded and applied');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    handleUpdate('logoImageUrl', null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('raj_invoice_custom_logo');
    }
    toast.info('Custom logo removed');
  };

  // Handle Signature file upload (PNG/JPG/SVG/WEBP)
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Signature image must be under 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        handleUpdate('signatureImageUrl', result);
        if (typeof window !== 'undefined') {
          localStorage.setItem('raj_invoice_custom_signature', result);
        }
        toast.success('Signature uploaded and applied');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    handleUpdate('signatureImageUrl', null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('raj_invoice_custom_signature');
    }
    toast.info('Custom signature removed, using script signature');
  };

  const handleSaveDefaults = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('raj_invoice_config_v2', JSON.stringify(config));
    }
    toast.success('Invoice style & preferences saved as default');
  };

  const handleReset = () => {
    if (confirm('Reset invoice layout to original template?')) {
      setConfig({
        ...DEFAULT_INVOICE_CONFIG,
        invoiceNumber: order?.invoiceNumber || '01234',
        invoiceDate: formatDateDots(order?.placedAt),
        customerName: order?.customerNameSnapshot || 'Valued Customer',
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('raj_invoice_config_v2');
      }
      toast.info('Invoice layout reset to original style');
    }
  };

  // Font sizing styles
  const fontSizes = {
    compact: {
      title: 'text-3xl sm:text-4xl tracking-[0.2em]',
      heading: 'text-[11px] tracking-wider',
      body: 'text-xs leading-normal',
      tableText: 'text-xs py-2',
      total: 'text-base',
    },
    standard: {
      title: 'text-4xl sm:text-5xl tracking-[0.25em]',
      heading: 'text-xs tracking-wider',
      body: 'text-sm leading-relaxed',
      tableText: 'text-sm py-3.5',
      total: 'text-lg',
    },
    large: {
      title: 'text-5xl sm:text-6xl tracking-[0.25em]',
      heading: 'text-sm tracking-wider',
      body: 'text-base leading-relaxed',
      tableText: 'text-base py-4',
      total: 'text-xl',
    },
  }[config.fontSize];

  return (
    <div className="relative w-full bg-neutral-100 text-neutral-900 font-sans print:bg-white print:p-0 print:m-0">
      {/* Hidden File Inputs for Logo & Signature Uploads */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={signatureInputRef}
        onChange={handleSignatureUpload}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />

      {/* Embedded CSS for flawless clean print */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-sheet-container, #invoice-sheet-container * {
            visibility: visible;
          }
          #invoice-sheet-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 2.5rem !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .invoice-no-print {
            display: none !important;
          }
        }
      `}} />

      {/* ================= TOP ACTION BAR (HIDDEN IN PRINT) ================= */}
      <div className="invoice-no-print sticky top-0 z-40 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 shadow-xs px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isModal && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Order
              </button>
            ) : (
              <a
                href={`/admin/orders/${order.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Order #{order.invoiceNumber}
              </a>
            )}
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              {config.documentTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Logo quick upload button */}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-2xs"
              title="Upload your custom store logo image"
            >
              <ImageIcon className="h-3.5 w-3.5 text-indigo-500" />
              <span>{config.logoImageUrl ? 'Change Logo' : 'Upload Logo'}</span>
            </button>

            {/* Signature quick upload button */}
            <button
              type="button"
              onClick={() => signatureInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-2xs"
              title="Upload your handwritten signature image (PNG/JPG)"
            >
              <PenTool className="h-3.5 w-3.5 text-emerald-500" />
              <span>{config.signatureImageUrl ? 'Change Signature' : 'Upload Signature'}</span>
            </button>

            {/* Terms quick edit button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('terms');
                setIsDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-2xs"
              title="Edit Terms & Conditions"
            >
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              <span>Terms</span>
            </button>

            {/* Customize Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isDrawerOpen
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 shadow-2xs'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Customize</span>
            </button>

            {/* Save Default Button */}
            <button
              type="button"
              onClick={handleSaveDefaults}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors cursor-pointer"
              title="Save current layout & logos as default for future orders"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save Default</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 hover:bg-black text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= CUSTOMIZE CONTROL DRAWER ================= */}
      {isDrawerOpen && (
        <aside className="invoice-no-print fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-[#181818] border-l border-gray-200 dark:border-neutral-800 shadow-2xl flex flex-col animate-fade-in">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-gray-50/70 dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Customize Invoice Slip</h3>
                <p className="text-[11px] text-muted-foreground">Adjust text, upload logo & signature</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 flex items-center justify-center text-muted-foreground cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Tabs */}
          <div className="flex border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#181818] px-2 pt-2 gap-1 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'style', label: 'Layout & Text' },
              { id: 'media', label: 'Logo & Sign' },
              { id: 'details', label: 'Issued To' },
              { id: 'payment', label: 'Payment Info' },
              { id: 'terms', label: 'Terms & Conditions' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-neutral-900 dark:border-white text-foreground font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* TAB: STYLE & HEADERS */}
            {activeTab === 'style' && (
              <div className="space-y-4">
                <div>
                  <label className="font-bold text-foreground block mb-1">Invoice Header Title:</label>
                  <input
                    type="text"
                    value={config.documentTitle}
                    onChange={(e) => handleUpdate('documentTitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-extrabold tracking-widest text-sm focus:border-neutral-900 outline-none uppercase"
                    placeholder="INVOICE"
                  />
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {['INVOICE', 'TAX INVOICE', 'ESTIMATE / DISPATCH', 'QUOTATION', 'PACKING SLIP'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleUpdate('documentTitle', t)}
                        className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground font-medium cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-foreground block mb-1">Invoice Date:</label>
                    <input
                      type="text"
                      value={config.invoiceDate}
                      onChange={(e) => handleUpdate('invoiceDate', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-mono focus:border-neutral-900 outline-none"
                      placeholder="DD.MM.YYYY"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-foreground block mb-1">Due Date / Status:</label>
                    <input
                      type="text"
                      value={config.dueDate}
                      onChange={(e) => handleUpdate('dueDate', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:border-neutral-900 outline-none"
                      placeholder="e.g. Immediate / Dispatch"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1.5">Font Size Scale:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'compact', label: 'Compact' },
                      { key: 'standard', label: 'Standard (Image 2)' },
                      { key: 'large', label: 'Spacious' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => handleUpdate('fontSize', f.key as any)}
                        className={`p-2 rounded-lg border text-center text-xs font-bold cursor-pointer transition-all ${
                          config.fontSize === f.key
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border space-y-2">
                  <span className="font-bold text-foreground block">Sections to display:</span>
                  {[
                    { key: 'showLogo', label: 'Show Header Logo / Circle Monogram' },
                    { key: 'showSignature', label: 'Show Signature Block' },
                    { key: 'showPaymentInfo', label: 'Show Bank / Payment Info' },
                    { key: 'showTaxOrSavings', label: 'Show Discount / Festive Savings' },
                    { key: 'showTerms', label: 'Show Terms & Compliance Notes' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/40 cursor-pointer"
                    >
                      <span className="font-medium text-foreground">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(config[item.key as keyof InvoiceCustomizerConfig])}
                        onChange={(e) => handleUpdate(item.key as any, e.target.checked)}
                        className="h-4 w-4 rounded text-neutral-900 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: LOGO & SIGNATURE UPLOAD */}
            {activeTab === 'media' && (
              <div className="space-y-5">
                {/* Logo Upload Card */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-indigo-500" />
                      Brand Logo
                    </span>
                    {config.logoImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-[11px] text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Reset to Default
                      </button>
                    )}
                  </div>

                  {config.logoImageUrl ? (
                    <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-center border border-border">
                      <img
                        src={config.logoImageUrl}
                        alt="Uploaded Logo"
                        className="max-h-16 max-w-[180px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/20 rounded-lg text-center text-muted-foreground border border-dashed border-border">
                      <p className="text-[11px]">Currently using the default circular brand monogram.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Custom Logo Image (PNG / SVG)</span>
                  </button>
                </div>

                {/* Signature Upload Card */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <PenTool className="h-4 w-4 text-emerald-500" />
                      Authorized Signature
                    </span>
                    {config.signatureImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        className="text-[11px] text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Reset to Script
                      </button>
                    )}
                  </div>

                  {config.signatureImageUrl ? (
                    <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-center border border-border">
                      <img
                        src={config.signatureImageUrl}
                        alt="Uploaded Signature"
                        className="max-h-16 max-w-[180px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/20 rounded-lg text-center text-muted-foreground border border-dashed border-border">
                      <p className="text-[11px]">Currently using the elegant handwritten script signature.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Handwritten Signature (PNG / JPG)</span>
                  </button>

                  <div>
                    <label className="font-bold text-foreground block mb-1">Signatory Title / Name:</label>
                    <input
                      type="text"
                      value={config.signatoryName}
                      onChange={(e) => handleUpdate('signatoryName', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:border-neutral-900 outline-none"
                      placeholder="e.g. Authorized Signatory / Morgan Maxwell"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ISSUED TO DETAILS */}
            {activeTab === 'details' && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Customer / Billed Name:</label>
                  <input
                    type="text"
                    value={config.customerName}
                    onChange={(e) => handleUpdate('customerName', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-semibold focus:border-neutral-900 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Company / Organization (Optional):</label>
                  <input
                    type="text"
                    value={config.customerCompany}
                    onChange={(e) => handleUpdate('customerCompany', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:border-neutral-900 outline-none"
                    placeholder="e.g. Thynk Unlimited"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Street Address:</label>
                  <input
                    type="text"
                    value={config.customerAddress}
                    onChange={(e) => handleUpdate('customerAddress', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:border-neutral-900 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">City, State & Pincode:</label>
                  <input
                    type="text"
                    value={config.customerCityState}
                    onChange={(e) => handleUpdate('customerCityState', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:border-neutral-900 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Phone / Mobile:</label>
                  <input
                    type="text"
                    value={config.customerMobile}
                    onChange={(e) => handleUpdate('customerMobile', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-mono focus:border-neutral-900 outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB: PAYMENT INFO */}
            {activeTab === 'payment' && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Bank Name:</label>
                  <input
                    type="text"
                    value={config.bankName}
                    onChange={(e) => handleUpdate('bankName', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:border-neutral-900 outline-none"
                    placeholder="e.g. Borcele Bank / State Bank of India"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Account Name:</label>
                  <input
                    type="text"
                    value={config.accountName}
                    onChange={(e) => handleUpdate('accountName', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:border-neutral-900 outline-none"
                    placeholder="e.g. Morgan Maxwell"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Account Number:</label>
                  <input
                    type="text"
                    value={config.accountNumber}
                    onChange={(e) => handleUpdate('accountNumber', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-mono focus:border-neutral-900 outline-none"
                    placeholder="e.g. 0123 4567 8901"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">IFSC Code & UPI ID:</label>
                  <input
                    type="text"
                    value={config.upiId}
                    onChange={(e) => handleUpdate('upiId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-mono focus:border-neutral-900 outline-none"
                    placeholder="e.g. rajalakshmifireworks@sbi"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Payment Instructions / Notes:</label>
                  <textarea
                    rows={2}
                    value={config.notes}
                    onChange={(e) => handleUpdate('notes', e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-card text-foreground focus:border-neutral-900 outline-none leading-relaxed"
                    placeholder="e.g. Scan or transfer to confirm dispatch"
                  />
                </div>
              </div>
            )}

            {/* TAB: TERMS & CONDITIONS */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card">
                  <div>
                    <span className="font-bold text-foreground block">Display Terms on Invoice</span>
                    <span className="text-[11px] text-muted-foreground">Print terms at the bottom of the slip</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showTerms}
                    onChange={(e) => handleUpdate('showTerms', e.target.checked)}
                    className="h-4 w-4 rounded text-neutral-900 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Terms & Conditions Text:</label>
                  <textarea
                    rows={6}
                    value={config.termsAndConditions}
                    onChange={(e) => handleUpdate('termsAndConditions', e.target.value)}
                    className="w-full p-3 rounded-lg border border-border bg-card text-foreground focus:border-neutral-900 outline-none leading-relaxed text-xs font-mono"
                    placeholder="Enter terms and conditions..."
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="font-bold text-foreground text-[11px] block">Quick Presets:</span>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate(
                          'termsAndConditions',
                          '1. All fireworks are manufactured & dispatched under Supreme Court & PESO safety standards.\n2. Goods once sold cannot be returned or exchanged.\n3. Goods transported at buyer\'s risk through authorized transport operators.\n4. Disputes subject exclusively to Sivakasi Jurisdiction.'
                        )
                      }
                      className="px-2.5 py-1 rounded-md bg-muted text-[11px] font-medium text-foreground hover:bg-muted/80 cursor-pointer"
                    >
                      Fireworks Standard
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate(
                          'termsAndConditions',
                          '1. Payment due within 7 days of invoice date.\n2. Please include invoice number on your payment reference.\n3. Goods remain property of seller until paid in full.'
                        )
                      }
                      className="px-2.5 py-1 rounded-md bg-muted text-[11px] font-medium text-foreground hover:bg-muted/80 cursor-pointer"
                    >
                      Commercial Standard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDefaults}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="h-3.5 w-3.5" /> Save Default
              </button>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-neutral-700 text-foreground cursor-pointer hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ================= INVOICE CANVAS (MATCHES IMAGE 2 EXACTLY) ================= */}
      <main className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 print:py-0 print:px-0 print:max-w-none">
        {/* The Printable Invoice Sheet */}
        <div
          id="invoice-sheet-container"
          className="bg-white text-neutral-900 p-8 sm:p-14 md:p-16 rounded-2xl shadow-md border border-neutral-200 print:border-none print:shadow-none print:rounded-none print:p-0 space-y-10"
        >
          {/* HEADER ROW: INVOICE (Left) & LOGO (Right) */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className={`font-extrabold text-neutral-900 uppercase tracking-[0.25em] ${fontSizes.title}`}>
                {config.documentTitle}
              </h1>
            </div>

            {/* LOGO (TOP RIGHT) */}
            {config.showLogo && (
              <div className="text-right shrink-0">
                {config.logoImageUrl ? (
                  <img
                    src={config.logoImageUrl}
                    alt="Store Logo"
                    className="h-16 sm:h-20 w-auto object-contain max-w-[180px] ml-auto"
                  />
                ) : (
                  /* Elegant circular monogram matching Image 2 */
                  <div className="inline-flex flex-col items-center select-none">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border-[2.5px] border-neutral-900 border-r-transparent flex items-center justify-center rotate-[-15deg]">
                      <span className="font-serif italic text-2xl sm:text-3xl font-normal text-neutral-900 translate-y-[-2px]">
                        R.
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-900 mt-1">
                      {config.storeName || 'RAJALAKSHMI'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MIDDLE ROW: ISSUED TO (Left) & INVOICE NO / DATE (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
            {/* ISSUED TO */}
            <div className="space-y-1">
              <h3 className={`font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                ISSUED TO:
              </h3>
              <p className={`font-semibold text-neutral-900 ${fontSizes.body}`}>
                {config.customerName}
              </p>
              {config.customerCompany && (
                <p className={`text-neutral-700 ${fontSizes.body}`}>{config.customerCompany}</p>
              )}
              {config.showDeliveryAddress && (
                <>
                  <p className={`text-neutral-700 ${fontSizes.body}`}>{config.customerAddress}</p>
                  <p className={`text-neutral-700 ${fontSizes.body}`}>{config.customerCityState}</p>
                </>
              )}
              {config.showCustomerPhone && config.customerMobile && (
                <p className={`text-neutral-600 font-mono ${fontSizes.body}`}>{config.customerMobile}</p>
              )}
              {order?.notes && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-neutral-800/80 border border-amber-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs leading-snug max-w-full overflow-hidden">
                  <span className="font-bold uppercase tracking-wider text-[10px] block text-amber-800 dark:text-amber-400">
                    Customer Instructions:
                  </span>
                  <span className="font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere] break-all">{order.notes}</span>
                </div>
              )}
            </div>

            {/* INVOICE NO & DATE */}
            <div className="sm:text-right space-y-1.5">
              <div className="flex sm:justify-end gap-3 items-baseline">
                <span className={`font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                  INVOICE NO:
                </span>
                <span className={`font-mono font-semibold text-neutral-900 ${fontSizes.body}`}>
                  {config.invoiceNumber}
                </span>
              </div>

              <div className="flex sm:justify-end gap-3 items-baseline">
                <span className={`font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                  DATE:
                </span>
                <span className={`font-mono text-neutral-800 ${fontSizes.body}`}>
                  {config.invoiceDate}
                </span>
              </div>

              {config.dueDate && (
                <div className="flex sm:justify-end gap-3 items-baseline">
                  <span className={`font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                    DUE DATE:
                  </span>
                  <span className={`text-neutral-800 ${fontSizes.body}`}>
                    {config.dueDate}
                  </span>
                </div>
              )}

              {config.showGstin && config.storeGstin && (
                <div className="flex sm:justify-end gap-3 items-baseline">
                  <span className={`font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                    GSTIN:
                  </span>
                  <span className={`font-mono text-neutral-800 uppercase ${fontSizes.body}`}>
                    {config.storeGstin}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* TABLE: DESCRIPTION, RATE, QTY, TOTAL */}
          <div className="pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-t border-b border-neutral-900">
                  <th className={`py-3 font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                    DESCRIPTION
                  </th>
                  <th className={`py-3 text-right font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                    RATE
                  </th>
                  <th className={`py-3 text-center font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                    QTY
                  </th>
                  <th className={`py-3 text-right font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {order.items?.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className={`font-medium text-neutral-900 ${fontSizes.tableText}`}>
                      {item.productNameSnapshot}
                    </td>
                    <td className={`text-right text-neutral-800 font-mono ${fontSizes.tableText}`}>
                      {formatCurrency(item.sellingPriceSnapshot)}
                    </td>
                    <td className={`text-center font-bold text-neutral-900 font-mono ${fontSizes.tableText}`}>
                      {item.quantity}
                    </td>
                    <td className={`text-right font-medium text-neutral-900 font-mono ${fontSizes.tableText}`}>
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS SECTION */}
          <div className="border-t border-neutral-900 pt-3">
            <div className="w-64 sm:w-72 ml-auto space-y-2">
              <div className="flex justify-between items-baseline">
                <span className={`font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                  SUBTOTAL
                </span>
                <span className="font-mono font-medium text-neutral-900 text-sm">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>

              {config.showTaxOrSavings && toNumber(order.discountAmount) > 0 && (
                <div className="flex justify-between items-baseline text-neutral-600">
                  <span className={`font-medium uppercase tracking-wider ${fontSizes.heading}`}>
                    Festive Savings
                  </span>
                  <span className="font-mono text-sm">
                    -{formatCurrency(order.discountAmount)}
                  </span>
                </div>
              )}

              {toNumber(order.deliveryCharge) > 0 && (
                <div className="flex justify-between items-baseline text-neutral-600">
                  <span className={`font-medium uppercase tracking-wider ${fontSizes.heading}`}>
                    Delivery Fee
                  </span>
                  <span className="font-mono text-sm">
                    +{formatCurrency(order.deliveryCharge)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200">
                <span className={`font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                  TOTAL
                </span>
                <span className={`font-mono font-bold text-neutral-900 ${fontSizes.total}`}>
                  {formatCurrency(order.finalAmount || order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 text-xs">
                <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">
                  PAYMENT STATUS:
                </span>
                {order.paymentStatus === 'PAID' ? (
                  <span className="font-bold text-[11px] text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded">
                    ✓ PAID {order.paymentMethod ? `(${order.paymentMethod})` : ''}
                  </span>
                ) : (
                  <span className="font-bold text-[11px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded">
                    PENDING
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: PAYMENT INFO (Left) & SIGNATURE (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 items-end">
            {/* PAYMENT INFO */}
            {config.showPaymentInfo ? (
              <div className="space-y-1">
                <h4 className={`font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                  PAYMENT INFO:
                </h4>
                <p className={`font-medium text-neutral-900 ${fontSizes.body}`}>
                  {config.bankName}
                </p>
                <p className={`text-neutral-700 ${fontSizes.body}`}>
                  Account Name: {config.accountName}
                </p>
                <p className={`text-neutral-700 font-mono ${fontSizes.body}`}>
                  Account No.: {config.accountNumber}
                </p>
                {config.upiId && (
                  <p className={`text-neutral-600 font-mono text-xs`}>
                    IFSC / UPI: {config.ifscCode} • {config.upiId}
                  </p>
                )}
                {config.notes && (
                  <p className="text-[11px] text-neutral-500 pt-1 leading-relaxed">
                    {config.notes}
                  </p>
                )}
              </div>
            ) : <div />}

            {/* SIGNATURE (BOTTOM RIGHT) */}
            {config.showSignature && (
              <div className="sm:text-right flex flex-col items-start sm:items-end space-y-1">
                {config.signatureImageUrl ? (
                  <img
                    src={config.signatureImageUrl}
                    alt="Authorized Signature"
                    className="h-14 sm:h-18 max-w-[190px] object-contain sm:ml-auto"
                  />
                ) : (
                  /* Elegant handwritten script signature matching Image 2 */
                  <div className="h-14 sm:h-16 flex items-center justify-end sm:pr-2 select-none">
                    <span className="font-serif italic text-3xl sm:text-4xl text-neutral-900 tracking-wide font-light">
                      Maxwell
                    </span>
                  </div>
                )}
                {config.signatoryName && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 sm:text-right">
                    {config.signatoryName}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* TERMS & CONDITIONS (CLEAN MINIMALIST FOOTER MATCHING IMAGE 2) */}
          {config.showTerms && (
            <div className="pt-6 sm:pt-8 border-t border-neutral-900/15 space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className={`font-bold uppercase tracking-wider text-neutral-900 ${fontSizes.heading}`}>
                  TERMS & CONDITIONS:
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('terms');
                    setIsDrawerOpen(true);
                  }}
                  className="invoice-no-print text-[10px] text-neutral-500 hover:text-black font-semibold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                  title="Edit Terms & Conditions"
                >
                  <FileText className="h-3 w-3" />
                  <span>Edit Terms</span>
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-600 font-normal leading-relaxed whitespace-pre-line">
                {config.termsAndConditions || DEFAULT_INVOICE_CONFIG.termsAndConditions}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function InvoiceCustomizer(props: InvoiceCustomizerProps) {
  return (
    <QueryClientProvider client={sharedQueryClient}>
      <InvoiceCustomizerContent {...props} />
    </QueryClientProvider>
  );
}

export default InvoiceCustomizer;
