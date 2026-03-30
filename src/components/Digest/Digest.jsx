/**
 * src/components/Digest/Digest.jsx
 * "Today You Learned" — AI-generated daily digest of browsing activity.
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, BookOpen, Lightbulb, Tag, Compass, Clock, TrendingUp } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'

const MOOD_COLORS = {
  curious:     { bg: 'bg-blue-900/30',   text: 'text-blue-400',   border: 'border-blue-700/40' },
  anxious:     { bg: 'bg-red-900/30',    text: 'text-red-400',    border: 'border-red-700/40' },
  productive:  { bg: 'bg-green-900/30',  text: 'text-green-400',  border: 'border-green-700/40' },
  distracted:  { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-700/40' },
  focused:     { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-700/40' },
  neutral:     { bg: 'bg-void-300',      text: 'text-[var(--text-muted)]', border: 'border-void-400' },
}

export default function Digest() {
  const { closeDigest } = useBrowserStore()
  const [digest, setDigest] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDigest() }, [])

  async function loadDigest() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // Get today's browsing entries
    const browsedToday = await window.corrode?.db.getDigestEntries(today) || []
    setEntries(browsedToday)

    // Generate AI digest
    const ai = await window.corrode?.ai.dailyDigest(browsedToday) || null
    setDigest(ai)
    setLoading(false)
  }

  const mood = digest?.mood_inference || 'neutral'
  const moodStyle = MOOD_COLORS[mood] || MOOD_COLORS.neutral

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const totalTime = entries.reduce((s, e) => s + (e.time_spent || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-void/95 backdrop-blur-sm flex flex-col overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-void-300 shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-rust-500" />
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Today You Learned</h2>
            <p className="text-xs text-[var(--text-muted)]">{today}</p>
          </div>
        </div>
        <button onClick={closeDigest} className="p-2 rounded hover:bg-void-300 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 border-rust-600 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm text-[var(--text-muted)]">Synthesizing your day…</p>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen size={48} className="text-void-400 mx-auto mb-4" />
            <p className="text-sm text-[var(--text-muted)]">No browsing data for today yet.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Start browsing and come back!</p>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto w-full px-8 py-6 space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={<Clock size={14}/>} label="Time browsing" value={`${Math.round(totalTime / 60)}m`} />
            <StatCard icon={<TrendingUp size={14}/>} label="Pages visited" value={entries.length} />
            <div className={`rounded-xl p-4 border ${moodStyle.bg} ${moodStyle.border}`}>
              <p className="text-xs text-[var(--text-muted)] mb-1">Mood inference</p>
              <p className={`text-lg font-semibold capitalize ${moodStyle.text}`}>{mood}</p>
            </div>
          </div>

          {/* Headline */}
          {digest?.headline && (
            <div className="rounded-xl bg-void-200 border border-rust-800/30 px-5 py-4">
              <p className="text-lg font-semibold text-[var(--text-primary)] leading-snug">{digest.headline}</p>
            </div>
          )}

          {/* Summary */}
          {digest?.summary && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Summary</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{digest.summary}</p>
            </div>
          )}

          {/* Insights */}
          {digest?.insights?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Key Insights</h3>
              <div className="space-y-2">
                {digest.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-3 bg-void-200 rounded-lg px-4 py-3">
                    <Lightbulb size={13} className="text-rust-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{ins}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {digest?.topics?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Topics Explored</h3>
              <div className="flex flex-wrap gap-2">
                {digest.topics.map(t => (
                  <span key={t} className="text-xs px-3 py-1 rounded-full bg-rust-900/30 text-rust-400 border border-rust-800/40">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Rabbit hole */}
          {digest?.rabbit_hole && (
            <div className="rounded-xl bg-void-200 border border-rust-700/30 px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Compass size={14} className="text-rust-500" />
                <h3 className="text-xs font-semibold text-rust-400 uppercase tracking-wider">Down the Rabbit Hole</h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{digest.rabbit_hole}</p>
            </div>
          )}

          {/* Pages list */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Pages Visited</h3>
            <div className="space-y-2">
              {entries.map((e, i) => (
                <div key={i} className="flex items-center gap-3 bg-void-200 rounded-lg px-4 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rust-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-primary)] truncate">{e.title || e.url}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{e.domain}</p>
                  </div>
                  {e.time_spent > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)] shrink-0">{e.time_spent}s</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-void-200 border border-void-400 px-4 py-4">
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
