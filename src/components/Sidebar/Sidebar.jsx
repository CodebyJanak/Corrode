/**
 * src/components/Sidebar/Sidebar.jsx
 * AI Second Brain — semantic search over browsing history, facts, notes.
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Brain, FileText, Lightbulb, Clock, ExternalLink } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'

const TABS = ['Search', 'Recent', 'Facts', 'Notes']

export default function Sidebar() {
  const { toggleSidebar, addTab } = useBrowserStore()
  const [activeTab, setActiveTab] = useState('Search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [recent, setRecent] = useState([])
  const [facts, setFacts] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRecent()
    loadFacts()
    loadNotes()
  }, [])

  async function loadRecent() {
    const pages = await window.corrode?.db.getRecentPages(20) || []
    setRecent(pages)
  }

  async function loadFacts() {
    const f = await window.corrode?.db.getFacts() || []
    setFacts(f)
  }

  async function loadNotes() {
    const n = await window.corrode?.db.getNotes() || []
    setNotes(n)
  }

  async function search(q) {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const res = await window.corrode?.db.searchPages(q) || []
    setResults(res)
    setLoading(false)
  }

  function openPage(url) {
    addTab(url)
  }

  function formatTime(ts) {
    const d = new Date(ts * 1000)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-80 flex flex-col glass border-l border-[var(--glass-border)] shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <Brain size={15} className="text-rust-500" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Second Brain</span>
        </div>
        <button onClick={toggleSidebar} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2 bg-void-300 rounded-lg px-3 py-2">
          <Search size={13} className="text-[var(--text-muted)] shrink-0" />
          <input
            value={query}
            onChange={e => search(e.target.value)}
            onFocus={() => setActiveTab('Search')}
            placeholder="Search by meaning, not URL…"
            className="flex-1 bg-transparent text-xs outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {loading && <div className="w-3 h-3 rounded-full border-t border-rust-500 animate-spin" />}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--glass-border)]">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 text-xs py-2 transition-colors ${
              activeTab === t
                ? 'text-rust-500 border-b border-rust-600'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        {activeTab === 'Search' && (
          query ? (
            results.length > 0 ? results.map(r => (
              <PageCard key={r.id} page={r} onOpen={openPage} formatTime={formatTime} />
            )) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">No results found</p>
            )
          ) : (
            <p className="text-xs text-[var(--text-muted)] text-center py-8 leading-relaxed">
              Search your entire browsing history by meaning.<br />
              <span className="text-rust-600">"that loneliness article from last week"</span>
            </p>
          )
        )}

        {activeTab === 'Recent' && recent.map(r => (
          <PageCard key={r.id} page={r} onOpen={openPage} formatTime={formatTime} />
        ))}

        {activeTab === 'Facts' && (
          facts.length > 0 ? facts.map(f => (
            <div key={f.id} className="bg-void-300 rounded-lg px-3 py-2">
              <div className="flex items-start gap-2">
                <Lightbulb size={11} className="text-rust-500 mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.content}</p>
              </div>
            </div>
          )) : (
            <p className="text-xs text-[var(--text-muted)] text-center py-8">Facts extracted from visited pages will appear here.</p>
          )
        )}

        {activeTab === 'Notes' && (
          notes.length > 0 ? notes.map(n => (
            <div key={n.id} className="bg-void-300 rounded-lg px-3 py-2">
              <div className="flex items-start gap-2">
                <FileText size={11} className="text-rust-500 mt-0.5 shrink-0" />
                <div>
                  {n.title && <p className="text-xs text-[var(--text-muted)] mb-1">{n.title}</p>}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{n.content}</p>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-xs text-[var(--text-muted)] text-center py-8">No notes yet.</p>
          )
        )}
      </div>
    </motion.div>
  )
}

function PageCard({ page, onOpen, formatTime }) {
  return (
    <div className="bg-void-300 hover:bg-void-400 rounded-lg px-3 py-2.5 cursor-pointer group transition-colors"
      onClick={() => onOpen(page.url)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{page.title || page.url}</p>
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{page.domain}</p>
          {page.summary && (
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-2">{page.summary}</p>
          )}
          {page.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {page.topics.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-rust-900/40 text-rust-400 border border-rust-800/50">{t}</span>
              ))}
            </div>
          )}
        </div>
        <ExternalLink size={11} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 transition-opacity" />
      </div>
      {page.visited_at && (
        <div className="flex items-center gap-1 mt-2">
          <Clock size={10} className="text-[var(--text-muted)]" />
          <span className="text-[10px] text-[var(--text-muted)]">{formatTime(page.visited_at)}</span>
        </div>
      )}
    </div>
  )
}
