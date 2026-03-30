/**
 * main/ipc.js — Corrode Browser
 * All IPC handlers. Called from renderer via window.corrode.*
 * This is the security boundary — no API keys or DB access in renderer.
 */

const { BrowserWindow } = require('electron')
const db = require('./db')
const ai = require('./ai')

// Require .env to be loaded before this module
require('dotenv').config()

function setupIPC(ipcMain) {

  // ── Window controls ───────────────────────────────────────────────────────
  ipcMain.handle('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    win?.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.handle('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  // ── AI handlers ───────────────────────────────────────────────────────────
  ipcMain.handle('ai:summarize-page', async (_, url, content) => {
    try { return await ai.summarizePage(url, content) }
    catch (e) { console.error('[AI] summarize error:', e.message); return null }
  })

  ipcMain.handle('ai:chat-page', async (_, content, question) => {
    try { return await ai.chatWithPage(content, question) }
    catch (e) { console.error('[AI] chat error:', e.message); return `Error: ${e.message}` }
  })

  ipcMain.handle('ai:detect-manipulation', async (_, content) => {
    try { return await ai.detectManipulation(content) }
    catch (e) { console.error('[AI] manipulation error:', e.message); return [] }
  })

  ipcMain.handle('ai:daily-digest', async (_, entries) => {
    try { return await ai.dailyDigest(entries) }
    catch (e) { console.error('[AI] digest error:', e.message); return null }
  })

  ipcMain.handle('ai:suggest-rabbit-hole', async (_, history) => {
    try { return await ai.suggestRabbitHole(history) }
    catch (e) { console.error('[AI] rabbit hole error:', e.message); return null }
  })

  // ── DB handlers ───────────────────────────────────────────────────────────
  ipcMain.handle('db:save-page',     (_, data) => db.savePage(data))
  ipcMain.handle('db:search-pages',  (_, query) => db.searchPages(query))
  ipcMain.handle('db:get-recent',    (_, limit) => db.getRecentPages(limit))
  ipcMain.handle('db:digest-entries',(_, date) => db.getDigestEntries(date))
  ipcMain.handle('db:save-fact',     (_, data) => db.saveFact(data))
  ipcMain.handle('db:get-facts',     () => db.getFacts())
  ipcMain.handle('db:save-note',     (_, data) => db.saveNote(data))
  ipcMain.handle('db:get-notes',     () => db.getNotes())
  ipcMain.handle('db:graph-data',    () => db.getGraphData())
  ipcMain.handle('db:focus-rules',   () => db.getFocusRules())
  ipcMain.handle('db:save-focus-rule', (_, data) => db.saveFocusRule(data))
  ipcMain.handle('db:delete-focus-rule', (_, id) => db.deleteFocusRule(id))
}

module.exports = { setupIPC }
