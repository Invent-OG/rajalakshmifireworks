'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminProfilePage() {
  const queryClient = useQueryClient();

  // Profile Details Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password Management Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch Current Profile
  const { data, isLoading, error } = useQuery<{ user: ProfileData }>({
    queryKey: ['admin', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/admin/profile');
      if (!res.ok) {
        throw new Error('Failed to load profile details');
      }
      return res.json();
    },
  });

  // Populate state when profile loads
  useEffect(() => {
    if (data?.user) {
      setName(data.user.name);
      setEmail(data.user.email);
    }
  }, [data]);

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update profile');
      }
      return json;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'auth'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to change password');
      }
      return json;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Live Password Strength Calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

  const passwordScore = [hasMinLength, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-60 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">Failed to load admin profile. Please try refreshing.</p>
      </div>
    );
  }

  const user = data?.user;

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Profile & Security
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand/10 text-brand border border-brand/20 uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" />
              {user?.role || 'Admin'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your personal admin account, update your email address, and change your login password.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Details + Password Management (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Manage Profile & Email */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-foreground">
                    Account Details
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Update your display name and primary administrative email
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Store Administrator"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-border bg-card text-foreground text-sm shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rajalakshmifireworks.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-border bg-card text-foreground text-sm shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  This email is used to log in to the Store Operations portal.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={updateProfileMutation.isPending}
                  disabled={!name.trim() || !email.trim() || (name === user?.name && email === user?.email)}
                >
                  <Save className="h-4 w-4" /> Save Profile
                </Button>
              </div>
            </form>
          </div>

          {/* Section 2: Manage Password */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-foreground">
                    Manage Password
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Change your password to maintain account security
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                changePasswordMutation.mutate();
              }}
              className="space-y-4"
            >
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Current Password *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-card text-foreground text-sm shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  New Password *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 chars)"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-card text-foreground text-sm shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordScore === 1
                              ? 'w-1/4 bg-red-500'
                              : passwordScore === 2
                              ? 'w-2/4 bg-amber-500'
                              : passwordScore === 3
                              ? 'w-3/4 bg-blue-500'
                              : 'w-full bg-emerald-500'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                        {passwordScore <= 1
                          ? 'Weak'
                          : passwordScore === 2
                          ? 'Fair'
                          : passwordScore === 3
                          ? 'Good'
                          : 'Strong'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                      <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                        {hasMinLength ? '✓' : '•'} 8+ characters
                      </span>
                      <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                        {hasUpperCase ? '✓' : '•'} Uppercase letter
                      </span>
                      <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                        {hasNumber ? '✓' : '•'} Number (0-9)
                      </span>
                      <span className={`flex items-center gap-1 ${hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                        {hasSpecialChar ? '✓' : '•'} Special symbol
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-card text-foreground text-sm shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {confirmPassword.length > 0 && (
                  <p
                    className={`text-[11px] flex items-center gap-1 font-medium mt-1 animate-fade-in ${
                      passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Passwords match
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" /> Passwords do not match
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={changePasswordMutation.isPending}
                  disabled={
                    !currentPassword ||
                    !newPassword ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                >
                  <KeyRound className="h-4 w-4" /> Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Account & Security Overview (1 col) */}
        <div className="space-y-6">
          {/* Security Summary Card */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <ShieldAlert className="h-4 w-4 text-brand" />
              <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Account Meta
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Account ID</span>
                <span className="font-mono font-medium text-foreground">#{user?.id}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Access Role</span>
                <span className="font-medium text-foreground capitalize">{user?.role || 'admin'}</span>
              </div>

              {user?.createdAt && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Created Date</span>
                  <span className="text-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {user?.updatedAt && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Last Modified</span>
                  <span className="text-foreground">
                    {new Date(user.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Security Best Practices Card */}
          <div className="p-6 rounded-2xl bg-brand/5 border border-brand/15 space-y-3">
            <div className="flex items-center gap-2 text-brand">
              <Sparkles className="h-4 w-4 shrink-0" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">
                Security Recommendations
              </h3>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-brand font-bold">•</span>
                <span>Use a passphrase with at least 8 characters including symbols and numbers.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand font-bold">•</span>
                <span>Ensure your email address is active to receive operational alerts and system updates.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand font-bold">•</span>
                <span>Do not share staff administrator credentials across multiple physical devices.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
