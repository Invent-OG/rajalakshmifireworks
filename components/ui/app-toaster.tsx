'use client';

import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Globally attach info and warning methods to react-hot-toast singleton
if (typeof (toast as any).info !== 'function') {
  (toast as any).info = (message: any, opts?: any) =>
    toast(message, {
      icon: 'ℹ️',
      ...opts,
    });
}

if (typeof (toast as any).warning !== 'function') {
  (toast as any).warning = (message: any, opts?: any) =>
    toast(message, {
      icon: '⚠️',
      ...opts,
    });
}

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={10}
      containerStyle={{
        top: 24,
        right: 24,
        zIndex: 999999,
      }}
      toastOptions={{
        duration: 3000,
        style: {
          background: '#18181b',
          color: '#ffffff',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          padding: '12px 18px',
          fontSize: '13px',
          fontWeight: 600,
          maxWidth: '420px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}

export default AppToaster;
