'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

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
        toast.success('Welcome back, Store Manager');
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Subtle festive ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Console Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-orange-500/25 mb-2">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Operations Console
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sign in to manage Rajalakshmi Fireworks storefront & warehouse
          </p>
        </div>

        {/* Login Box */}
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 luxury-card space-y-5 shadow-xl shadow-black/5"
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
            className="w-full font-bold text-base shadow-lg shadow-orange-500/25 mt-2"
            loading={loading}
          >
            <Lock className="h-4 w-4" />
            Authenticate & Access Desk
          </Button>

          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Encrypted Session with RBAC Protection</span>
          </div>
        </form>
      </div>
    </div>
  );
}
