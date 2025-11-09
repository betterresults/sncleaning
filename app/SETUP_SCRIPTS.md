# NPM Scripts Setup

Since the Capacitor files are now in the `/app` folder, you'll need to add these helpful scripts to your `package.json` when working locally.

## Add These Scripts to package.json

Open `package.json` and add these scripts to the `"scripts"` section:

```json
{
  "scripts": {
    "cap:add:android": "cd app && npx cap add android",
    "cap:add:ios": "cd app && npx cap add ios",
    "cap:sync": "cd app && npx cap sync android",
    "cap:sync:ios": "cd app && npx cap sync ios",
    "cap:open:android": "cd app && npx cap open android",
    "cap:open:ios": "cd app && npx cap open ios",
    "cap:build": "npm run build && npm run cap:sync"
  }
}
```

## Usage

After adding these scripts, you can use:

```bash
# Add Android platform (first time only)
npm run cap:add:android

# Build web app and sync to Android
npm run cap:build

# Open in Android Studio
npm run cap:open:android

# Or just sync without rebuilding
npm run cap:sync
```

## Manual Commands (Alternative)

If you prefer not to add scripts, you can run commands manually:

```bash
# From project root
npm run build

# Navigate to app folder
cd app

# Run Capacitor commands
npx cap add android
npx cap sync android
npx cap open android
```

---

**Note**: These scripts are optional but make the workflow more convenient.
