/**
 * src/components/Browser/Toolbar.jsx
 * Navigation controls, address bar, and feature toggle buttons.
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, RotateCw, Home,
  Brain, Command, GitBranch, BookOpen,
  Shield, Focus, Share2, Clock, Zap
} from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'

function normalizeURL(input) {
  const trimmed = input.trim()
  if (trimmed.startsWith('corrode://')) return trimmed
  if (/^https?:\/\//.test(trimmed)) return trimmed
  if (/^[\w-]+\.[a-z]{2,}/.test(trimmed)) return `https://${trimmed}`
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
}

export default function Toolbar() {
  const {
    tabs, activeTabId, updateTab, getActiveTab,
    addressBarValue, setAddressBarValue,
    toggleSidebar, sidebarOpen,
    openCommandPalette,
    openGraph,
    openDigest,
    manipulationDetectorOn, toggleManipulationDetector,
    focusModeOn, toggleFocusMode,
  } = useBrowserStore()

  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef(null)

  const activeTab = getActiveTab()

  // Sync address bar with active tab URL
  useEffect(() => {
    if (!editing) setInputVal(activeTab?.url || '')
  }, [activeTab?.url, editing])

  function navigate(url) {
    const finalURL = normalizeURL(url)
    updateTab(activeTabId, { url: finalURL, loading: true })
    setInputVal(finalURL)
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') navigate(inputVal)
    if (e.key === 'Escape') { setEditing(false); setInputVal(activeTab?.url || '') }
  }

  function handleFocus() {
    setEditing(true)
    setInputVal(activeTab?.url || '')
    setTimeout(() => inputRef.current?.select(), 10)
  }

  // Webview navigation — dispatched via custom event that WebviewArea listens to
  function goBack()    { window.dispatchEvent(new CustomEvent('webview:back')) }
  function goForward() { window.dispatchEvent(new CustomEvent('webview:forward')) }
  function reload()    { window.dispatchEvent(new CustomEvent('webview:reload')) }
  function goHome()    { navigate('corrode://newtab') }

  const iconBtn = 'p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-void-300 transition-colors'
  const activeIconBtn = 'p-1.5 rounded text-[var(--rust)] bg-void-300 transition-colors'

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-void-100 border-b border-void-300 shrink-0">
      {/* Nav buttons */}
      <button onClick={goBack}    className={iconBtn} disabled={!activeTab?.canGoBack}    title="Back">    <ChevronLeft  size={16} /></button>
      <button onClick={goForward} className={iconBtn} disabled={!activeTab?.canGoForward} title="Forward"> <ChevronRight size={16} /></button>
      <button onClick={reload}    className={iconBtn} title="Reload"> <RotateCw size={14} /></button>
      <button onClick={goHome}    className={iconBtn} title="Home">   <Home     size={14} /></button>

      {/* Address bar */}
      <div className="flex-1 flex items-center bg-void-200 border border-void-400 rounded-md px-3 h-7 focus-within:border-rust-600 focus-within:shadow-[0_0_0_2px_rgba(234,88,12,0.15)] transition-all">
        {!editing && activeTab?.url && !activeTab.url.startsWith('corrode://') && (
          <span className="text-xs text-[var(--rust)] mr-1.5 shrink-0">🔒</span>
        )}
        <input
          ref={inputRef}
          value={editing ? inputVal : (activeTab?.url || '')}
          onChange={e => setInputVal(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setEditing(false)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none font-mono placeholder:text-[var(--text-muted)]"
          placeholder="Search or enter URL… (Ctrl+K for commands)"
          spellCheck={false}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-void-400 mx-1" />

      {/* Feature buttons */}
      <button onClick={openCommandPalette}      className={iconBtn}                               title="Command Palette (Ctrl+K)"><Command  size={14} /></button>
      <button onClick={toggleSidebar}           className={sidebarOpen ? activeIconBtn : iconBtn} title="AI Second Brain">       <Brain    size={14} /></button>
      <button onClick={openGraph}               className={iconBtn}                               title="Knowledge Graph">        <GitBranch size={14} /></button>
      <button onClick={openDigest}              className={iconBtn}                               title="Daily Digest">           <BookOpen size={14} /></button>
      <button onClick={toggleManipulationDetector} className={manipulationDetectorOn ? activeIconBtn : iconBtn} title="Manipulation Detector"><Shield size={14} /></button>
      <button onClick={toggleFocusMode}         className={focusModeOn ? activeIconBtn : iconBtn} title="Focus Mode">             <Focus    size={14} /></button>
      <button className={iconBtn} title="Time Warp" onClick={() => {
        const url = activeTab?.url
        if (url && !url.startsWith('corrode://')) {
          const wbUrl = `https://web.archive.org/web/2010/${url}`
          window.dispatchEvent(new CustomEvent('webview:navigate', { detail: wbUrl }))
        }
      }}><Clock size={14} /></button>
    </div>
  )
}
