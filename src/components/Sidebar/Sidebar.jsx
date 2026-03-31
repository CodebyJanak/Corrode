/**
 * Sidebar.jsx — Corrode Browser — AI Second Brain
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Brain, FileText, Lightbulb, Clock, ExternalLink } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'
import { db } from '../../platform'

const TABS = ['Search', 'Recent', 'Facts', 'Notes']

const panelStyle = {
  background: 'rgba(10,4,5,0.95)',
  borderLeft: '1px solid rgba(120,40,20,0.5)',
}

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
    db.getRecentPages(20).then(setRecent).catch(() => {})
    db.getFacts().then(setFacts).catch(() => {})
    db.getNotes().then(setNotes).catch(() => {})
  }, [])

  async function search(q) {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const res = await db.searchPages(q).catch(() => [])
    setResults(res); setLoading(false)
  }

  function formatTime(ts) {
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-72 flex flex-col shrink-0"
      style={panelStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(100,35,15,0.4)' }}>
        <div className="flex items-center gap-2">
          <Brain size={15} style={{ color: 'var(--ember)' }} />
          <span className="font-sans font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Second Brain
          </span>
        </div>
        <button onClick={toggleSidebar} style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <X size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(80,28,15,0.3)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(20,8,10,0.8)', border: '1px solid rgba(80,28,15,0.5)' }}>
          <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input value={query} onChange={e => search(e.target.value)} onFocus={() => setActiveTab('Search')}
            placeholder="Search by meaning…"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--ember-bright)' }} />
          {loading && <div className="w-3 h-3 rounded-full border-t animate-spin" style={{ borderColor: 'var(--ember)' }} />}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(80,28,15,0.3)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="flex-1 text-xs py-2 transition-colors font-sans"
            style={{
              color: activeTab === t ? 'var(--ember-bright)' : 'var(--text-muted)',
              borderBottom: activeTab === t ? '1px solid var(--ember)' : '1px solid transparent',
              fontWeight: activeTab === t ? 600 : 400,
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === 'Search' && (
          query ? (
            results.length > 0
              ? results.map(r => <PageCard key={r.id} page={r} onOpen={url => addTab(url)} formatTime={formatTime} />)
              : <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No results</p>
          ) : (
            <div className="text-center py-8 px-4">
              <Brain size={28} style={{ color: 'rgba(100,35,15,0.5)', margin: '0 auto 12px' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Search by meaning.<br />
                <span style={{ color: 'var(--ember)' }}>"that loneliness article"</span>
              </p>
            </div>
          )
        )}
        {activeTab === 'Recent' && recent.map(r => (
          <PageCard key={r.id} page={r} onOpen={url => addTab(url)} formatTime={formatTime} />
        ))}
        {activeTab === 'Facts' && (
          facts.length > 0
            ? facts.map(f => (
                <div key={f.id} className="rounded-lg px-3 py-2.5"
                  style={{ background: 'rgba(20,8,10,0.8)', border: '1px solid rgba(80,28,15,0.4)' }}>
                  <div className="flex items-start gap-2">
                    <Lightbulb size={11} style={{ color: 'var(--ember)', marginTop: 2, flexShrink: 0 }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.content}</p>
                  </div>
                </div>
              ))
            : <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No facts yet</p>
        )}
        {activeTab === 'Notes' && (
          notes.length > 0
            ? notes.map(n => (
                <div key={n.id} className="rounded-lg px-3 py-2.5"
                  style={{ background: 'rgba(20,8,10,0.8)', border: '1px solid rgba(80,28,15,0.4)' }}>
                  <div className="flex items-start gap-2">
                    <FileText size={11} style={{ color: 'var(--ember)', marginTop: 2, flexShrink: 0 }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{n.content}</p>
                  </div>
                </div>
              ))
            : <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No notes yet</p>
        )}
      </div>
    </motion.div>
  )
}

function PageCard({ page, onOpen, formatTime }) {
  return (
    <div className="rounded-lg px-3 py-2.5 cursor-pointer group transition-all"
      style={{ background: 'rgba(20,8,10,0.7)', border: '1px solid rgba(60,22,12,0.5)' }}
      onClick={() => onOpen(page.url)}
      onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(160,58,16,0.5)'; e.currentTarget.style.boxShadow = '0 0 8px rgba(180,60,20,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(60,22,12,0.5)'; e.currentTarget.style.boxShadow = 'none' }}>
      <div className="flex items-start gap-2 justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{page.title || page.url}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{page.domain}</p>
          {page.summary && <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{page.summary}</p>}
          {page.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {page.topics.slice(0, 3).map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(100,35,15,0.4)', color: 'var(--ember)', border: '1px solid rgba(120,40,15,0.4)', fontSize: '10px' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <ExternalLink size={10} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2, opacity: 0 }}
          className="group-hover:opacity-100 transition-opacity" />
      </div>
      {page.visited_at && (
        <div className="flex items-center gap-1 mt-2">
          <Clock size={9} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{formatTime(page.visited_at)}</span>
        </div>
      )}
    </div>
  )
}
