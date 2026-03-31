# Corrode Browser 🦀

> The browser from 2035. Runs on Windows, Mac, Linux, and Android.

---

## Platform Support

| Platform | Format | How |
|---|---|---|
| Windows | `.exe` installer | Electron Builder |
| macOS | `.dmg` | Electron Builder |
| Linux | `.AppImage` / `.deb` | Electron Builder |
| Android | `.apk` | Capacitor |
| Browser (dev) | Web app | Vite |

---

## Quick Start 

```bash
npm install
npm run dev        # starts Vite on http://localhost:5173
```

Open `http://localhost:5173` in your browser. On first load you'll be prompted to enter a free API key.

---

## Getting Free API Keys

### Groq (Recommended — fastest)
1. Go to https://console.groq.com → Sign up free
2. API Keys → Create Key → copy it
3. Paste in the Settings modal inside Corrode

### Google Gemini (Alternative)
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google → Get API Key
3. Paste in Settings modal

---

### Prerequisites
- Node.js 18+
- On Windows: nothing extra needed
- On Mac: Xcode Command Line Tools (`xcode-select --install`)
- On Linux: `sudo apt install rpm` for RPM builds

### Setup
```bash
npm install

# Copy and fill in your API keys
cp .env.example .env
# Edit .env — add GROQ_API_KEY or GEMINI_API_KEY
```

### Build commands

```bash
# Current platform (auto-detects Windows/Mac/Linux)
npm run desktop:build

# Specific platforms (must run on that OS or use CI)
npm run desktop:win      # → release/desktop/*.exe
npm run desktop:mac      # → release/desktop/*.dmg
npm run desktop:linux    # → release/desktop/*.AppImage
```

Output files are in `release/desktop/`.

### Cross-compiling note
- `.exe` → must build on Windows (or use GitHub Actions)
- `.dmg` → must build on macOS
- `.AppImage` → can build on any Linux

---

## Build for Android (.apk)

> Requires Android Studio installed on a desktop machine.

### Prerequisites
1. Install Android Studio: https://developer.android.com/studio
2. Install Java 17+
3. Make sure `ANDROID_HOME` env var is set

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Build the React app
npm run build

# 3. Add Android platform (first time only)
npm run android:init

# 4. Sync web assets into Android project
npm run android:sync

# 5. Open in Android Studio
npm run android:open
```

In Android Studio:
- Wait for Gradle sync to finish
- Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`

### Install APK on your phone
```bash
# Via USB (enable Developer Options + USB Debugging on phone first)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or just copy the .apk to your phone and open it
```

---

## Project Structure

```
corrode/
├── main/              # Electron main process (desktop only)
│   ├── index.js       # BrowserWindow + app setup
│   ├── ipc.js         # IPC handlers
│   ├── db.js          # SQLite (Node.js, desktop)
│   ├── ai.js          # AI calls (desktop, keys in .env)
│   └── preload.js     # Secure bridge to renderer
│
├── src/               # React app (runs everywhere)
│   ├── platform.js    # ← Platform bridge (Electron vs Android/Web)
│   ├── db-web.js      # ← sql.js + IndexedDB (Android/Web)
│   ├── components/
│   │   ├── Browser/   # TitleBar, TabBar, Toolbar, WebviewArea, PageChat, Settings
│   │   ├── Sidebar/   # AI Second Brain
│   │   ├── CommandPalette/
│   │   ├── Graph/     # D3 knowledge graph
│   │   ├── Digest/    # Daily digest
│   │   └── NewTab/    # Custom new tab
│   ├── store/         # Zustand state
│   └── App.jsx
│
├── capacitor.config.json   # Android build config
├── .env.example            # Desktop API key template
└── package.json
```

---

## How Platform Detection Works

`src/platform.js` detects the environment at runtime:

- **Electron** → `window.corrode` exists (injected by preload.js) → uses IPC for DB and AI (keys stay secure in main process)
- **Android/Web** → no `window.corrode` → uses `sql.js` + IndexedDB for DB, direct API fetch for AI (key stored in localStorage)

All components import from `platform.js` — they don't know or care which platform they're on.
