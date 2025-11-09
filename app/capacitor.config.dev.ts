import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sncleaning.app',
  appName: 'SN Cleaning Dev',
  webDir: '../dist',
  server: {
    url: 'https://account.sncleaningservices.co.uk',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
