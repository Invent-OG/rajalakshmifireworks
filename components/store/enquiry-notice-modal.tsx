'use client';

import { useEffect, useRef } from 'react';
import { Portal } from '@/components/ui/portal';
import { StoreButton } from '@/components/ui/store-button';
import { Scale, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { gsap, isReducedMotion } from '@/lib/motion';

interface EnquiryNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function EnquiryNoticeModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: EnquiryNoticeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling when modal is active
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // GSAP Entrance
    if (overlayRef.current && modalRef.current && !isReducedMotion()) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.94, y: 16 },
        { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: 'back.out(1.2)' }
      );
    }

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in"
      >
        {/* Backdrop click handler */}
        <div
          className="fixed inset-0"
          onClick={() => {
            if (!isLoading) onClose();
          }}
          aria-hidden="true"
        />

        {/* Modal Window */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-modal-title"
          className="relative w-full max-w-2xl my-auto bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl border border-neutral-200/80 p-6 sm:p-8 space-y-6 z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                    Statutory Compliance
                  </span>
                </div>
                <h2
                  id="notice-modal-title"
                  className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight mt-1"
                >
                  Important Notice
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content - Scrollable if screen is small */}
          <div className="space-y-4 overflow-y-auto pr-1 text-xs sm:text-sm text-neutral-700 leading-relaxed max-h-[50vh]">
            {/* High Court Prohibition Highlight Box */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex gap-3 text-amber-950">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">
                As per the Hon’ble High Court order, direct online sale of crackers is strictly prohibited and punishable by law.
              </p>
            </div>

            <p>
              This website is provided primarily for enquiry purposes. Customers may browse our products and check product details, availability, and indicative price ranges.
            </p>

            <p>
              Customers may submit an enquiry through this website. If the customer agrees, the enquiry may be converted into an order based on their requirements and interest, subject to all applicable laws, rules, and regulations.
            </p>

            <p>
              Rajalakshmi Fireworks does not provide an instant online purchase or checkout facility. Any order confirmation and payment process will be handled only after customer confirmation and in accordance with applicable legal requirements.
            </p>

            <p>
              Rajalakshmi Fireworks strictly follows all applicable protocols and statutory requirements under the relevant laws and regulations, including the Explosives Act. All parcels are dispatched only through registered and legally authorized transport service providers.
            </p>

            {/* Acknowledgment Agreement Box */}
            <div className="p-3.5 rounded-2xl bg-neutral-100/90 border border-neutral-200 text-neutral-900 text-xs font-medium">
              By clicking <span className="font-bold text-neutral-950">“I Understand”</span>, you acknowledge that you have read and agree to these terms before proceeding with an enquiry.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
            <StoreButton
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </StoreButton>

            <StoreButton
              type="button"
              variant="primary"
              size="md"
              onClick={onConfirm}
              loading={isLoading}
              disabled={isLoading}
              className="w-full sm:w-auto bg-neutral-950 hover:bg-neutral-800 text-white min-w-[160px]"
            >
              <CheckCircle2 className="h-4 w-4" />
              I Understand
            </StoreButton>
          </div>
        </div>
      </div>
    </Portal>
  );
}
