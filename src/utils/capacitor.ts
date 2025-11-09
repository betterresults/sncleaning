import { Capacitor } from '@capacitor/core';

/**
 * Checks if the app is running in a Capacitor native environment
 */
export const isCapacitor = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Gets the current platform (ios, android, web)
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Checks if running on Android
 */
export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Checks if running on iOS
 */
export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};
