'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  children: React.ReactNode;
  itemLabel?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  children,
  itemLabel = 'items',
}: BulkActionsBarProps) {
  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            key="bulk-actions-bar"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 32,
              mass: 0.8,
            }}
            className="pointer-events-auto max-w-[calc(100vw-2rem)] bg-zinc-950/95 dark:bg-zinc-900/95 text-white pl-4 pr-3 py-2 rounded-full shadow-2xl shadow-black/50 border border-white/15 backdrop-blur-md flex items-center gap-3 overflow-x-auto no-scrollbar"
          >
            {/* Selection info & Clear button */}
            <div className="flex items-center gap-2 shrink-0 text-xs sm:text-sm font-semibold select-none">
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-white/20 text-white inline-flex items-center justify-center text-[11px] font-bold">
                {selectedCount}
              </span>
              <span className="whitespace-nowrap text-white/90">{itemLabel} selected</span>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-white/60 hover:text-white p-1 ml-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Vertical separator */}
            <div className="h-4 w-px bg-white/20 shrink-0" aria-hidden="true" />

            {/* Actions list */}
            <div className="flex items-center gap-2 shrink-0 flex-nowrap">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
