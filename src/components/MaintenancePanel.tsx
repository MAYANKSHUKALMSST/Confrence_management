import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Database, ShieldCheck, Activity, Trash2, Loader2, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/integrations/supabase/client';

const MaintenancePanel = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const fetchStats = async () => {
    try {
      const { data, error } = await api.maintenance.getStatus();
      if (error) throw new Error(error);
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownloadBackup = async () => {
    setIsBackingUp(true);
    try {
      // Use window.location.origin to point to the correct API server
      const downloadUrl = `${window.location.origin}/api/maintenance/backup/download`;
      
      // We use a clean download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Backup generation started. Your download will begin shortly.');
    } catch (err) {
      toast.error('Failed to initiate backup download.');
    } finally {
      setTimeout(() => setIsBackingUp(false), 2000);
    }
  };

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/50 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Database Size</p>
              <p className="text-2xl font-bold">{formatSize(stats?.dbSize || 0)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Users</span>
              <span className="font-semibold">{stats?.userCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Bookings</span>
              <span className="font-semibold">{stats?.bookingCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-success">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">System Uptime</p>
              <p className="text-2xl font-bold">{formatUptime(stats?.uptime || 0)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Node Version</span>
              <span className="font-semibold">{stats?.nodeVersion}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Memory</span>
              <span className="font-semibold">{formatSize(stats?.memoryUsage?.rss || 0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reliability</p>
              <p className="text-2xl font-bold">HA Enabled</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            Daily automated backups are active. Primary (148) and Backup (77) servers are in sync.
          </p>
        </div>
      </div>

      <div className="bg-card/40 border border-white/5 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            Data Safeguards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <h4 className="font-medium text-sm mb-1">Manual Database Export</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Generate and download a full point-in-time snapshot of the SQLite database.
                </p>
                <Button 
                  onClick={handleDownloadBackup} 
                  disabled={isBackingUp}
                  className="w-full gap-2"
                >
                  {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download Backup (.db)
                </Button>
            </div>
          </div>

          <div className="space-y-4">
             <div className="p-4 bg-muted/20 rounded-xl border border-border/50">
                <h4 className="font-medium text-sm mb-1">Backup Infrastructure</h4>
                <ul className="text-[11px] text-muted-foreground space-y-2 mt-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    Automated backups run every 30 minutes.
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    Retention policy: Backups are kept for 6 months (8640 copies).
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    Failover ready: Backup server can take over if primary fails.
                  </li>
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePanel;
