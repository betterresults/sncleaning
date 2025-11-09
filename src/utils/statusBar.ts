import { StatusBar, Style } from '@capacitor/status-bar';
import { isCapacitor } from './capacitor';

export const initializeStatusBar = async () => {
  if (!isCapacitor()) return;

  try {
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Light });
    
    // Set status bar background color
    await StatusBar.setBackgroundColor({ color: '#18A5A5' });
    
    // Don't overlay the webview
    await StatusBar.setOverlaysWebView({ overlay: false });
    
    console.log('StatusBar initialized');
  } catch (error) {
    console.error('Error initializing StatusBar:', error);
  }
};
