# SN Cleaning - Native Mobile App (Capacitor)

This folder contains all the configuration and documentation for the SN Cleaning native mobile app built with Capacitor.

## 📁 Folder Structure

```
/app/
├── capacitor.config.ts          # Capacitor configuration
├── docs/                        # Documentation
│   ├── BUILD_APK.md            # How to build APK for distribution
│   ├── CLEANER_INSTRUCTIONS.md # Installation guide for cleaners
│   └── README.md               # This file
├── android/                     # Android native project (created after npx cap add android)
└── ios/                         # iOS native project (created after npx cap add ios)
```

## 🚀 What is This?

This is a **native mobile app** version of the SN Cleaning web application. It uses Capacitor to wrap the React web app into a native Android/iOS app with access to native device features like:

- Native file picker for better photo uploads
- Camera integration
- Offline support
- Native performance

## 🎯 Why Native App vs Website?

### The Problem with Website (PWA)
Some Android devices have limitations with the Progressive Web App (PWA):
- File picker doesn't allow multiple photo selection
- Camera integration is limited
- Upload reliability varies by device
- Browser limitations on older Android versions

### The Solution: Native App
The native app provides:
✅ Native file picker - select multiple photos easily
✅ Better camera integration
✅ More reliable photo uploads
✅ Works on all Android devices consistently
✅ Can be distributed via APK or Google Play Store

## 🛠️ Quick Start (Local Development)

### Prerequisites
- Node.js installed
- Android Studio (for Android)
- Xcode (for iOS, Mac only)
- Git

### Setup Steps

1. **Clone the repository and install dependencies**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   npm install
   ```

2. **Build the web app**
   ```bash
   npm run build
   ```

3. **Navigate to app folder and add platform**
   ```bash
   cd app
   npx cap add android
   # or for iOS:
   # npx cap add ios
   ```

4. **Sync the web build to native platform**
   ```bash
   npx cap sync android
   ```

5. **Open in IDE**
   ```bash
   npx cap open android
   # or for iOS:
   # npx cap open ios
   ```

6. **Build and run** in Android Studio or Xcode

### Updating After Code Changes

When you make changes to the web app:

```bash
# From project root
npm run build

# From app folder
cd app
npx cap sync android
npx cap open android
```

## 📱 Building for Distribution

See [BUILD_APK.md](./docs/BUILD_APK.md) for detailed instructions on:
- Building release APK
- Uploading to GitHub Releases
- Distributing to cleaners
- Publishing to Google Play Store

## 📖 Documentation

- **[BUILD_APK.md](./docs/BUILD_APK.md)** - Complete guide for building and distributing the APK
- **[CLEANER_INSTRUCTIONS.md](./docs/CLEANER_INSTRUCTIONS.md)** - Installation and usage guide for cleaners
- **[README.md](./docs/README.md)** - This file

## 🔧 How It Works

### Native File Picker Integration

The app uses a custom native file picker implementation (`src/utils/nativeFilePicker.ts`) that:
1. Detects if running in Capacitor native environment
2. Uses native file input with `capture` attribute for camera
3. Handles multiple file selection reliably
4. Returns standard File objects to the web app

### Hot Reload During Development

The `capacitor.config.ts` is configured with a `server.url` that points to the Lovable sandbox:
```typescript
server: {
  url: 'https://ffa08752-d853-4e87-8f4f-92b4f1e65779.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

This allows you to:
- Make changes in Lovable
- See updates instantly in the native app (on emulator or device)
- No need to rebuild for every change during development

**For production builds**, you should remove or comment out the `server` section so the app uses the bundled web assets.

## 🧪 Testing

### On Emulator
- **Android**: Use Android Studio's AVD Manager
- **iOS**: Use Xcode's iOS Simulator (Mac only)

### On Physical Device
1. Enable developer mode on your device
2. Connect via USB
3. Run from Android Studio or Xcode
4. The app will install and run on your device

### Testing Photo Upload
The main feature to test is photo upload:
1. Go to a booking
2. Tap "Upload Photos"
3. Select multiple photos from gallery or take new ones
4. Verify all photos upload successfully

## 📦 Distribution Options

### Option 1: Direct APK Download (Current Method)
- Build APK in Android Studio
- Upload to GitHub Releases
- Share download link with cleaners
- Cleaners install manually (enable "Unknown sources")
- **Pros**: Free, fast, no approval process
- **Cons**: Manual updates, requires "Unknown sources"

### Option 2: Google Play Store (Future)
- Create Google Play Developer account ($25 one-time)
- Build signed release APK
- Submit to Play Store
- **Pros**: Professional, automatic updates, no "Unknown sources"
- **Cons**: $25 fee, approval process, ongoing compliance

## 📂 Relevant Files

### Configuration
- `/app/capacitor.config.ts` - Capacitor configuration
- `/src/utils/capacitor.ts` - Capacitor utility functions
- `/src/utils/nativeFilePicker.ts` - Native file picker implementation

### Documentation
- `/app/docs/BUILD_APK.md` - Build instructions
- `/app/docs/CLEANER_INSTRUCTIONS.md` - User guide
- `/app/docs/README.md` - This file

### Generated (after setup)
- `/app/android/` - Android native project
- `/app/ios/` - iOS native project

## 🔍 Troubleshooting

### Build fails in Android Studio
- Make sure you've run `npm run build` first
- Run `npx cap sync android` to sync latest changes
- Clean and rebuild in Android Studio

### Changes not showing in app
- Make sure you've run `npm run build`
- Run `npx cap sync android`
- For hot reload during development, changes should appear automatically

### Native features not working
- Check permissions in `AndroidManifest.xml` (inside `/app/android/app/src/main/`)
- Make sure Capacitor plugins are installed
- Check if running on actual device (some features don't work on emulator)

## 🎓 Next Steps

1. ✅ Set up local development environment
2. ✅ Build and test the app on emulator/device
3. ✅ Build production APK
4. ✅ Distribute to cleaners via GitHub Releases
5. 🔜 Gather feedback and iterate
6. 🔜 Consider Play Store distribution

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Download](https://developer.android.com/studio)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

**Questions?** Check the other documentation files in `/app/docs/` or refer to the Capacitor documentation.
