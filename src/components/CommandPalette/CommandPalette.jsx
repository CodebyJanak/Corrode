/**
 * src/components/CommandPalette/CommandPalette.jsx
 * Ctrl+K command palette — URL navigation, tab switching, feature toggles, AI questions.
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Command, Search, Globe, Layers, Brain, Shield, GitBranch, BookOpen, Focus, ArrowRight } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'

function normalizeURL(input) {
  const trimmed = input.trim()
  if (trimmed.startsWith('corrode://') || /^https?:\/\//.test(trimmed)) return trimmed
  if (/^[\w-]+\.[a-z]{2,}/.test(trimmed)) return `https://${trimmed}`
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
}

export default function CommandPalette() {
  const {
    closeCommandPalette,
    tabs, activeTabId, setActiveTab, addTab, updateTab,
    toggleSidebar, openGraph, openDigest,
    toggleManipulationDetector, toggleFocusMode,
    recentPages,
  } = useBrowserStore()

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Static commands
  const commands = [
    { id: 'sidebar', icon: <Brain size={14}/>, label: 'Toggle Second Brain Sidebar', action: () => { toggleSidebar(); closeCommandPalette() } },
    { id: 'graph',   icon: <GitBranch size={14}/>, label: 'Open Knowledge Graph', action: () => { openGraph(); closeCommandPalette() } },
    { id: 'digest',  icon: <BookOpen size={14}/>, label: 'Open Daily Digest', action: () => { openDigest(); closeCommandPalette() } },
    { id: 'manip',   icon: <Shield size={14}/>, label: 'Toggle Manipulation Detector', action: () => { toggleManipulationDetector(); closeCommandPalette() } },
    { id: 'focus',   icon: <Focus size={14}/>, label: 'Toggle Focus Mode', action: () => { toggleFocusMode(); closeCommandPalette() } },
    ...tabs.map(t => ({
      id: `tab-${t.id}`,
      icon: <Layers size={14}/>,
      label: `Switch to: ${t.title || t.url}`,
      action: () => { setActiveTab(t.id); closeCommandPalette() },
    })),
  ]

  const filteredCommands = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  const historyResults = query
    ? recentPages.filter(p =>
        p.title?.toLowerCase().includes(query.toLowerCase()) ||
        p.url?.toLowerCase().includes(query.toLowerCase()) ||
        p.summary?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : recentPages.slice(0, 5)

  // Combine into one list for keyboard navigation
  const allItems = [
    ...filteredCommands.map(c => ({ type: 'command', ...c })),
    ...historyResults.map(p => ({ type: 'history', id: p.url, icon: <Globe size={14}/>, label: p.title || p.url, sub: p.url, action: () => { addTab(p.url); closeCommandPalette() } })),
    // Always show "navigate to" option if query looks like URL/search
    ...(query ? [{ type: 'navigate', id: 'nav', icon: <ArrowRight size={14}/>, label: `Go to: ${query}`, action: () => { addTab(normalizeURL(query)); closeCommandPalette() } }] : []),
  ]

  useEffect(() => { setSelected(0) }, [query])

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); allItems[selected]?.action() }
    if (e.key === 'Escape')    closeCommandPalette()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && closeCommandPalette()}
    >
      <motion.div
        initial={{ scale: 0.95, y: -10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="w-[560px] glass rounded-xl shadow-2xl overflow-hidden border border-[var(--glass-border)]"
        style={{ boxShadow: '0 0 40px rgba(234,88,12,0.15), 0 25px 50px rgba(0,0,0,0.8)' }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--glass-border)]">
          <Command size={16} className="text-rust-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, URL, or search your history…"
            className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-void-400 text-[var(--text-muted)] font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {allItems.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center py-6">No results</p>
          )}
          {allItems.map((item, i) => (
            <div
              key={item.id}
              onClick={item.action}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                i === selected ? 'bg-rust-900/30 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-void-300'
              }`}
            >
              <span className={i === selected ? 'text-rust-500' : 'text-[var(--text-muted)]'}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs">{item.label}</span>
                {item.sub && <p className="text-[10px] text-[var(--text-muted)] truncate">{item.sub}</p>}
              </div>
              {i === selected && <ArrowRight size={12} className="text-rust-500 shrink-0" />}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[var(--glass-border)] flex gap-4">
          {[['↑↓', 'navigate'], ['↵', 'select'], ['esc', 'close']].map(([key, label]) => (
            <span key={key} className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-void-400 font-mono">{key}</kbd> {label}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
