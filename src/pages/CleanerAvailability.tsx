import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CleanerAvailability from '@/components/cleaner/CleanerAvailability';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import CleanerTopNav from '@/components/cleaner/CleanerTopNav';
import { isCapacitor } from '@/utils/capacitor';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CleanerAvailabilityPage = () => {
  const { cleanerId, loading } = useAuth();
  const isMobile = useIsMobile();

  const isMobileView = isCapacitor() || isMobile;

  if (loading) {
    return <ShellLoading />;
  }

  if (isMobileView) {
    return (
      <div className="min-h-screen bg-background">
        <CleanerTopNav />

        <main className="pt-header-safe pb-20 content-bottom-spacer">
          <div className="p-4 pt-2">
            <CleanerAvailability cleanerId={cleanerId} />
          </div>
        </main>

        <CleanerBottomNav />
      </div>
    );
  }

  return (
    <ShellPage width="wide">
      <CleanerAvailability cleanerId={cleanerId} />
    </ShellPage>
  );
};

export default CleanerAvailabilityPage;
