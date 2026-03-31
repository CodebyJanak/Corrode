/**
 * useBrowserStore.js — Corrode Browser
 * Global Zustand store — now includes theme (light/dark).
 */
import { create } from 'zustand'

let tabIdCounter = 1
const NEW_TAB = 'corrode://newtab'
function createTab(url = NEW_TAB) {
  return { id: tabIdCounter++, url, title: url === NEW_TAB ? 'New Tab' : url, favicon: null, loading: false, canGoBack: false, canGoForward: false }
}

const useBrowserStore = create((set, get) => ({
  tabs: [createTab()],
  activeTabId: 1,

  addTab: (url) => { const t = createTab(url); set(s => ({ tabs: [...s.tabs, t], activeTabId: t.id })); return t.id },
  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    if (tabs.length === 1) { set({ tabs: [createTab()], activeTabId: tabIdCounter - 1 }); return }
    const idx = tabs.findIndex(t => t.id === id)
    const newTabs = tabs.filter(t => t.id !== id)
    set({ tabs: newTabs, activeTabId: activeTabId === id ? newTabs[Math.max(0, idx - 1)].id : activeTabId })
  },
  setActiveTab: (id) => set({ activeTabId: id }),
  updateTab: (id, patch) => set(s => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, ...patch } : t) })),
  getActiveTab: () => { const { tabs, activeTabId } = get(); return tabs.find(t => t.id === activeTabId) },

  // UI
  sidebarOpen: false,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  digestOpen: false,
  openDigest: () => set({ digestOpen: true }),
  closeDigest: () => set({ digestOpen: false }),
  graphOpen: false,
  openGraph: () => set({ graphOpen: true }),
  closeGraph: () => set({ graphOpen: false }),
  manipulationDetectorOn: false,
  toggleManipulationDetector: () => set(s => ({ manipulationDetectorOn: !s.manipulationDetectorOn })),
  focusModeOn: false,
  toggleFocusMode: () => set(s => ({ focusModeOn: !s.focusModeOn })),

  // Theme
  theme: localStorage.getItem('corrode_theme') || 'dark',
  toggleTheme: () => set(s => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('corrode_theme', next)
    document.documentElement.setAttribute('data-theme', next)
    return { theme: next }
  }),

  recentPages: [],
  addRecentPage: (page) => set(s => ({ recentPages: [page, ...s.recentPages.filter(p => p.url !== page.url)].slice(0, 50) })),
}))

export default useBrowserStore
