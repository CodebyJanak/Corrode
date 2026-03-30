/**
 * main/preload.js — Corrode Browser
 * Exposes a safe, typed API to the React renderer via contextBridge.
 * API keys and Node APIs never leak to renderer code.
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('corrode', {
  // ── Window controls ──────────────────────────────────────────────────────
  minimize:    () => ipcRenderer.invoke('window:minimize'),
  maximize:    () => ipcRenderer.invoke('window:maximize'),
  close:       () => ipcRenderer.invoke('window:close'),

  // ── AI calls (keys stay in main process) ─────────────────────────────────
  ai: {
    summarizePage:   (url, content) => ipcRenderer.invoke('ai:summarize-page', url, content),
    chatWithPage:    (content, question) => ipcRenderer.invoke('ai:chat-page', content, question),
    detectManipulation: (content) => ipcRenderer.invoke('ai:detect-manipulation', content),
    dailyDigest:     (entries) => ipcRenderer.invoke('ai:daily-digest', entries),
    suggestRabbitHole: (history) => ipcRenderer.invoke('ai:suggest-rabbit-hole', history),
  },

  // ── Database (SQLite, local) ──────────────────────────────────────────────
  db: {
    savePage:        (data) => ipcRenderer.invoke('db:save-page', data),
    searchPages:     (query) => ipcRenderer.invoke('db:search-pages', query),
    getRecentPages:  (limit) => ipcRenderer.invoke('db:get-recent', limit),
    getDigestEntries:(date) => ipcRenderer.invoke('db:digest-entries', date),
    saveFact:        (data) => ipcRenderer.invoke('db:save-fact', data),
    getFacts:        ()     => ipcRenderer.invoke('db:get-facts'),
    saveNote:        (data) => ipcRenderer.invoke('db:save-note', data),
    getNotes:        ()     => ipcRenderer.invoke('db:get-notes'),
    getGraphData:    ()     => ipcRenderer.invoke('db:graph-data'),
    getFocusRules:   ()     => ipcRenderer.invoke('db:focus-rules'),
    saveFocusRule:   (data) => ipcRenderer.invoke('db:save-focus-rule', data),
    deleteFocusRule: (id)   => ipcRenderer.invoke('db:delete-focus-rule', id),
  },

  // ── Events from main → renderer ───────────────────────────────────────────
  on: (channel, fn) => {
    const allowed = ['open-new-tab', 'digest-ready', 'shared-session-event']
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => fn(...args))
    }
  },
  off: (channel, fn) => ipcRenderer.removeListener(channel, fn),
})
