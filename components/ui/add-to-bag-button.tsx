'use client';

import React, { forwardRef } from 'react';
import { StoreButton, type StoreButtonProps } from '@/components/ui/store-button';
import { ShoppingBag } from 'lucide-react';

export interface AddToBagButtonProps extends StoreButtonProps {
  icon?: React.ReactNode;
}

export const AddToBagButton = forwardRef<HTMLButtonElement, AddToBagButtonProps>(
  ({ icon, children, ...props }, ref) => {
    return (
      <StoreButton
        ref={ref}
        variant="primary"
        icon={icon ?? <ShoppingBag className="h-4 w-4 shrink-0" />}
        {...props}
      >
        {children ?? 'Add to bag'}
      </StoreButton>
    );
  }
);

AddToBagButton.displayName = 'AddToBagButton';

export default AddToBagButton;
