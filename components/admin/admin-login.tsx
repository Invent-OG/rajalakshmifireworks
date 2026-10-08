'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ShieldCheck, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/ui/brand-logo';
import { useAdminTheme } from '@/hooks/use-admin-theme';

import { Providers } from '@/components/providers';

function AdminLoginPageContent() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { theme, toggleTheme } = useAdminTheme();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Signed in successfully');
      window.location.href = '/admin';
    },
    onError: (err: any) => {
      toast.error(err.message || 'Login failed. Please try again.');
    },
  });

  const loading = loginMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4 py-12 relative selection:bg-brand selection:text-brand-foreground">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold text-foreground transition-all shadow-xs cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Brand Console Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <BrandLogo className="h-24 w-auto" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Store Operations
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Sign in to manage catalog, orders, and fulfillment.
          </p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-7 rounded-2xl bg-card border border-border space-y-4 shadow-xs"
        >
          <div className="space-y-4">
            <Input
              label="Manager Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@rajalakshmifireworks.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            className="w-full font-medium mt-2"
            loading={loading}
          >
            <Lock className="h-4 w-4" />
            Sign In
          </Button>

          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            <span>Encrypted Session Protection</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Providers>
      <AdminLoginPageContent />
    </Providers>
  );
}

