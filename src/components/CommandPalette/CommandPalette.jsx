/**
 * CommandPalette.jsx — Corrode Browser
 */
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Command, Globe, Layers, Brain, Shield, GitBranch, BookOpen, Focus, ArrowRight } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'

function normalizeURL(input) {
  const t = input.trim()
  if (t.startsWith('corrode://') || /^https?:\/\//.test(t)) return t
  if (/^[\w-]+\.[a-z]{2,}/.test(t)) return `https://${t}`
  return `https://www.google.com/search?q=${encodeURIComponent(t)}`
}

export default function CommandPalette() {
  const { closeCommandPalette, tabs, setActiveTab, addTab, toggleSidebar, openGraph, openDigest, toggleManipulationDetector, toggleFocusMode, recentPages } = useBrowserStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const commands = [
    { id: 'sidebar', icon: <Brain size={13}/>, label: 'Toggle Second Brain', action: () => { toggleSidebar(); closeCommandPalette() } },
    { id: 'graph',   icon: <GitBranch size={13}/>, label: 'Open Knowledge Graph', action: () => { openGraph(); closeCommandPalette() } },
    { id: 'digest',  icon: <BookOpen size={13}/>, label: 'Open Daily Digest', action: () => { openDigest(); closeCommandPalette() } },
    { id: 'manip',   icon: <Shield size={13}/>, label: 'Toggle Manipulation Detector', action: () => { toggleManipulationDetector(); closeCommandPalette() } },
    { id: 'focus',   icon: <Focus size={13}/>, label: 'Toggle Focus Mode', action: () => { toggleFocusMode(); closeCommandPalette() } },
    ...tabs.map(t => ({ id: `tab-${t.id}`, icon: <Layers size={13}/>, label: `Switch: ${t.title || t.url}`, action: () => { setActiveTab(t.id); closeCommandPalette() } })),
  ]

  const filtered = query ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase())) : commands
  const history = query
    ? recentPages.filter(p => p.title?.toLowerCase().includes(query.toLowerCase()) || p.url?.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : recentPages.slice(0, 4)

  const all = [
    ...filtered.map(c => ({ type: 'cmd', ...c })),
    ...history.map(p => ({ type: 'hist', id: p.url, icon: <Globe size={13}/>, label: p.title || p.url, sub: p.url, action: () => { addTab(p.url); closeCommandPalette() } })),
    ...(query ? [{ type: 'nav', id: 'nav', icon: <ArrowRight size={13}/>, label: `Go to: ${query}`, action: () => { addTab(normalizeURL(query)); closeCommandPalette() } }] : []),
  ]

  useEffect(() => { setSelected(0) }, [query])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ background: 'rgba(5,2,3,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && closeCommandPalette()}
    >
      <motion.div
        initial={{ scale: 0.95, y: -8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -8 }}
        transition={{ duration: 0.15 }}
        className="w-[540px] rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(12,5,6,0.97)',
          border: '1px solid rgba(150,52,18,0.5)',
          boxShadow: '0 0 60px rgba(180,60,20,0.2), 0 25px 50px rgba(0,0,0,0.8)',
        }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid rgba(100,35,15,0.4)' }}>
          <Command size={15} style={{ color: 'var(--ember)', flexShrink: 0 }} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s+1, all.length-1)) }
              if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s-1, 0)) }
              if (e.key === 'Enter')     { e.preventDefault(); all[selected]?.action() }
              if (e.key === 'Escape')    closeCommandPalette()
            }}
            placeholder="Type a command, URL, or search history…"
            className="flex-1 bg-transparent text-sm outline-none font-sans"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--ember-bright)' }} />
          <kbd className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(40,15,10,0.8)', color: 'var(--text-muted)', border: '1px solid rgba(80,28,15,0.5)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1.5">
          {all.length === 0
            ? <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No results</p>
            : all.map((item, i) => (
              <div key={item.id} onClick={item.action}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                style={{
                  background: i === selected ? 'rgba(100,35,15,0.3)' : 'transparent',
                  borderLeft: i === selected ? '2px solid var(--ember)' : '2px solid transparent',
                }}>
                <span style={{ color: i === selected ? 'var(--ember-bright)' : 'var(--text-muted)' }}>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-sans" style={{ color: i === selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {item.label}
                  </span>
                  {item.sub && <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{item.sub}</p>}
                </div>
                {i === selected && <ArrowRight size={11} style={{ color: 'var(--ember)', flexShrink: 0 }} />}
              </div>
            ))
          }
        </div>

        <div className="flex gap-4 px-4 py-2" style={{ borderTop: '1px solid rgba(80,28,15,0.3)' }}>
          {[['↑↓','navigate'],['↵','select'],['esc','close']].map(([k,l]) => (
            <span key={k} className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
              <kbd className="px-1 py-0.5 rounded font-mono"
                style={{ background: 'rgba(30,12,8,0.8)', border: '1px solid rgba(80,28,15,0.5)', fontSize: '10px' }}>{k}</kbd>
              {l}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
