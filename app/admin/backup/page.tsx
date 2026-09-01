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
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Backup & Safeguards</h1>
        <p className="text-sm text-muted-foreground">
          Safeguard your catalog, order history, and customer database
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Database className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Application-Level Data Export</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Downloads a complete structured JSON archive including all active categories,
              products, stock counts, customer directory, order snapshots, and application settings.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Safe export — sensitive database credentials are excluded.</span>
            </div>
            {lastBackupTime && (
              <div className="flex items-center gap-1.5 text-primary font-medium">
                <Clock className="h-4 w-4" />
                <span>Last exported: {lastBackupTime}</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleDownloadBackup}
            loading={downloading}
            className="shrink-0"
          >
            <Download className="h-4 w-4" /> Download Complete Backup
          </Button>
        </div>
      </div>
    </div>
  );
}
