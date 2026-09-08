'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  MessageSquare,
  Phone,
  MapPin,
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants/config';
import { BrandLogo } from '@/components/ui/brand-logo';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, isReducedMotion } from '@/lib/motion';
import { toast } from 'sonner';

export function StickyFooter() {
  const footerRef = useRef<HTMLDivElement>(null);
  const footerCardRef = useRef<HTMLDivElement>(null);
  const [emailOrPhone, setEmailOrPhone] = useState('');

  // GSAP Sticky Parallax Reveal
  useGSAP(
    () => {
      if (isReducedMotion() || !footerRef.current || !footerCardRef.current) return;

      gsap.fromTo(
        footerCardRef.current,
        { y: 80, scale: 0.95, opacity: 0.85 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 95%',
            end: 'bottom bottom',
            scrub: 0.5,
          },
        }
      );
    },
    { scope: footerRef }
  );

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      toast.error('Please enter your email or WhatsApp number');
      return;
    }
    toast.success('Thank you for subscribing to Diwali festive updates!');
    setEmailOrPhone('');
  };

  return (
    <footer
      ref={footerRef}
      className="w-full pt-6 pb-24 md:pb-8 px-3 sm:px-6 lg:px-10 xl:px-12 select-none"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Main Red Rounded Footer Card Container ── */}
      <div
        ref={footerCardRef}
        className="relative w-full rounded-[36px] sm:rounded-[48px] bg-gradient-to-br from-[#800000] via-[#730000] to-[#500000] text-white p-6 sm:p-10 lg:p-14 shadow-2xl overflow-hidden"
      >
        {/* Subtle Ambient Background Depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />

        {/* ── Top Trust Ribbon Inside Card ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-8 sm:pb-12 border-b border-white/15 relative z-10">
          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-[22px]">
            <div className="h-10 w-10 rounded-full bg-white text-[#800000] flex items-center justify-center shrink-0 shadow-sm font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-white">100% Authentic Fireworks</h4>
              <p className="text-[11px] text-white/80 mt-0.5">Direct tested Sivakasi quality</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-[22px]">
            <div className="h-10 w-10 rounded-full bg-white text-[#800000] flex items-center justify-center shrink-0 shadow-sm font-bold">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-white">Flexible Fulfillment</h4>
              <p className="text-[11px] text-white/80 mt-0.5">Doorstep delivery or counter pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-[22px]">
            <div className="h-10 w-10 rounded-full bg-white text-[#800000] flex items-center justify-center shrink-0 shadow-sm font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-white">Instant WhatsApp Invoice</h4>
              <p className="text-[11px] text-white/80 mt-0.5">Direct dispatch verification updates</p>
            </div>
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 py-8 sm:py-12 relative z-10 items-start">
          {/* Left Column: Big Bold Typography & Newsletter Pill */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight leading-[1.08] text-white">
              STAY UP TO DATE
              <br />
              WITH NEWS, EVENTS
              <br />
              AND MORE!
            </h2>

            {/* Newsletter Pill Input Component (Matching Screenshot Design) */}
            <form onSubmit={handleNewsletterSubmit} className="max-w-md">
              <div className="relative flex items-center justify-between bg-white text-neutral-900 rounded-full p-1.5 pl-5 shadow-lg">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="NEWSLETTER / WHATSAPP"
                  className="bg-transparent text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-900 placeholder:text-neutral-500 outline-none w-full pr-2"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md shrink-0"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Columns: Structured Navigation Links */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-xs">
            {/* Column 1: Customer Service / Collections */}
            <div className="space-y-3.5">
              <h3 className="font-extrabold uppercase tracking-wider text-white text-[11px] sm:text-xs">
                COLLECTIONS
              </h3>
              <ul className="space-y-2.5 text-white/80">
                <li>
                  <Link href="/products" className="hover:text-white transition-colors">
                    All Fireworks
                  </Link>
                </li>
                <li>
                  <Link href="/products?featured=true" className="hover:text-white transition-colors">
                    Gift Boxes &amp; Combos
                  </Link>
                </li>
                <li>
                  <Link href="/products?bestseller=true" className="hover:text-white transition-colors">
                    Festive Bestsellers
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="hover:text-white transition-colors">
                    Track Consignment
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Safety & Business */}
            <div className="space-y-3.5">
              <h3 className="font-extrabold uppercase tracking-wider text-white text-[11px] sm:text-xs">
                SAFETY &amp; TRUST
              </h3>
              <ul className="space-y-2.5 text-white/80">
                <li>
                  <Link href="/products?certified=green" className="hover:text-white transition-colors">
                    Green Crackers Certified
                  </Link>
                </li>
                <li>
                  <span className="block text-white/80">
                    Open Outdoor Spaces
                  </span>
                </li>
                <li>
                  <span className="block text-white/80">
                    Child Supervision Tips
                  </span>
                </li>
                <li>
                  <span className="block text-white/80">
                    Bucket Water Prep
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 3: Fulfillment */}
            <div className="space-y-3.5">
              <h3 className="font-extrabold uppercase tracking-wider text-white text-[11px] sm:text-xs">
                FULFILLMENT
              </h3>
              <ul className="space-y-2.5 text-white/80">
                <li>
                  <span className="block text-white/80">
                    Doorstep Transport
                  </span>
                </li>
                <li>
                  <span className="block text-white/80">
                    Sivakasi Counter Pickup
                  </span>
                </li>
                <li>
                  <span className="block text-white/80">
                    WhatsApp Confirmation
                  </span>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-white transition-colors">
                    Shopping Bag
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Store */}
            <div className="space-y-3.5">
              <h3 className="font-extrabold uppercase tracking-wider text-white text-[11px] sm:text-xs">
                STORE CONTACT
              </h3>
              <ul className="space-y-2.5 text-white/80">
                <li className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0 text-white/70" />
                  <span className="truncate">{APP_CONFIG.STORE_PHONE}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 shrink-0 text-white/70" />
                  <span className="truncate">+{APP_CONFIG.WHATSAPP_NUMBER}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0 text-white/70 mt-0.5" />
                  <span className="line-clamp-2">{APP_CONFIG.STORE_ADDRESS}</span>
                </li>
                <li className="pt-1">
                  <Link href="/admin/login" className="hover:text-white underline underline-offset-2 transition-colors">
                    Staff Portal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Middle Row: Brand Mark & Social Media Icons ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-white/15 relative z-10 text-xs">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-9 w-auto brightness-0 invert" />
            <span className="text-white/80 text-[11px] sm:text-xs">
              is handcrafted with 🔥 in Sivakasi
            </span>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center gap-3 text-white/90">
            <a
              href={`https://wa.me/${APP_CONFIG.WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white hover:text-[#800000] flex items-center justify-center transition-colors cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white hover:text-[#800000] flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white hover:text-[#800000] flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white hover:text-[#800000] flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white hover:text-[#800000] flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white hover:text-[#800000] flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── Bottom Sub-Bar: Legal & Copyright ── */}
        <div className="bg-white/10 backdrop-blur-md rounded-[20px] sm:rounded-full py-3 px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-white/80 relative z-10">
          <span>All prices incl. GST &amp; factory packaging. Sivakasi direct wholesale dispatch.</span>
          <span>© {new Date().getFullYear()} {APP_CONFIG.STORE_NAME}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
