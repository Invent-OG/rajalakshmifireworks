import { wrapHandler } from '@/src/lib/astro-api';
import { db } from '@/db';
import { products, categories, settings } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { APP_CONFIG } from '@/lib/constants/config';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

async function _GET(req: any) {
  try {
    const url = req.nextUrl || (req?.url ? new URL(req.url, 'http://localhost') : new URL('http://localhost/api/products/download'));
    const format = url.searchParams.get('format');

    // Fetch active products with categories
    const productList = await db.query.products.findMany({
      where: eq(products.isActive, true),
      with: {
        category: true,
      },
      orderBy: [asc(products.categoryId), asc(products.name)],
    });

    // Fetch store settings for up-to-date phone, WhatsApp & address
    const allSettings = await db.select().from(settings).catch(() => []);
    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
      settingsMap[s.key] = s.value;
    }

    const storeName = settingsMap.STORE_NAME || APP_CONFIG.STORE_NAME || 'Rajalakshmi Fireworks';
    const storePhone = settingsMap.STORE_PHONE || APP_CONFIG.STORE_PHONE || '+91 98765 43210';
    const rawWa = settingsMap.WHATSAPP_NUMBER || APP_CONFIG.WHATSAPP_NUMBER || '919876543210';
    const cleanWa = rawWa.replace(/[^0-9]/g, '');
    const formattedWa = cleanWa.length === 10 ? `+91 ${cleanWa}` : `+${cleanWa}`;
    const storeAddress = settingsMap.STORE_ADDRESS || APP_CONFIG.STORE_ADDRESS || 'Sivakasi Main Road, Sivakasi, Tamil Nadu - 626123';
    const storeEmail = settingsMap.STORE_EMAIL || APP_CONFIG.STORE_EMAIL || 'info@rajalakshmifireworks.com';
    const year = new Date().getFullYear();

    // -------------------------------------------------------------
    // Optional CSV format if explicitly requested via ?format=csv
    // -------------------------------------------------------------
    if (format === 'csv') {
      const headers = [
        'S.No',
        'Category',
        'Product Name',
        'Original MRP (INR)',
        'Wholesale Price (INR)',
        'Savings (INR)',
        'Stock Status',
      ];

      const escapeCSV = (field: string | number | null | undefined): string => {
        if (field === null || field === undefined) return '""';
        const str = String(field).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = productList.map((p, idx) => {
        const mrpNum = parseFloat(String(p.mrp)) || 0;
        const sellNum = parseFloat(String(p.sellingPrice)) || 0;
        const savings = Math.max(0, mrpNum - sellNum);
        const categoryName = p.category?.name || 'Assorted Fireworks';
        const stockStatus = p.stockQuantity > 0 ? 'In Stock' : 'Limited Stock';

        return [
          escapeCSV(idx + 1),
          escapeCSV(categoryName),
          escapeCSV(p.name),
          escapeCSV(mrpNum.toFixed(2)),
          escapeCSV(sellNum.toFixed(2)),
          escapeCSV(savings.toFixed(2)),
          escapeCSV(stockStatus),
        ];
      });

      const csvContent =
        '\uFEFF' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Rajalakshmi_Fireworks_Catalog_${year}.csv"`,
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    // -------------------------------------------------------------
    // Default: Professional PDF Catalog Generation
    // -------------------------------------------------------------
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36; // 0.5 inch margins

    // Top decorative festive maroon & gold accent band
    doc.setFillColor(128, 0, 0); // Maroon #800000
    doc.rect(0, 0, pageWidth, 6, 'F');
    doc.setFillColor(217, 119, 6); // Amber #D97706
    doc.rect(0, 6, pageWidth, 2.5, 'F');

    // Embed Store Logo from public/logo.svg (converted to PNG buffer via sharp)
    let logoDrawn = false;
    try {
      const logoSvgPath = path.resolve(process.cwd(), 'public/logo.svg');
      if (fs.existsSync(logoSvgPath)) {
        const pngBuf = await sharp(logoSvgPath).resize(240).png().toBuffer();
        const base64 = `data:image/png;base64,${pngBuf.toString('base64')}`;
        doc.addImage(base64, 'PNG', margin, 18, 54, 54);
        logoDrawn = true;
      }
    } catch (e) {
      console.warn('Could not render SVG logo to PDF, falling back to text emblem:', e);
    }

    const titleLeft = logoDrawn ? margin + 64 : margin;

    // Header Title & Tagline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.setTextColor(128, 0, 0); // Maroon
    doc.text(storeName.toUpperCase(), titleLeft, 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text(
      'DIRECT SIVAKASI WHOLESALE FACTORY FIREWORKS • 100% GENUINE GREEN CRACKERS',
      titleLeft,
      47
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(180, 83, 9); // Gold / Amber
    doc.text(
      `OFFICIAL WHOLESALE PRICE LIST & PRODUCT CATALOG — DIWALI ${year}`,
      titleLeft,
      62
    );

    // Contact Information & Dispatch Desk Box
    const contactBoxY = 76;
    doc.setFillColor(252, 250, 248);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, contactBoxY, pageWidth - margin * 2, 44, 4, 4, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(35, 35, 35);

    // Contact Line 1: Hotline & WhatsApp
    doc.setFont('helvetica', 'bold');
    doc.text('Hotline / Booking Desk:', margin + 10, contactBoxY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(storePhone, margin + 104, contactBoxY + 14);

    doc.setFont('helvetica', 'bold');
    doc.text('WhatsApp Support:', margin + 215, contactBoxY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 101, 52); // Forest Green
    doc.text(`${formattedWa} (Instant Order & Enquiry)`, margin + 295, contactBoxY + 14);
    doc.setTextColor(35, 35, 35);

    // Contact Line 2: Sivakasi Depot Address & Website
    doc.setFont('helvetica', 'bold');
    doc.text('Sivakasi Depot:', margin + 10, contactBoxY + 30);
    doc.setFont('helvetica', 'normal');
    doc.text(storeAddress, margin + 104, contactBoxY + 30);

    doc.setFont('helvetica', 'bold');
    doc.text('Online Catalog:', margin + 355, contactBoxY + 30);
    doc.setFont('helvetica', 'normal');
    doc.text('www.rajalakshmifireworks.com', margin + 418, contactBoxY + 30);

    // Legal / Statutory Notice Strip
    const noticeY = contactBoxY + 49;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(110, 110, 110);
    doc.text(
      'Statutory Notice: In compliance with Hon. Supreme Court & High Court directives, direct online sales are prohibited. This document operates as an offline quotation catalog. Orders are confirmed and dispatched offline in compliance with the Explosives Act.',
      margin,
      noticeY
    );

    // -------------------------------------------------------------
    // Build Structured Table Rows with Category Section Banners
    // -------------------------------------------------------------
    interface TableRowItem {
      content?: string;
      colSpan?: number;
      styles?: any;
    }

    const tableBody: (string | number | TableRowItem)[][] = [];

    // Group products by category
    const categoryGroups = new Map<string, typeof productList>();
    for (const p of productList) {
      const catName = p.category?.name || 'Assorted Fireworks';
      if (!categoryGroups.has(catName)) {
        categoryGroups.set(catName, []);
      }
      categoryGroups.get(catName)!.push(p);
    }

    let globalIndex = 1;
    categoryGroups.forEach((items, catName) => {
      // Category section divider banner
      tableBody.push([
        {
          content: `CATEGORY: ${catName.toUpperCase()} (${items.length} ITEMS)`,
          colSpan: 7,
          styles: {
            fillColor: [243, 244, 246], // Soft light slate
            textColor: [128, 0, 0], // Brand Maroon
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: 4,
          },
        },
      ]);

      // Product rows under this category
      for (const p of items) {
        const mrpNum = parseFloat(String(p.mrp)) || 0;
        const sellNum = parseFloat(String(p.sellingPrice)) || 0;
        const savings = Math.max(0, mrpNum - sellNum);
        const discountPct = mrpNum > 0 ? Math.round((savings / mrpNum) * 100) : 0;
        const stockStatus = p.stockQuantity > 0 ? 'In Stock' : 'Factory Fresh';

        tableBody.push([
          globalIndex++,
          p.name,
          catName,
          `Rs. ${mrpNum.toFixed(2)}`,
          `Rs. ${sellNum.toFixed(2)}`,
          discountPct > 0 ? `${discountPct}% OFF` : '-',
          stockStatus,
        ]);
      }
    });

    // Render AutoTable
    autoTable(doc, {
      startY: noticeY + 8,
      margin: { left: margin, right: margin, top: 40, bottom: 42 },
      head: [
        [
          '#',
          'Product Name / Description',
          'Category',
          'Original MRP',
          'Wholesale Price',
          'Savings',
          'Status',
        ],
      ],
      body: tableBody as any,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 4,
        textColor: [30, 30, 30],
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [128, 0, 0], // #800000 Maroon
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [252, 252, 253],
      },
      columnStyles: {
        0: { cellWidth: 24, halign: 'center' }, // S.No
        1: { cellWidth: 165, fontStyle: 'bold' }, // Product Name
        2: { cellWidth: 85, textColor: [75, 85, 99] }, // Category
        3: { cellWidth: 62, halign: 'right', textColor: [120, 120, 120] }, // MRP
        4: { cellWidth: 68, halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] }, // Wholesale Price
        5: { cellWidth: 55, halign: 'center', fontStyle: 'bold', textColor: [21, 128, 61] }, // Savings %
        6: { cellWidth: 56, halign: 'center', fontSize: 7.5, textColor: [55, 65, 81] }, // Status
      },
      didDrawPage: (data) => {
        // Running header on page 2 and beyond
        if (data.pageNumber > 1) {
          doc.setFillColor(128, 0, 0);
          doc.rect(0, 0, pageWidth, 4, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(128, 0, 0);
          doc.text(`${storeName.toUpperCase()} • SIVAKASI PRICE LIST ${year}`, margin, 20);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(90, 90, 90);
          doc.text(`Booking Hotline: ${storePhone} | WhatsApp: ${formattedWa}`, pageWidth - margin - 230, 20);

          doc.setDrawColor(220, 220, 220);
          doc.line(margin, 25, pageWidth - margin, 25);
        }

        // Running footer on every page
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, pageHeight - 26, pageWidth - margin, pageHeight - 26);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `${storeName} • Sivakasi, Tamil Nadu • 100% Genuine Green Crackers • Helpline: ${storePhone}`,
          margin,
          pageHeight - 16
        );

        const pageStr = `Page ${data.pageNumber}`;
        doc.text(pageStr, pageWidth - margin - 32, pageHeight - 16);
      },
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const fileName = `Rajalakshmi_Fireworks_Catalog_${year}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error generating product catalog PDF:', error);
    return Response.json(
      { message: 'Failed to generate catalog PDF download' },
      { status: 500 }
    );
  }
}

export const GET = wrapHandler(_GET);
