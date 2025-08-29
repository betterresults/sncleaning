import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const PWAInstallButton = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleInstall = async () => {
    console.log('Manual install button clicked');
    const success = await install();
    if (!success && !isInstallable) {
      // Show instructions for manual installation
      const userAgent = navigator.userAgent.toLowerCase();
      let instructions = '';
      
      if (userAgent.includes('chrome') && !userAgent.includes('edge')) {
        instructions = 'Chrome: Click the menu (⋮) → "Add to Home screen" or look for the install icon in the address bar';
      } else if (userAgent.includes('firefox')) {
        instructions = 'Firefox: Click the menu (☰) → "Install" or "Add to Home screen"';
      } else if (userAgent.includes('safari')) {
        instructions = 'Safari: Tap the share button (□↗) → "Add to Home Screen"';
      } else if (userAgent.includes('edge')) {
        instructions = 'Edge: Click the menu (⋯) → "Apps" → "Install this site as an app"';
      } else {
        instructions = 'Look for an "Install" option in your browser menu or address bar';
      }
      
      alert(`To install this app:\n\n${instructions}`);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="bg-white/10 hover:bg-white/20 border-white/30 text-white hover:text-white"
    >
      <Smartphone className="h-4 w-4 mr-2" />
      Install App
    </Button>
  );
};

export default PWAInstallButton;