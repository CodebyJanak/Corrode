/**
 * src/App.jsx — Corrode Browser
 * Root layout. Works on Electron (desktop) and Capacitor (Android).
 */

import React, { useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import useBrowserStore from './store/useBrowserStore'
import { isElectron } from './platform'

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
    digestOpen, graphOpen, sidebarOpen,
    addTab,
  } = useBrowserStore()

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCommandPalette() }
    if ((e.ctrlKey || e.metaKey) && e.key === 't') { e.preventDefault(); addTab() }
  }, [openCommandPalette, addTab])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (isElectron) window.corrode?.on('open-new-tab', (url) => addTab(url))
  }, [addTab])

  return (
    <div className="flex flex-col h-screen bg-void overflow-hidden">
      {/* TitleBar only needed on Electron (frameless window) */}
      {isElectron && <TitleBar />}

      <TabBar />
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        <WebviewArea />
        <AnimatePresence>{sidebarOpen && <Sidebar />}</AnimatePresence>
      </div>

      <AnimatePresence>{commandPaletteOpen && <CommandPalette />}</AnimatePresence>
      <AnimatePresence>{digestOpen && <Digest />}</AnimatePresence>
      <AnimatePresence>{graphOpen && <Graph />}</AnimatePresence>
    </div>
  )
}
