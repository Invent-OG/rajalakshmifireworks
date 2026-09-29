'use client';

import React from 'react';
import { Providers } from '@/components/providers';
import AdminLayoutComponent from '@/app/admin/layout';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminLayoutComponent>
        {children}
      </AdminLayoutComponent>
    </Providers>
  );
}
