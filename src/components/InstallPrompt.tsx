
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';

const InstallPrompt = () => {
  const location = useLocation();
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

  const forceShowPrompt = () => {
    localStorage.removeItem('pwa-install-dismissed');
    setIsDismissed(false);
    setShowDebug(false);
  };

  // Don't show on /choose-service page
  if (location.pathname === '/choose-service') {
    return null;
  }

  // Don't show if already installed or user dismissed it
  if (isInstalled || isDismissed) {
    return null;
  }

  // Don't show if not installable and not in debug mode
  if (!isInstallable) {
    // Show debug info only when needed
    if (showDebug) {
      return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-gray-100 p-3 rounded text-xs space-y-2">
          <div>Debug: isInstallable={String(isInstallable)}, isInstalled={String(isInstalled)}, isMobile={String(isMobile)}, isDismissed={String(isDismissed)}</div>
          <div className="flex gap-2">
            <button onClick={() => setShowDebug(false)} className="text-blue-600 bg-blue-100 px-2 py-1 rounded">Hide Debug</button>
            {isDismissed && <button onClick={clearDismissal} className="text-green-600 bg-green-100 px-2 py-1 rounded">Clear Dismissal</button>}
            <button onClick={forceShowPrompt} className="text-purple-600 bg-purple-100 px-2 py-1 rounded">Force Show Install</button>
          </div>
          <div className="text-xs text-gray-600">
            Tip: If install prompt not showing, try clearing browser cache or use incognito mode
          </div>
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
      <Card className="w-full max-w-md shadow-2xl border-0 relative" style={{ backgroundColor: '#18A5A5' }}>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 text-white hover:bg-white/10 p-2"
        >
          <X className="h-4 w-4" />
        </Button>
        <CardContent className="p-6 pt-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#185166' }}>
              <Download className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Install SN Cleaning</h3>
              <p className="text-white/90 text-sm">Add our app to your home screen for quick access to all cleaning services</p>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleInstall}
                className="w-full bg-white text-black hover:bg-gray-100 font-semibold"
                size="lg"
              >
                Install Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPrompt;
