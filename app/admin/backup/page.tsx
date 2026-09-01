'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database, Download, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    setDownloading(true);
    try {
      window.open('/api/admin/backup', '_blank');
      const now = new Date().toLocaleString('en-IN');
      setLastBackupTime(now);
      toast.success('Backup export generated and downloaded');
    } catch {
      toast.error('Failed to trigger backup download');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Data Backup</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Safeguard your catalog, order history, and customer database.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted text-foreground-secondary flex items-center justify-center shrink-0 border border-border">
            <Database className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Complete System Snapshot</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Downloads a structured JSON archive containing active categories,
              products, stock balances, customers, order snapshots, and settings.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>Safe export — sensitive database credentials excluded.</span>
            </div>
            {lastBackupTime && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last exported: {lastBackupTime}</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleDownloadBackup}
            loading={downloading}
            variant="primary"
            size="md"
            className="shrink-0 font-medium text-xs"
          >
            <Download className="h-4 w-4" /> Download Backup JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
