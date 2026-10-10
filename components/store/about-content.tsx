'use client';

import React from 'react';
import Link from '@/components/ui/link';
import {
  ShieldCheck,
  Sparkles,
  Award,
  Truck,
  Package,
  CheckCircle2,
  Phone,
  MessageSquare,
  MapPin,
  ArrowRight,
  Flame,
  Leaf,
  Clock,
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants/config';
import { useLocale } from '@/lib/i18n/context';
import { BrandLogo } from '@/components/ui/brand-logo';

export function AboutContent() {
  const locale = useLocale();
  const isTa = locale === 'ta';

  const stats = [
    {
      value: '30+',
      label: isTa ? 'ஆண்டுகள் சிவகாசி பாரம்பரியம்' : 'Years Sivakasi Heritage',
      description: isTa ? 'மூன்று தலைமுறைகளாக தலைசிறந்த பட்டாசு உற்பத்தி' : 'Serving festive families with uncompromised quality',
    },
    {
      value: '100%',
      label: isTa ? 'சான்றளிக்கப்பட்ட பசுமை பட்டாசு' : 'CSIR-NEERI Green Certified',
      description: isTa ? 'பேரியம் இல்லாத, புகை குறைந்த சூழல் பாதுகாப்பு' : 'Reduced emissions with eco-friendly chemical formulas',
    },
    {
      value: '50K+',
      label: isTa ? 'மகிழ்ச்சியான வாடிக்கையாளர்கள்' : 'Celebrations Illuminated',
      description: isTa ? 'இந்தியா முழுவதும் நம்பகமான பார்சல் விநியோகம்' : 'Dispatched securely to families and retailers',
    },
    {
      value: '0%',
      label: isTa ? 'இடைத்தரகர் கமிஷன்' : 'Middleman Markup',
      description: isTa ? 'சிவகாசி தொழிற்சாலையிலிருந்து நேரடி மொத்த விலை' : 'Factory-direct pricing on fresh production batches',
    },
  ];

  const pillars = [
    {
      icon: Leaf,
      color: 'from-emerald-500 to-teal-700',
      title: isTa ? '100% பசுமை பட்டாசுகள்' : '100% Certified Green Crackers',
      desc: isTa
        ? 'மத்திய அரசின் CSIR-NEERI மற்றும் PESO விதிமுறைகளின்படி, பேரியம் நைட்ரேட் பயன்படுத்தப்படாமல் தயாரிக்கப்படுகிறது. 30% வரை குறைந்த புகை மற்றும் தூசு உமிழ்வு.'
        : 'Formulated strictly in compliance with CSIR-NEERI benchmarks. Completely free of harmful barium salts, reducing particulate matter by ~30% without fading sparkle.',
    },
    {
      icon: Flame,
      color: 'from-amber-500 to-orange-600',
      title: isTa ? 'சிவகாசி நேரடி உற்பத்தி' : 'Direct From Sivakasi Workshops',
      desc: isTa
        ? 'எங்கள் தயாரிப்புகள் அனைத்தும் சிவகாசியில் உள்ள நவீன பாதுகாப்பு பட்டாசு தொழிற்கூடங்களிலிருந்து நேரடியாக உங்கள் கைகளுக்கு வருகின்றன. புதிய பேட்ச் உத்தரவாதம்.'
        : 'All crackers are manufactured and packaged in our Sivakasi facilities. No third-party brokers, no stale warehouse stock—only fresh current-year batches.',
    },
    {
      icon: Package,
      color: 'from-blue-500 to-indigo-700',
      title: isTa ? 'ஈரப்பதம் புகா பல அடுக்கு பேக்கிங்' : 'Triple-Wall Moisture Proofing',
      desc: isTa
        ? 'கனரக நெளி பெட்டிகள் (Corrugated boxes) மற்றும் உட்புற பிளாஸ்டிக் பாதுகாப்பு கொண்டு பேக் செய்யப்படுவதால் மழை மற்றும் ஈரப்பதத்திலும் 100% நம்பகமாக வெடிக்கும்.'
        : 'Heavy-duty multi-layer corrugation with internal moisture barriers ensures every single sparkler, pot, and burst performs flawlessly even in humid coastal transit.',
    },
    {
      icon: Truck,
      color: 'from-rose-500 to-red-700',
      title: isTa ? 'சட்டப்பூர்வ பார்சல் போக்குவரத்து' : 'Compliant Logistics & Live Dispatch',
      desc: isTa
        ? 'அரசு உரிமம் பெற்ற லாரி டிரான்ஸ்போர்ட் மூலம் பாதுகாப்பாக அனுப்பப்பட்டு, LR ரசீது எண் மற்றும் வாட்ஸ்அப் மூலம் உடனடியாக தகவல் தெரிவிக்கப்படுகிறது.'
        : 'Dispatched safely via authorized commercial parcel transports with proper explosive safety compliance, instant LR consignment receipts, and WhatsApp tracking support.',
    },
  ];

  const safetyGuidelines = [
    {
      title: isTa ? 'திறந்தவெளி பாதுகாப்பு' : 'Always Burst Outdoors',
      desc: isTa
        ? 'பட்டாசுகளை எப்போதும் கட்டிடங்கள், வாகனங்கள் மற்றும் மரங்களுக்கு அப்பால் திறந்த வெட்டவெளியில் மட்டுமே வெடிக்கவும்.'
        : 'Never ignite fireworks indoors or in narrow closed corridors. Maintain ample clearance from dry foliage and parked vehicles.',
    },
    {
      title: isTa ? 'குழந்தைகள் கண்காணிப்பு' : 'Direct Adult Supervision',
      desc: isTa
        ? 'குழந்தைகள் பட்டாசு கொளுத்தும்போது எப்போதும் பெரியவர்கள் அருகில் இருந்து வழிகாட்ட வேண்டும்.'
        : 'Children should only handle safe sparklers under active adult supervision. Never permit re-igniting unexploded fireworks.',
    },
    {
      title: isTa ? 'நீர் வாளி ஆயத்தம்' : 'Water Buckets on Standby',
      desc: isTa
        ? 'எரிந்து முடிந்த கம்பி மத்தாப்புகளை அணைக்கவும், அவசர தேவைக்கும் எப்போதும் ஒரு வாளி தண்ணீர் அருகில் வைத்திருக்கவும்.'
        : 'Keep two buckets of clean water nearby to safely soak used sparkler wires and spent fountain shells immediately after bursting.',
    },
    {
      title: isTa ? 'பருத்தி ஆடைகள் அணிதல்' : 'Wear Snug Cotton Garments',
      desc: isTa
        ? 'பட்டாசு வெடிக்கும் போது எளிதில் தீப்பற்றாத தளர்வற்ற பருத்தி உடைகள் மற்றும் காலணிகளை அணியுங்கள்.'
        : 'Wear comfortable natural cotton attire and closed footwear. Avoid loose synthetic garments or flowing dupattas near flames.',
    },
  ];

  return (
    <div className="w-full min-h-screen py-6 px-3 sm:px-6 lg:px-10 xl:px-12 select-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
        {/* ── 1. Hero Banner ── */}
        <section className="relative rounded-[36px] sm:rounded-[48px] bg-gradient-to-br from-[#800000] via-[#660000] to-[#3d0000] dark:from-[#141414] dark:via-[#111111] dark:to-[#0a0a0a] text-white p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden border border-white/10 dark:border-[#282828]">
          {/* Subtle Ambient Depth */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(255,160,0,0.18),transparent_70%)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[radial-gradient(circle,rgba(226,64,0,0.15),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold tracking-wider uppercase text-amber-200">
              <span>✦</span>
              <span>
                {isTa
                  ? 'சிவகாசி நேரடி பட்டாசு தயாரிப்பாளர்கள்'
                  : 'Sivakasi Direct Fireworks Manufacturers'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.06] text-white drop-shadow-md">
              {isTa ? (
                <>
                  பாரம்பரிய சிவகாசி ஒளி.
                  <br />
                  <span className="text-amber-300">பாதுகாப்பான</span> திருநாள் கொண்டாட்டம்.
                </>
              ) : (
                <>
                  Illuminating Joy,
                  <br />
                  <span className="text-amber-300">Direct From Sivakasi.</span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed max-w-2xl font-normal">
              {isTa
                ? 'ராஜலக்ஷ்மி பட்டாசு என்பது தமிழ்நாட்டின் பட்டாசுத் தலைநகரான சிவகாசியில் அமைந்துள்ள முன்னணி பட்டாசு உற்பத்தி நிறுவனம். தரமான மூலப்பொருட்கள், CSIR-NEERI பசுமை சான்றிதழ் மற்றும் நேர்மையான மொத்த விலையுடன் மூன்று தசாப்தங்களாக இந்தியா முழுவதற்கும் தீபாவளி மகிழ்ச்சியை வழங்கி வருகிறோம்.'
                : 'Rajalakshmi Fireworks is a premier manufacturer and distributor based in Sivakasi, Tamil Nadu. With over 30 years of pyrotechnic mastery, 100% CSIR-NEERI green certification, and moisture-proof packaging, we deliver genuine Sivakasi festive sparkles straight from factory sheds to your doorstep.'}
            </p>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-neutral-950 hover:bg-neutral-100 transition-all shadow-md active:scale-95 cursor-pointer font-bold"
              >
                <span>{isTa ? 'பட்டாசுகளைப் பார்வையிடுங்கள்' : 'Explore Fireworks Catalog'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/quick-order"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all active:scale-95 cursor-pointer"
              >
                <span>★</span>
                <span>{isTa ? 'விரைவு மொத்த ஆர்டர்' : 'Quick Wholesale Order'}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 2. Impact Numbers / Stats Grid ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-[28px] sm:rounded-[32px] bg-white dark:bg-[#141414] border border-neutral-200/80 dark:border-[#282828] shadow-xs flex flex-col justify-between space-y-2 transition-all hover:border-amber-400/50"
            >
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#800000] dark:text-amber-400 font-mono tracking-tight">
                {s.value}
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white mt-1">
                  {s.label}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* ── 3. The Rajalakshmi Story & Heritage ── */}
        <section className="rounded-[36px] bg-neutral-50 dark:bg-[#171717] p-8 sm:p-12 border border-neutral-200/80 dark:border-[#2c2c2c] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              <span>✦</span>
              <span>{isTa ? 'எங்கள் சிவகாசி வரலாறு' : 'Our Sivakasi Story'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 dark:text-white uppercase tracking-tight leading-snug">
              {isTa ? (
                <>
                  சிவகாசியின் உண்மையான உழைப்பு &amp;
                  <br />
                  தலைமுறை மாறாத நம்பிக்கை.
                </>
              ) : (
                <>
                  Three Decades of Trust,
                  <br />
                  Crafted by Sivakasi Artisans.
                </>
              )}
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <p>
                {isTa
                  ? 'சிவகாசி என்றாலே நினைவுக்கு வருவது தீபாவளி மற்றும் திருவிழாக்களின் மங்கல வண்ணப் பட்டாசுகள் தான். அந்த சிவகாசியின் மண்ணில் உருவான ராஜலக்ஷ்மி பட்டாசு, பாதுகாப்பையும் தரத்தையும் முதன்மை நோக்கமாகக் கொண்டு தொடங்கப்பட்டது.'
                  : 'Sivakasi is globally renowned as India’s fireworks capital, producing over 90% of the nation’s celebratory sparklers. Born in the heart of this vibrant industrial hub, Rajalakshmi Fireworks was founded with a singular conviction: every family deserves magnificent festivities without ever having to compromise on safety.'}
              </p>
              <p>
                {isTa
                  ? 'நாங்கள் மலிவான தரமற்ற ரசாயனங்களை ஒருபோதும் பயன்படுத்துவதில்லை. ஒவ்வொரு பூந்தொட்டி, சக்கரம், கம்பி மத்தாப்பு மற்றும் வாலா வெடிகளும் அனுபவம் வாய்ந்த வல்லுநர்களால் கடுமையான தரப்பரிசோதனைக்கு உட்படுத்தப்பட்ட பிறகே பேக்கிங் செய்யப்படுகின்றன.'
                  : 'We reject substandard chemical shortcuts and outdated stockpiles. From golden handheld sparklers and high-spinning ground chakras to grand multi-burst floral aerial shells, each item is formulated with precision and hand-inspected in moisture-proof packaging before dispatch.'}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isTa ? 'அரசு அங்கீகாரம் பெற்ற PESO பாதுகாப்பு விதிமுறைகள்' : 'PESO Licensed Manufacturing Infrastructure'}</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isTa ? '100% நேரடி தொழிற்சாலை தள்ளுபடி விலைகள்' : 'Genuine Wholesale Discounts Directly Passed to Consumers'}</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            {/* Visual Brand Display Card */}
            <div className="relative w-full aspect-square max-w-sm rounded-[32px] bg-gradient-to-br from-[#800000] via-[#700000] to-[#500000] p-8 text-white flex flex-col justify-between shadow-xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,180,0,0.25),transparent_60%)] pointer-events-none" />

              <div className="space-y-2 relative z-10">
                <BrandLogo variant="footer" imageClassName="h-10 w-auto" />
                <p className="text-xs text-white/80 font-medium">
                  {isTa ? 'அசல் சிவகாசி தொழிற்சாலை நேரடி விற்பனை' : 'Authentic Sivakasi Factory Direct Hub'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2 relative z-10">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Award className="h-4 w-4" />
                  <span>{isTa ? 'உறுதிமொழி' : 'Our Quality Pledge'}</span>
                </div>
                <p className="text-xs text-white/90 leading-snug">
                  {isTa
                    ? '100% புதிய உற்பத்தி. பழைய ஸ்டாக் கிடையாது. வெடிக்காத பட்டாசுகளுக்கு மாற்று அல்லது தீர்வு.'
                    : 'Zero old inventory. 100% fresh batch manufacturing with reliable fuse ignition and brilliant chromatic radiance.'}
                </p>
              </div>

              <div className="text-[11px] text-white/70 font-mono tracking-wider relative z-10">
                SIVAKASI • VIRUDHUNAGAR DT • TAMIL NADU
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Core Pillars of Trust ── */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">
              {isTa ? 'ஏன் ராஜலக்ஷ்மி பட்டாசு?' : 'Why Choose Rajalakshmi Fireworks?'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              {isTa
                ? 'உங்கள் குடும்ப பாதுகாப்பிற்கும் திருநாள் உற்சாகத்திற்கும் நாங்கள் வழங்கும் நான்கு முக்கிய உறுதிமொழிகள்.'
                : 'The four cornerstones that make Rajalakshmi Fireworks the trusted choice for thousands of families and retailers across India.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="p-7 sm:p-8 rounded-[32px] bg-white dark:bg-[#141414] border border-neutral-200/80 dark:border-[#282828] shadow-xs space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${p.color} text-white flex items-center justify-center shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white">
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. Safe Bursting Guidelines ── */}
        <section className="rounded-[36px] bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 p-8 sm:p-12 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>{isTa ? 'பாதுகாப்பு நெறிமுறைகள்' : 'Safety First Protocol'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-950 dark:text-white uppercase tracking-tight">
                {isTa ? 'குடும்ப பட்டாசு பாதுகாப்பு வழிகாட்டி' : 'Family Bursting Safety Recommendations'}
              </h2>
            </div>
            <Link
              href="/products?certified=green"
              className="px-5 py-2.5 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0 shadow-xs"
            >
              {isTa ? 'பசுமை பட்டாசு பட்டியல்' : 'Browse Green Crackers'}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {safetyGuidelines.map((sg, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-[24px] bg-white dark:bg-[#141414] border border-amber-500/20 space-y-2 shadow-2xs"
              >
                <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                  0{idx + 1}
                </div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {sg.title}
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {sg.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. Contact, Depot & Factory Location ── */}
        <section className="rounded-[36px] bg-white dark:bg-[#141414] border border-neutral-200/80 dark:border-[#282828] p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-neutral-100 dark:bg-[#242424] flex items-center justify-center text-neutral-900 dark:text-white">
              <MapPin className="h-5 w-5 text-[#800000] dark:text-amber-400" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
              {isTa ? 'தொழிற்சாலை & கவுண்டர்' : 'Factory & Counter Depot'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {APP_CONFIG.STORE_ADDRESS}
              <br />
              {isTa ? 'விருதுநகர் மாவட்டம், தமிழ்நாடு - 626123' : 'Virudhunagar District, Tamil Nadu, India'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-neutral-100 dark:bg-[#242424] flex items-center justify-center text-neutral-900 dark:text-white">
              <Phone className="h-5 w-5 text-[#800000] dark:text-amber-400" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
              {isTa ? 'நேரடி அழைப்பு உதவி' : 'Direct Call Helpline'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {APP_CONFIG.STORE_PHONE}
              <br />
              {isTa ? 'காலை 8:00 - இரவு 9:00 வரை (அனைத்து நாட்களும்)' : '8:00 AM – 9:00 PM (All 7 Days During Festive Season)'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-neutral-100 dark:bg-[#242424] flex items-center justify-center text-neutral-900 dark:text-white">
              <MessageSquare className="h-5 w-5 text-[#800000] dark:text-amber-400" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
              {isTa ? 'வாட்ஸ்அப் விரைவு தகவல்' : 'WhatsApp Instant Dispatch'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              +{APP_CONFIG.WHATSAPP_NUMBER}
              <br />
              {isTa ? 'ஆர்டர் ரசீது மற்றும் பார்சல் தகவல்' : 'Instant invoice confirmation & lorry parcel receipts'}
            </p>
            <a
              href={`https://wa.me/${APP_CONFIG.WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
            >
              <span>{isTa ? 'வாட்ஸ்அப்பில் தொடர்புகொள்ள' : 'Chat on WhatsApp'}</span>
              <span>→</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
