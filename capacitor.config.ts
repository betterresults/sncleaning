import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sncleaning.cleaners',
  appName: 'SN Cleaning',
  webDir: 'dist',
  server: {
    url: 'https://ffa08752-d853-4e87-8f4f-92b4f1e65779.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#18A5A5',
      overlaysWebView: false
    }
  }
};

export default config;
