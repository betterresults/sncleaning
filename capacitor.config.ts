import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ffa08752d8534e878f4f92b4f1e65779',
  appName: 'sncleaning',
  webDir: 'dist',
  server: {
    url: 'https://ffa08752-d853-4e87-8f4f-92b4f1e65779.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
