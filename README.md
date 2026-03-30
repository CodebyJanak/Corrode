# Corrode Browser 🦀

> The browser from 2035. Named after something ancient. Powered by AI, built with oxidized metal aesthetics.

![Corrode Browser](https://img.shields.io/badge/Stack-Electron%20%2B%20React%20%2B%20AI-ea580c?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-111111?style=flat-square)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Second Brain Sidebar** | AI summarizes every page you visit, saved to local SQLite. Semantic search by meaning. |
| **Live Page Intelligence** | Floating chat button — ask AI anything about the current page. |
| **Daily Digest** | "Today You Learned" — AI-generated daily browsing summary with mood inference. |
| **Manipulation Detector** | Highlights emotional manipulation, factual distortion, and dark patterns in real time. |
| **Command Palette** | Ctrl+K — search, navigate, switch tabs, toggle features. |
| **Knowledge Graph** | D3.js force-directed graph of everything you've browsed, connected by topic. |
| **Focus Mode** | 5-second friction delay on blocked sites. Psychological, not hard walls. |
| **Time Warp** | View any site via Wayback Machine with a single click. |
| **Custom New Tab** | Clock, weather, recent sites, AI-suggested rabbit hole. |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or newer
- **npm** v9 or newer

### 1. Install dependencies
```bash
npm install
```

### 2. Set up API keys
```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:

```env
# FREE — get at https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OR use Gemini: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Which to use
AI_PROVIDER=groq

# FREE — https://openweathermap.org/api (standard free tier)
WEATHER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Start the app
```bash
npm start
```

This runs Vite dev server + Electron simultaneously.

---

## 🔑 Getting Free API Keys

### Groq (Recommended — fastest)
1. Go to https://console.groq.com
2. Sign up (free)
3. Create an API key
4. Set `GROQ_API_KEY` in `.env`
5. Set `AI_PROVIDER=groq`

**Free tier:** 30 requests/minute, 14,400/day — more than enough for browsing.

### Google Gemini (Alternative)
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Create an API key
4. Set `GEMINI_API_KEY` in `.env`
5. Set `AI_PROVIDER=gemini`

**Free tier:** 15 requests/minute, 1,500/day.

### OpenWeatherMap (Weather on new tab)
1. Go to https://openweathermap.org/api
2. Sign up → API Keys tab → copy default key
3. Set `WEATHER_API_KEY` in `.env`

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab (planned) |
| `Ctrl+L` | Focus address bar (click it) |
| `Alt+←` | Back |
| `Alt+→` | Forward |

---

## 🗂️ Project Structure

```
corrode/
├── main/                  # Electron main process (Node.js)
│   ├── index.js           # App entry, BrowserWindow creation
│   ├── ipc.js             # All IPC handlers
│   ├── db.js              # SQLite operations (better-sqlite3)
│   ├── ai.js              # AI API calls (Groq / Gemini)
│   └── preload.js         # Secure bridge to renderer
│
├── src/                   # React frontend
│   ├── components/
│   │   ├── Browser/       # TitleBar, TabBar, Toolbar, WebviewArea, PageChat
│   │   ├── Sidebar/       # AI Second Brain
│   │   ├── CommandPalette/
│   │   ├── Graph/         # D3.js knowledge graph
│   │   ├── Digest/        # Daily digest
│   │   └── NewTab/        # Custom new tab page
│   ├── store/             # Zustand global state
│   ├── hooks/             # Reusable hooks
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── public/                # Static assets
├── .env.example           # API key template
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🔒 Security Notes

- **API keys never touch the renderer process.** All AI calls go through Electron IPC → main process.
- The preload script exposes only a typed, limited API surface via `contextBridge`.
- `nodeIntegration: false` + `contextIsolation: true` enforced everywhere.

---

## 🛠️ Build for Distribution

```bash
npm run dist
```

Output: `release/` folder with platform-specific installers.

---

## 🗺️ Roadmap

- [ ] Shared Browsing (WebSocket session sharing)
- [ ] Focus Mode friction UI
- [ ] Local vector embeddings for true semantic search (no API needed)
- [ ] Browser extensions support
- [ ] Per-tab screenshot previews on hover
- [ ] Note-taking overlay (highlight + annotate any page)

---

## 📄 License

MIT — build whatever you want with it.

---

*Built with rust-orange obsession and way too much coffee.*
