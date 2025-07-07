
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSInstalled = (window.navigator as any).standalone === true;
    const installed = isInStandaloneMode || isIOSInstalled;
    
    console.log('PWA Install Debug:', {
      isInStandaloneMode,
      isIOSInstalled,
      installed,
      userAgent: navigator.userAgent
    });
    
    setIsInstalled(installed);

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA beforeinstallprompt event fired:', e);
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA app installed event fired');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    console.log('Install function called, installPrompt:', installPrompt);
    
    if (!installPrompt) {
      console.error('No install prompt available');
      return false;
    }

    try {
      console.log('Calling installPrompt.prompt()');
      await installPrompt.prompt();
      
      console.log('Waiting for user choice...');
      const result = await installPrompt.userChoice;
      
      console.log('User choice result:', result);
      
      if (result.outcome === 'accepted') {
        console.log('User accepted installation');
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      } else {
        console.log('User dismissed installation');
      }
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    install
  };
};
