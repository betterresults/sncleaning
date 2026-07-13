import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import CleanerAvailability from '@/components/cleaner/CleanerAvailability';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import CleanerTopNav from '@/components/cleaner/CleanerTopNav';
import { isCapacitor } from '@/utils/capacitor';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CleanerAvailabilityPage = () => {
  const { cleanerId, userRole, loading } = useAuth();
  const { selectedCleanerId, setSelectedCleanerId } = useAdminCleaner();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const isMobileView = isCapacitor() || isMobile;
  const isAdminViewing = userRole === 'admin';
  // Admins have no cleanerId of their own — they browse via the AdminCleanerSelector instead.
  const effectiveCleanerId = isAdminViewing ? selectedCleanerId : cleanerId;

  // Deep-link from cleaners ops: /cleaner-availability?cleanerId=23
  useEffect(() => {
    if (!isAdminViewing) return;
    const raw = searchParams.get('cleanerId');
    if (!raw) return;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    if (selectedCleanerId === parsed) return;
    setSelectedCleanerId(parsed);
  }, [isAdminViewing, searchParams, selectedCleanerId, setSelectedCleanerId]);

  if (loading) {
    return <ShellLoading />;
  }

  if (isMobileView) {
    return (
      <div className="min-h-screen bg-background">
        <CleanerTopNav />

        <main className="pt-header-safe pb-20 content-bottom-spacer">
          <div className="p-4 pt-2">
            {isAdminViewing && (
              <div className="mb-4">
                <AdminCleanerSelector />
              </div>
            )}
            <CleanerAvailability cleanerId={effectiveCleanerId} isAdminViewing={isAdminViewing} isMobileView />
          </div>
        </main>

        <CleanerBottomNav />
      </div>
    );
  }

  return (
    <ShellPage width="wide">
      {isAdminViewing && (
        <div className="mb-3 sm:mb-4">
          <AdminCleanerSelector />
        </div>
      )}
      <CleanerAvailability cleanerId={effectiveCleanerId} isAdminViewing={isAdminViewing} />
    </ShellPage>
  );
};

export default CleanerAvailabilityPage;
