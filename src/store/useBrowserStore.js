/**
 * src/store/useBrowserStore.js — Corrode Browser
 * Single Zustand store for all global state.
 */

import { create } from 'zustand'

let tabIdCounter = 1

const NEW_TAB_URL = 'corrode://newtab'

function createTab(url = NEW_TAB_URL) {
  return {
    id: tabIdCounter++,
    url,
    title: url === NEW_TAB_URL ? 'New Tab' : url,
    favicon: null,
    loading: false,
    canGoBack: false,
    canGoForward: false,
  }
}

const useBrowserStore = create((set, get) => ({
  // ── Tabs ───────────────────────────────────────────────────────────────
  tabs: [createTab()],
  activeTabId: 1,

  addTab: (url) => {
    const tab = createTab(url)
    set(s => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }))
    return tab.id
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    if (tabs.length === 1) {
      // Replace with new tab instead of closing
      set({ tabs: [createTab()], activeTabId: tabIdCounter - 1 })
      return
    }
    const idx = tabs.findIndex(t => t.id === id)
    const newTabs = tabs.filter(t => t.id !== id)
    let newActive = activeTabId
    if (activeTabId === id) {
      newActive = newTabs[Math.max(0, idx - 1)].id
    }
    set({ tabs: newTabs, activeTabId: newActive })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, patch) => set(s => ({
    tabs: s.tabs.map(t => t.id === id ? { ...t, ...patch } : t)
  })),

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(t => t.id === activeTabId)
  },

  // ── UI state ───────────────────────────────────────────────────────────
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

  // ── Address bar ────────────────────────────────────────────────────────
  addressBarValue: '',
  setAddressBarValue: (v) => set({ addressBarValue: v }),

  // ── Page chat (AI floating button) ────────────────────────────────────
  pageChatOpen: false,
  openPageChat: () => set({ pageChatOpen: true }),
  closePageChat: () => set({ pageChatOpen: false }),

  // ── Browsing history (in-memory, also saved to DB) ────────────────────
  recentPages: [],
  addRecentPage: (page) => set(s => ({
    recentPages: [page, ...s.recentPages.filter(p => p.url !== page.url)].slice(0, 50)
  })),
}))

export default useBrowserStore
