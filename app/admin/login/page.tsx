'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/ui/brand-logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        toast.success('Signed in successfully');
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Invalid email or password');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Console Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <BrandLogo className="h-24 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Store Operations
          </h1>
          <p className="text-xs text-muted-foreground">
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
