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
import { useLocale, useTranslations } from '@/lib/i18n/context';

export function StickyFooter() {
  const locale = useLocale();
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('navigation');
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
      toast.error(locale === 'ta' ? 'தயவுசெய்து உங்கள் மின்னஞ்சல் அல்லது வாட்ஸ்அப் எண்ணை உள்ளிடவும்' : 'Please enter your email or WhatsApp number');
      return;
    }
    toast.success(locale === 'ta' ? 'தீபாவளி சிறப்பு அறிவிப்புகளுக்கு பதிவுசெய்தமைக்கு நன்றி!' : 'Thank you for subscribing to Diwali festive updates!');
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
              <h4 className="font-bold text-xs sm:text-sm text-white">
                {locale === 'ta' ? '100% அசல் சிவகாசி பட்டாசுகள்' : '100% Authentic Fireworks'}
              </h4>
              <p className="text-[11px] text-white/80 mt-0.5">
                {locale === 'ta' ? 'நேரடி பரிசோதிக்கப்பட்ட தரம்' : 'Direct tested Sivakasi quality'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-[22px]">
            <div className="h-10 w-10 rounded-full bg-white text-[#800000] flex items-center justify-center shrink-0 shadow-sm font-bold">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-white">
                {locale === 'ta' ? 'பாதுகாப்பான போக்குவரத்து' : 'Flexible Fulfillment'}
              </h4>
              <p className="text-[11px] text-white/80 mt-0.5">
                {locale === 'ta' ? 'லாரி பார்சல் அல்லது சிவகாசி கவுண்டர்' : 'Doorstep delivery or counter pickup'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-[22px]">
            <div className="h-10 w-10 rounded-full bg-white text-[#800000] flex items-center justify-center shrink-0 shadow-sm font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-white">
                {locale === 'ta' ? 'உடனடி வாட்ஸ்அப் ரசீது' : 'Instant WhatsApp Invoice'}
              </h4>
              <p className="text-[11px] text-white/80 mt-0.5">
                {locale === 'ta' ? 'நேரடி பார்சல் கண்காணிப்பு' : 'Direct dispatch verification updates'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 py-8 sm:py-12 relative z-10 items-start">
          {/* Left Column: Big Bold Typography & Newsletter Pill */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight leading-[1.08] text-white">
              {locale === 'ta' ? (
                <>
                  தீபாவளி செய்திகள் &amp;
                  <br />
                  சலுகைகளை உடனுக்குடன்
                  <br />
                  தெரிந்துகொள்ளுங்கள்!
                </>
              ) : (
                <>
                  STAY UP TO DATE
                  <br />
                  WITH NEWS, EVENTS
                  <br />
                  AND MORE!
                </>
              )}
            </h2>

            {/* Newsletter Pill Input Component */}
            <form onSubmit={handleNewsletterSubmit} className="max-w-md">
              <div className="relative flex items-center justify-between bg-white text-neutral-900 rounded-full p-1.5 pl-5 shadow-lg">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder={locale === 'ta' ? 'மின்னஞ்சல் / வாட்ஸ்அப் எண்' : 'NEWSLETTER / WHATSAPP'}
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
                {locale === 'ta' ? 'பட்டாசு வகைகள்' : 'COLLECTIONS'}
              </h3>
              <ul className="space-y-2.5 text-white/80">
                <li>
                  <Link href="/products" className="hover:text-white transition-colors">
                    {tFooter('catalog')}
                  </Link>
                </li>
                <li>
                  <Link href="/products?featured=true" className="hover:text-white transition-colors">
                    {tFooter('combos')}
                  </Link>
                </li>
                <li>
                  <Link href="/products?bestseller=true" className="hover:text-white transition-colors">
                    {locale === 'ta' ? 'அதிக விற்பனை' : 'Festive Bestsellers'}
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="hover:text-white transition-colors">
                    {tFooter('trackOrder')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Safety & Business */}
            <div className="space-y-3.5">
              <h3 className="font-extrabold uppercase tracking-wider text-white text-[11px] sm:text-xs">
                {locale === 'ta' ? 'பாதுகாப்பு' : 'SAFETY & TRUST'}
              </h3>
              <ul className="space-y-2.5 text-white/80">
                <li>
                  <Link href="/products?certified=green" className="hover:text-white transition-colors">
                    {locale === 'ta' ? 'பசுமை பட்டாசு சான்றிதழ்' : 'Green Crackers Certified'}
                  </Link>
                </li>
                <li>
                  <span className="block text-white/80">
                    {locale === 'ta' ? 'திறந்தவெளி பாதுகாப்பு' : 'Open Outdoor Spaces'}
                  </span>
                </li>
                <li>
                  <span className="block text-white/80">
                    {locale === 'ta' ? 'குழந்தை பாதுகாப்பு' : 'Child Supervision Tips'}
                  </span>
                </li>
                <li>
                  <span className="block text-white/80">
                    {locale === 'ta' ? 'நீர் வாளி பாதுகாப்பு' : 'Bucket Water Prep'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 3: Fulfillment */}
            <div className="space-y-3.5">
              <h3 className="font-extrabold uppercase tracking-wider text-white text-[11px] sm:text-xs">
                {locale === 'ta' ? 'டெலிவரி' : 'FULFILLMENT'}
              </h3>
              <ul className="space-y-2.5 text-white/80">
                <li>
                  <span className="block text-white/80">
                    {locale === 'ta' ? 'லாரி பார்சல் சர்வீஸ்' : 'Doorstep Transport'}
                  </span>
                </li>
                <li>
                  <span className="block text-white/80">
                    {locale === 'ta' ? 'சிவகாசி கவுண்டர் எடுப்பு' : 'Sivakasi Counter Pickup'}
                  </span>
                </li>
                <li>
                  <span className="block text-white/80">
                    {locale === 'ta' ? 'வாட்ஸ்அப் உறுதிப்படுத்தல்' : 'WhatsApp Confirmation'}
                  </span>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-white transition-colors">
                    {tNav('bag')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Store */}
            <div className="space-y-3.5">
              <h3 className="font-extrabold uppercase tracking-wider text-white text-[11px] sm:text-xs">
                {locale === 'ta' ? 'தொடர்புக்கு' : 'STORE CONTACT'}
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
                    {locale === 'ta' ? 'நிர்வாக உள்நுழைவு' : 'Staff Portal'}
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
              {locale === 'ta' ? 'சிவகாசியில் அன்போடும் 🔥 ஆர்வத்தோடும் உருவாக்கப்பட்டது' : 'is handcrafted with 🔥 in Sivakasi'}
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
          </div>
        </div>

        {/* ── Bottom Sub-Bar: Legal & Copyright ── */}
        <div className="bg-white/10 backdrop-blur-md rounded-[20px] sm:rounded-full py-3 px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-white/80 relative z-10">
          <span>{locale === 'ta' ? 'அனைத்து விலைகளிலும் ஜிஎஸ்டி மற்றும் தொழிற்சாலை பேக்கிங் அடங்கும். நேரடி சிவகாசி மொத்த விற்பனை.' : 'All prices incl. GST & factory packaging. Sivakasi direct wholesale dispatch.'}</span>
          <span>© {new Date().getFullYear()} {locale === 'ta' ? 'ராஜலக்ஷ்மி பட்டாசு' : APP_CONFIG.STORE_NAME}. {locale === 'ta' ? 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' : 'All rights reserved.'}</span>
        </div>
      </div>
    </footer>
  );
}
