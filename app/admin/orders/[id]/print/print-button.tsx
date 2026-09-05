'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <Button
      variant="primary"
      size="sm"
      className="text-xs font-semibold"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4 mr-1.5" /> Print Invoice
    </Button>
  );
}
