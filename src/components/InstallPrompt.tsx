
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

  // Don't show on /choose-service page
  if (location.pathname === '/choose-service') {
    return null;
  }

  // Don't show if already installed or user dismissed it
  if (isInstalled || isDismissed) {
    return null;
  }

  // Don't show if not installable
  if (!isInstallable) {
    return null;
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
