# Building Android APK for SN Cleaning

This guide explains how to build and distribute the Android APK to your cleaners.

## Prerequisites

1. **Git & GitHub**: Push your code to GitHub repository
2. **Android Studio**: Download from https://developer.android.com/studio
3. **Node.js**: Already installed (for npm commands)

## Step 1: Export to GitHub

1. In Lovable, click "Export to GitHub" button
2. Connect your GitHub account if not already connected
3. Create a new repository or push to existing one
4. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Build the Web App

```bash
npm run build
```

This creates a `dist` folder with your production build.

## Step 4: Add Android Platform

```bash
npx cap add android
```

This creates an `android` folder with your Android project.

## Step 5: Sync Capacitor

```bash
npx cap sync android
```

This copies your web build to the Android project.

## Step 6: Open in Android Studio

```bash
npx cap open android
```

This opens the project in Android Studio.

## Step 7: Build APK in Android Studio

1. In Android Studio, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for the build to complete (shows notification when done)
3. Click **locate** in the notification to find the APK file
4. The APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

## Step 8: Upload to GitHub Releases

1. Go to your GitHub repository
2. Click **Releases** → **Create a new release**
3. Tag version (e.g., `v1.0.0`)
4. Upload the `app-debug.apk` file
5. Publish release
6. Copy the APK download link (looks like: `https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0.0/app-debug.apk`)

## Step 9: Share with Cleaners

Send your cleaners:
1. **The direct APK download link** from GitHub releases
2. **Installation instructions** (see below)

---

## Installation Instructions for Cleaners

### How to Install the SN Cleaning App (Android)

1. **Download the APK**:
   - Open the link we sent you in Chrome or your default browser
   - Tap "Download" when prompted

2. **Enable Installation from Unknown Sources**:
   - Go to **Settings** → **Security** (or **Apps & notifications**)
   - Enable **"Install unknown apps"** for your browser (Chrome/Firefox)
   - Or enable **"Unknown sources"** on older Android versions

3. **Install the App**:
   - Find the downloaded APK in your **Downloads** folder
   - Tap on it to install
   - Tap **Install** when prompted
   - Tap **Open** to launch the app

4. **Login**:
   - Use your cleaner credentials to login
   - The app works exactly like the website but with better camera and file handling

5. **Upload Photos**:
   - Go to your bookings
   - Tap "Upload Photos"
   - Select multiple photos at once (works reliably now!)
   - Photos upload in batches automatically

---

## Updating the App

When you make changes:

1. Make changes in Lovable (or edit code locally)
2. Push changes to GitHub
3. Pull latest code on your local machine:
   ```bash
   git pull origin main
   ```
4. Rebuild:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```
5. Build new APK in Android Studio (Build → Build APK)
6. Upload new APK to GitHub Releases with new version number (e.g., `v1.0.1`)
7. Send cleaners the new download link

**Note**: Cleaners will need to uninstall the old version and install the new one manually (no auto-update with direct APK distribution).

---

## Troubleshooting

### APK won't install
- Make sure "Unknown sources" is enabled
- Try downloading again (file might be corrupted)
- Check Android version (minimum: Android 7.0)

### Camera/Files not working
- Grant camera and storage permissions when prompted
- Go to Settings → Apps → SN Cleaning → Permissions
- Enable Camera and Storage permissions

### App not connecting
- Check internet connection
- The app connects to the same backend as the website
- Try logging out and back in

---

## Future: Google Play Store

Once tested with direct APK distribution, you can publish to the Play Store:

1. Create Google Play Developer account ($25 one-time fee)
2. Build a **signed release APK** in Android Studio
3. Upload to Play Store Console
4. Fill in store listing (description, screenshots, etc.)
5. Submit for review
6. Cleaners can then install from Play Store (with auto-updates!)

For Play Store distribution, you'll also need:
- Privacy policy URL
- App icon (512x512px)
- Feature graphic (1024x500px)
- Screenshots (at least 2)
