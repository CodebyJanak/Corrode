/**
 * Digest.jsx — Today You Learned — Corrode Browser
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, BookOpen, Lightbulb, Compass, Clock, TrendingUp } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'
import { db, ai } from '../../platform'

export default function Digest() {
  const { closeDigest } = useBrowserStore()
  const [digest, setDigest] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const browsed = await db.getDigestEntries(today).catch(() => [])
      setEntries(browsed)
      const d = await ai.dailyDigest(browsed).catch(() => null)
      setDigest(d)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const totalTime = entries.reduce((s, e) => s + (e.time_spent || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto rust-texture"
      style={{ backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-between px-8 py-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(100,35,15,0.4)', background: 'rgba(8,3,4,0.9)' }}>
        <div className="flex items-center gap-3">
          <BookOpen size={18} style={{ color: 'var(--ember)' }} />
          <div>
            <h2 className="text-sm font-semibold font-sans" style={{ color: 'var(--text-primary)' }}>Today You Learned</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{today}</p>
          </div>
        </div>
        <button onClick={closeDigest} className="p-2 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 mx-auto mb-4 animate-spin"
              style={{ borderColor: 'var(--ember)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Synthesizing your day…</p>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen size={40} style={{ color: 'rgba(80,28,15,0.5)', margin: '0 auto 16px' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No browsing data yet.</p>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto w-full px-8 py-6 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Clock size={13}/>, label: 'Time browsing', value: `${Math.round(totalTime/60)}m` },
              { icon: <TrendingUp size={13}/>, label: 'Pages visited', value: entries.length },
              { icon: null, label: 'Mood inference', value: digest?.mood_inference || 'neutral' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(18,8,9,0.8)', border: '1px solid rgba(80,28,15,0.5)' }}>
                <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-muted)' }}>
                  {icon}
                  <p className="text-xs">{label}</p>
                </div>
                <p className="text-lg font-semibold font-sans capitalize"
                  style={{ color: 'var(--ember-bright)' }}>{value}</p>
              </div>
            ))}
          </div>

          {digest?.headline && (
            <div className="rounded-xl px-5 py-4"
              style={{ background: 'rgba(18,8,9,0.8)', border: '1px solid rgba(120,42,15,0.4)' }}>
              <p className="text-base font-semibold font-sans leading-snug" style={{ color: 'var(--text-primary)' }}>
                {digest.headline}
              </p>
            </div>
          )}

          {digest?.summary && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{digest.summary}</p>
          )}

          {digest?.insights?.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-muted)' }}>Key Insights</h3>
              <div className="space-y-2">
                {digest.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg px-4 py-3"
                    style={{ background: 'rgba(15,6,7,0.8)', border: '1px solid rgba(70,24,12,0.4)' }}>
                    <Lightbulb size={12} style={{ color: 'var(--ember)', marginTop: 2, flexShrink: 0 }} />
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ins}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {digest?.rabbit_hole && (
            <div className="rounded-xl px-5 py-4 flex items-start gap-4"
              style={{ background: 'rgba(15,6,7,0.8)', border: '1px solid rgba(120,40,18,0.4)' }}>
              <Compass size={15} style={{ color: 'var(--ember)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-xs uppercase tracking-wider mb-1 font-sans" style={{ color: 'var(--ember)', fontWeight: 600 }}>Rabbit Hole</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{digest.rabbit_hole}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-muted)' }}>Pages Visited</h3>
            <div className="space-y-1.5">
              {entries.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-2"
                  style={{ background: 'rgba(15,6,7,0.7)', border: '1px solid rgba(60,22,10,0.4)' }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--ember)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{e.title || e.url}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{e.domain}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
