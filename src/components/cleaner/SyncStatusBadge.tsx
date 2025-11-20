import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { Network } from '@capacitor/network';
import { getUploadStats } from '@/utils/photoQueue';
import { isSyncInProgress } from '@/utils/syncQueue';
import { isCapacitor } from '@/utils/capacitor';
import { cn } from '@/lib/utils';

export default function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({ pending: 0, uploading: 0, failed: 0, total: 0 });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isCapacitor()) return;

    // Initial status
    updateStatus();

    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for network changes
    const listener = Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
      updateStatus();
    });

    return () => {
      clearInterval(interval);
      listener.then(l => l.remove());
    };
  }, []);

  async function updateStatus() {
    const [networkStatus, uploadStats, syncStatus] = await Promise.all([
      Network.getStatus(),
      getUploadStats(),
      Promise.resolve(isSyncInProgress()),
    ]);

    setIsOnline(networkStatus.connected);
    setStats(uploadStats);
    setSyncing(syncStatus);
  }

  if (!isCapacitor()) {
    return null; // Don't show on web
  }

  // Nothing to sync
  if (stats.total === 0) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg border",
      syncing && isOnline
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : stats.failed > 0
        ? "bg-red-50 text-red-700 border-red-200"
        : !isOnline
        ? "bg-gray-50 text-gray-700 border-gray-200"
        : "bg-green-50 text-green-700 border-green-200"
    )}>
      {syncing && isOnline ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Syncing {stats.uploading} of {stats.total} photos...</span>
        </>
      ) : stats.failed > 0 ? (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>{stats.failed} photos failed</span>
        </>
      ) : !isOnline ? (
        <>
          <CloudOff className="h-4 w-4" />
          <span>{stats.total} photos pending (offline)</span>
        </>
      ) : (
        <>
          <Cloud className="h-4 w-4" />
          <span>{stats.total} photos ready to sync</span>
        </>
      )}
    </div>
  );
}
