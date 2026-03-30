/**
 * src/App.jsx — Corrode Browser
 * Root layout: Titlebar → Toolbar → TabBar → WebviewArea + Sidebar
 */

import React, { useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import useBrowserStore from './store/useBrowserStore'

import TitleBar from './components/Browser/TitleBar'
import TabBar from './components/Browser/TabBar'
import Toolbar from './components/Browser/Toolbar'
import WebviewArea from './components/Browser/WebviewArea'
import Sidebar from './components/Sidebar/Sidebar'
import CommandPalette from './components/CommandPalette/CommandPalette'
import Digest from './components/Digest/Digest'
import Graph from './components/Graph/Graph'

export default function App() {
  const {
    commandPaletteOpen, openCommandPalette,
    digestOpen, graphOpen,
    sidebarOpen,
    addTab,
  } = useBrowserStore()

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ctrl+K — Command palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      openCommandPalette()
    }
    // Ctrl+T — New tab
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault()
      addTab()
    }
  }, [openCommandPalette, addTab])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Listen for main process events (e.g. open new tab from webview popup)
  useEffect(() => {
    if (!window.corrode) return
    window.corrode.on('open-new-tab', (url) => addTab(url))
  }, [addTab])

  return (
    <div className="flex flex-col h-screen bg-void overflow-hidden">
      {/* Frameless window title bar + traffic lights */}
      <TitleBar />

      {/* Tab bar */}
      <TabBar />

      {/* Navigation toolbar + address bar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <WebviewArea />

        {/* AI Second Brain Sidebar */}
        <AnimatePresence>
          {sidebarOpen && <Sidebar />}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette />}
      </AnimatePresence>

      <AnimatePresence>
        {digestOpen && <Digest />}
      </AnimatePresence>

      <AnimatePresence>
        {graphOpen && <Graph />}
      </AnimatePresence>
    </div>
  )
}
