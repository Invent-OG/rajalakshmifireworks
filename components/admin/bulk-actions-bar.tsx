'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
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
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto bg-foreground text-background px-4 py-3 rounded-2xl shadow-2xl border border-foreground/20 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-2 pr-2 border-r border-background/20 text-xs font-semibold">
        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-background text-foreground inline-flex items-center justify-center text-[11px] font-bold">
          {selectedCount}
        </span>
        <span>{itemLabel} selected</span>
        <button
          onClick={onClearSelection}
          className="text-background/70 hover:text-background p-0.5 ml-1 rounded hover:bg-background/10 transition-colors"
          title="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}
