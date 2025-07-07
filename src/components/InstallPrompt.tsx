
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMobile } from '@/hooks/use-mobile';

const InstallPrompt = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isMobile = useIsMobile();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
    
    // Debug info
    console.log('InstallPrompt Debug:', {
      isInstallable,
      isInstalled,
      isMobile,
      isDismissed: dismissed === 'true',
      userAgent: navigator.userAgent
    });
  }, [isInstallable, isInstalled, isMobile]);

  const handleInstall = async () => {
    console.log('Install button clicked');
    const success = await install();
    console.log('Install result:', success);
    if (success) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const clearDismissal = () => {
    localStorage.removeItem('pwa-install-dismissed');
    setIsDismissed(false);
  };

  // Don't show if already installed or user dismissed it
  // (Removed mobile-only restriction for testing)
  if (isInstalled || (!isInstallable && isDismissed)) {
    // Show debug info instead when conditions aren't met
    if (showDebug) {
      return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-gray-100 p-3 rounded text-xs">
          <div>Debug: isInstallable={String(isInstallable)}, isInstalled={String(isInstalled)}, isMobile={String(isMobile)}, isDismissed={String(isDismissed)}</div>
          <button onClick={() => setShowDebug(false)} className="mt-2 text-blue-600">Hide Debug</button>
          {isDismissed && <button onClick={clearDismissal} className="mt-2 ml-2 text-green-600">Clear Dismissal</button>}
        </div>
      );
    }
    return (
      <button 
        onClick={() => setShowDebug(true)} 
        className="fixed bottom-4 right-4 z-50 bg-gray-200 p-2 rounded text-xs opacity-50"
      >
        PWA Debug
      </button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-blue-500 p-2 rounded-full">
              <Download className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-blue-900">Install SN Cleaning</h3>
              <p className="text-xs text-blue-700">Add to your home screen for quick access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstallPrompt;
