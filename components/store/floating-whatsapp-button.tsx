'use client';

import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/lib/constants/config';
import { useLocale } from '@/lib/i18n/context';

interface FloatingWhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
  locale?: string;
}

export function FloatingWhatsAppButton({
  phoneNumber: propPhoneNumber,
  defaultMessage: propMessage,
  locale: propLocale,
}: FloatingWhatsAppButtonProps = {}) {
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale || 'en';
  const [phoneNumber, setPhoneNumber] = useState<string>(
    propPhoneNumber || APP_CONFIG.WHATSAPP_NUMBER || '919876543210'
  );
  const [isHovered, setIsHovered] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Synchronize dynamic store settings from /api/settings if admin configured a specific WhatsApp number
  useEffect(() => {
    if (propPhoneNumber) return;
    let isMounted = true;
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.settings?.WHATSAPP_NUMBER) return;
        const dbPhone = data.settings.WHATSAPP_NUMBER.trim();
        if (dbPhone) {
          setPhoneNumber(dbPhone);
        }
      })
      .catch(() => {
        // Fallback to APP_CONFIG
      });
    return () => {
      isMounted = false;
    };
  }, [propPhoneNumber]);

  // Subtle entrance trigger on scroll or small timeout
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setHasScrolled(true);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    const timer = setTimeout(() => setHasScrolled(true), 600);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Format phone number: remove non-digits
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  // Localized default enquiry messages
  const defaultText =
    propMessage ||
    (locale === 'ta'
      ? 'வணக்கம் ராஜலட்சுமி பட்டாசு, எனக்கு பட்டாசு ஆர்டர் மற்றும் விலை விவரங்கள் தேவை.'
      : 'Hello Rajalakshmi Fireworks, I would like to inquire about fireworks orders and pricing.');

  const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(defaultText)}`;

  const tooltipLabel =
    locale === 'ta' ? 'வாட்ஸ்அப் உதவி' : 'Chat with Us';
  const tooltipSubtext =
    locale === 'ta' ? 'உடனடி பதில்' : 'Quick Support';

  return (
    <aside
      aria-label="WhatsApp Support"
      className={`fixed z-40 transition-all duration-500 ease-out pointer-events-auto select-none
        bottom-24 right-4 sm:bottom-6 sm:right-6 md:bottom-7 md:right-7
        ${hasScrolled ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-90'}
      `}
    >
      <div
        className="relative flex items-center group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expanded Desktop Hover Pill / Tooltip */}
        <div
          role="tooltip"
          className={`hidden sm:flex items-center gap-2 mr-3 px-3.5 py-2 rounded-full
            bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md
            text-neutral-900 dark:text-neutral-100
            shadow-[0_8px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]
            border border-neutral-200/80 dark:border-neutral-800
            transition-all duration-300 ease-out origin-right
            ${isHovered ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-3 scale-95 pointer-events-none'}
          `}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              {tooltipLabel}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
              {tooltipSubtext}
            </span>
          </div>
        </div>

        {/* WhatsApp Circular Action Button */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={
            locale === 'ta'
              ? 'ராஜலட்சுமி பட்டாசு வாட்ஸ்அப்பில் தொடர்புகொள்ளவும்'
              : 'Chat with Rajalakshmi Fireworks on WhatsApp'
          }
          className="relative group/btn flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full
            bg-[#25D366] hover:bg-[#20bd5a] text-white
            shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_28px_rgba(37,211,102,0.6)]
            transition-all duration-300 transform-gpu hover:scale-108 active:scale-95
            focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40
          "
        >
          {/* Subtle Outer Pulsing Halo */}
          <span
            aria-hidden="true"
            className="absolute -inset-1 rounded-full bg-[#25D366] opacity-35 animate-ping duration-1000 -z-10 group-hover/btn:opacity-60"
          />

          {/* Online Green Indicator Pip */}
          <span
            aria-hidden="true"
            className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-neutral-950 shadow-sm"
          />

          {/* Official WhatsApp SVG Icon */}
          <svg
            className="w-7 h-7 sm:w-7.5 sm:h-7.5 fill-current transform-gpu transition-transform duration-300 group-hover/btn:rotate-6 group-hover/btn:scale-105"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.888 9.886m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </div>
    </aside>
  );
}
