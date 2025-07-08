
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
  if (isInstalled || isDismissed) {
    return null;
  }

  // Don't show if not installable and not in debug mode
  if (!isInstallable) {
    // Show debug info only when needed
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border-0" style={{ backgroundColor: '#18A5A5' }}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#185166' }}>
              <Download className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Install SN Cleaning</h3>
              <p className="text-white/90 text-sm">Add our app to your home screen for quick access to all cleaning services</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleInstall}
                className="flex-1 bg-white text-black hover:bg-gray-100 font-semibold"
                size="lg"
              >
                Install Now
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/10 px-3"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPrompt;
