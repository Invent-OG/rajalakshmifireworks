'use client';

import React from 'react';
import { Providers } from '@/components/providers';
import AdminLayoutComponent from './admin-layout';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminLayoutComponent>
        {children}
      </AdminLayoutComponent>
    </Providers>
  );
}

export function withAdminShell<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedAdminPage(props: P) {
    return (
      <AdminShell>
        <Component {...props} />
      </AdminShell>
    );
  };
}

