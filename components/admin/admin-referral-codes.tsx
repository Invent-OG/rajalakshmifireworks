'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Gift, Copy, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { withAdminShell } from './admin-shell';

type Code = { id: number; code: string; description: string | null; rewardType: string; rewardValue: string; maxDiscount: string | null; minOrderValue: string; usageLimit: number | null; usageCount: number; startsAt: string | null; expiresAt: string | null; isActive: boolean };
const blank = { code: '', description: '', rewardType: 'PERCENT', rewardValue: '', maxDiscount: '', minOrderValue: '0', usageLimit: '', startsAt: '', expiresAt: '' };

function ReferralCodesContent() {
  const client = useQueryClient();
  const [form, setForm] = useState(blank);
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'referral-codes'], queryFn: async () => { const r = await fetch('/api/admin/referral-codes'); if (!r.ok) throw new Error('Could not load referral codes'); return r.json(); } });
  const create = useMutation({ mutationFn: async () => { const r = await fetch('/api/admin/referral-codes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }); const result = await r.json(); if (!r.ok) throw new Error(result.message || 'Could not create code'); return result; }, onSuccess: () => { setForm(blank); client.invalidateQueries({ queryKey: ['admin', 'referral-codes'] }); toast.success('Referral code created'); }, onError: (e: Error) => toast.error(e.message) });
  const toggle = useMutation({ mutationFn: async (code: Code) => { const r = await fetch(`/api/admin/referral-codes/${code.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isActive: !code.isActive }) }); const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Could not update code'); }, onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'referral-codes'] }), onError: (e: Error) => toast.error(e.message) });
  const codes: Code[] = data?.codes || [];
  const field = (key: keyof typeof blank, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="space-y-6 p-4 sm:p-6">
    <header className="flex items-center gap-3"><div className="rounded-2xl bg-orange-100 p-3 text-orange-700"><Gift /></div><div><h1 className="text-2xl font-bold">Referral codes</h1><p className="text-sm text-muted-foreground">Create and manage customer referral rewards.</p></div></header>
    <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-neutral-900"><h2 className="mb-4 text-lg font-semibold">Create a code</h2><form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
      <label className="text-sm">Code<Input required minLength={3} maxLength={40} value={form.code} onChange={(e) => field('code', e.target.value.toUpperCase())} placeholder="FRIEND10" /></label>
      <label className="text-sm">Reward type<select className="mt-1 h-10 w-full rounded-md border bg-transparent px-3" value={form.rewardType} onChange={(e) => field('rewardType', e.target.value)}><option value="PERCENT">Percentage</option><option value="FIXED">Fixed amount (₹)</option></select></label>
      <label className="text-sm">Reward value<Input required type="number" min="0.01" step="0.01" max={form.rewardType === 'PERCENT' ? 100 : undefined} value={form.rewardValue} onChange={(e) => field('rewardValue', e.target.value)} placeholder={form.rewardType === 'PERCENT' ? '10' : '100'} /></label>
      <label className="text-sm">Maximum discount (₹, optional)<Input type="number" min="0.01" step="0.01" value={form.maxDiscount} onChange={(e) => field('maxDiscount', e.target.value)} /></label>
      <label className="text-sm">Minimum order (₹)<Input type="number" min="0" step="0.01" value={form.minOrderValue} onChange={(e) => field('minOrderValue', e.target.value)} /></label>
      <label className="text-sm">Use limit (blank = unlimited)<Input type="number" min="1" step="1" value={form.usageLimit} onChange={(e) => field('usageLimit', e.target.value)} /></label>
      <label className="text-sm">Starts at<Input type="datetime-local" value={form.startsAt} onChange={(e) => field('startsAt', e.target.value)} /></label>
      <label className="text-sm">Expires at<Input type="datetime-local" value={form.expiresAt} onChange={(e) => field('expiresAt', e.target.value)} /></label>
      <label className="text-sm sm:col-span-2 lg:col-span-3">Description (optional)<Input maxLength={255} value={form.description} onChange={(e) => field('description', e.target.value)} placeholder="Who this referral offer is for" /></label>
      <div className="flex items-end"><Button type="submit" disabled={create.isPending}><Plus className="mr-2 h-4 w-4" />{create.isPending ? 'Creating…' : 'Create code'}</Button></div>
    </form></section>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-neutral-900"><div className="border-b p-5"><h2 className="text-lg font-semibold">All referral codes</h2><p className="text-sm text-muted-foreground">{codes.length} code{codes.length === 1 ? '' : 's'} · usage totals shown</p></div>{isLoading ? <p className="p-6">Loading referral codes…</p> : codes.length === 0 ? <p className="p-8 text-center text-muted-foreground">No referral codes yet. Create the first one above.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr>{['Code', 'Reward', 'Minimum order', 'Uses', 'Validity', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{codes.map((c) => <tr key={c.id} className="border-t"><td className="px-4 py-3"><div className="font-mono font-bold">{c.code}</div>{c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}<button className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700" onClick={() => { navigator.clipboard.writeText(c.code).then(() => toast.success('Code copied')); }}><Copy className="h-3 w-3" />Copy</button></td><td className="px-4 py-3">{c.rewardType === 'PERCENT' ? `${Number(c.rewardValue)}%` : `₹${Number(c.rewardValue).toLocaleString('en-IN')}`}{c.maxDiscount && <div className="text-xs text-muted-foreground">up to ₹{Number(c.maxDiscount).toLocaleString('en-IN')}</div>}</td><td className="px-4 py-3">₹{Number(c.minOrderValue).toLocaleString('en-IN')}</td><td className="px-4 py-3">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ' / ∞'}</td><td className="px-4 py-3">{c.startsAt ? new Date(c.startsAt).toLocaleDateString() : 'Now'} – {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'No expiry'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'}`}>{c.isActive ? 'Active' : 'Paused'}</span></td><td className="px-4 py-3"><Button variant="outline" size="sm" onClick={() => toggle.mutate(c)} aria-label={`${c.isActive ? 'Pause' : 'Activate'} ${c.code}`}>{c.isActive ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}{c.isActive ? 'Pause' : 'Activate'}</Button></td></tr>)}</tbody></table></div>}</section>
  </div>;
}

export default withAdminShell(ReferralCodesContent);
