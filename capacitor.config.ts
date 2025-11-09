import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sncleaning.cleaners',
  appName: 'SN Cleaning',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#18A5A5',
      overlaysWebView: false
    }
  }
};

export default config;
