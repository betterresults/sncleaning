# Capacitor Native App Setup

Your app now has **Capacitor** configured for native Android (and iOS) deployment!

## What Changed?

✅ **Capacitor Core** installed with Android/iOS support  
✅ **Native file picker** integration for reliable bulk photo uploads  
✅ **Capacitor config** created with your app details  
✅ **Upload dialog** updated to use native file picker when running in Capacitor  

## Quick Start

### 1. Install Dependencies (Local Dev)

After exporting to GitHub and cloning locally:

```bash
npm install
```

### 2. Build Your Web App

```bash
npm run build
```

### 3. Initialize Capacitor (First Time Only)

Already configured! The `capacitor.config.ts` file is ready with:
- **App ID**: `app.lovable.ffa08752d8534e878f4f92b4f1e65779`
- **App Name**: `sncleaning`
- **Server URL**: Points to your Lovable sandbox for hot-reload during development

### 4. Add Android Platform

```bash
npx cap add android
```

### 5. Sync Web Build to Native

```bash
npx cap sync android
```

### 6. Open in Android Studio

```bash
npx cap open android
```

### 7. Build APK

In Android Studio:
- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- Find APK: `android/app/build/outputs/apk/debug/app-debug.apk`

### 8. Upload to GitHub Releases

1. Go to your repo → **Releases** → **Create new release**
2. Upload the APK file
3. Share the download link with cleaners

📖 **Full instructions**: See `BUILD_APK.md`

---

## How It Works

### Native File Picker

When running in Capacitor (native app), the photo upload dialog automatically uses Android's native file picker instead of the PWA file input. This provides:

- ✅ **Reliable bulk selection** (30+ photos at once)
- ✅ **Better camera integration**
- ✅ **Stable file handling** (no memory issues)
- ✅ **Native Android UI** (familiar to users)

### Detection

The app automatically detects if it's running in Capacitor using:

```typescript
import { isCapacitor, getPlatform } from '@/utils/capacitor';

if (isCapacitor()) {
  // Use native file picker
  const files = await pickFilesNative({ multiple: true, accept: 'image/*' });
} else {
  // Use web file input (PWA/browser)
  input.click();
}
```

### Development vs Production

**During Development** (in Lovable sandbox):
- The app runs as a **web app** (not Capacitor)
- Uses standard web file inputs
- Perfect for testing web functionality

**After Building APK**:
- The app runs as a **native Android app**
- Automatically switches to native file picker
- Better performance and reliability

---

## Updating the Native App

When you make changes in Lovable:

1. **Export to GitHub** (push changes)
2. **Pull locally**: `git pull origin main`
3. **Rebuild**: `npm run build`
4. **Sync**: `npx cap sync android`
5. **Build new APK** in Android Studio
6. **Upload new version** to GitHub Releases

---

## Distribution Options

### Option 1: Direct APK (Current Setup)
- ✅ **Free**
- ✅ **Fast** (no app store review)
- ✅ **Full control**
- ❌ No auto-updates (cleaners reinstall manually)
- ❌ "Install unknown apps" required

### Option 2: Google Play Store (Future)
- ✅ Auto-updates
- ✅ Professional distribution
- ✅ No security warnings
- ❌ **$25 one-time fee**
- ❌ Store review process (few days)

**Recommended**: Start with direct APK, migrate to Play Store once tested.

---

## Testing the Native App

### Test on Emulator

In Android Studio:
1. **Tools** → **Device Manager**
2. Create/start an Android emulator
3. **Run** → **Run 'app'**

### Test on Physical Device

1. Enable **Developer Options** on your Android phone
2. Enable **USB Debugging**
3. Connect via USB
4. **Run** → **Run 'app'** in Android Studio
5. Select your device

---

## Troubleshooting

### "Native file picker only works on native platforms"
- This error appears when testing in browser/PWA
- **Normal behavior** - the app falls back to web input
- Only shows in native APK

### File picker not appearing in APK
- Check Android permissions in `AndroidManifest.xml`
- Ensure storage permissions are granted
- Try reinstalling the APK

### APK build fails
- Run: `npx cap sync android`
- Clean build in Android Studio: **Build** → **Clean Project**
- Rebuild

---

## File Structure

```
capacitor.config.ts       # Capacitor configuration
BUILD_APK.md             # Detailed build instructions
src/utils/capacitor.ts   # Capacitor detection utilities
src/utils/nativeFilePicker.ts  # Native file picker implementation
```

---

## Next Steps

1. ✅ **Export to GitHub**
2. ✅ **Clone locally** and run `npm install`
3. ✅ **Build APK** following `BUILD_APK.md`
4. ✅ **Test with a cleaner**
5. ✅ **Iterate and improve**
6. 🎯 **Optional**: Publish to Google Play Store

Questions? Check `BUILD_APK.md` for detailed walkthrough!
