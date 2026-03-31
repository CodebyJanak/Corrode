/**
 * NewTab.jsx — Corrode Browser
 * Uses the real rusted gear PNG as hero image.
 * Supports light/dark theme.
 */
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, ExternalLink, Compass, Clock } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'
import { ai } from '../../platform'

const QUOTES = [
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
  { text: "Reality is merely an illusion, albeit a very persistent one.", author: "Albert Einstein" },
  { text: "The most dangerous phrase: 'we've always done it this way.'", author: "Grace Hopper" },
  { text: "Rust never sleeps.", author: "Neil Young" },
]

export default function NewTab() {
  const { recentPages, addTab, theme, toggleTheme } = useBrowserStore()
  const [time, setTime] = useState(new Date())
  const [query, setQuery] = useState('')
  const [rabbitHole, setRabbitHole] = useState(null)
  const [gearLoaded, setGearLoaded] = useState(false)
  const inputRef = useRef(null)
  const quote = QUOTES[new Date().getDate() % QUOTES.length]
  const isDark = theme === 'dark'

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (recentPages.length > 3) {
      ai.suggestRabbitHole(recentPages).then(setRabbitHole).catch(() => {})
    }
  }, [recentPages.length])

  function navigate(url) {
    if (!url.trim()) return
    const u = /^https?:\/\//.test(url) ? url
      : /^[\w-]+\.[a-z]{2,}/.test(url) ? `https://${url}`
      : `https://www.google.com/search?q=${encodeURIComponent(url)}`
    addTab(u)
  }

  const h = time.getHours().toString().padStart(2,'0')
  const m = time.getMinutes().toString().padStart(2,'0')
  const s = time.getSeconds().toString().padStart(2,'0')

  return (
    <div className="h-full w-full flex flex-col items-center rust-texture overflow-y-auto relative">

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10 p-2 rounded-full transition-all"
        style={{
          background: 'var(--bg-300)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun size={15} style={{ color: 'var(--ember-bright)' }} /> : <Moon size={15} style={{ color: 'var(--ember)' }} />}
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 w-full px-6 py-8" style={{ minHeight: '100%' }}>

        {/* Clock */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}
          className="mb-5 text-center select-none">
          <div className="font-mono tracking-tight" style={{ fontSize: '42px', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>
            {h}<span style={{ color: 'var(--ember)', animation: 'emberPulse 1s ease-in-out infinite' }}>:</span>{m}
            <span className="font-mono" style={{ fontSize: '22px', color: 'var(--text-muted)', marginLeft: '6px' }}>{s}</span>
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            {time.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </p>
        </motion.div>

        {/* GEAR LOGO — real PNG from upload */}
        <motion.div
          initial={{ opacity:0, scale:0.75, y:20 }}
          animate={{ opacity:1, scale:1, y:0 }}
          transition={{ duration:0.7, ease:[0.16,1,0.3,1] }}
          className="mb-6 relative animate-gear-float"
          style={{ width: 180, height: 180 }}
        >
          {/* Glow behind gear */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'radial-gradient(circle, rgba(201,74,10,0.4) 0%, rgba(120,40,8,0.2) 40%, transparent 70%)',
            transform: 'scale(1.3)',
            filter: 'blur(20px)',
          }} />
          <img
            src="/gear.png"
            alt="Corrode"
            className="relative z-10 w-full h-full"
            style={{
              objectFit: 'contain',
              filter: isDark
                ? 'drop-shadow(0 0 25px rgba(201,74,10,0.7)) drop-shadow(0 0 50px rgba(180,50,8,0.35))'
                : 'drop-shadow(0 0 15px rgba(160,55,10,0.5)) drop-shadow(0 0 30px rgba(140,45,8,0.25))',
              opacity: gearLoaded ? 1 : 0,
              transition: 'opacity 0.4s',
            }}
            onLoad={() => setGearLoaded(true)}
          />
          {!gearLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor:'var(--ember)', borderTopColor:'transparent' }} />
            </div>
          )}
        </motion.div>

        {/* App name */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="mb-6 text-center">
          <h1 className="font-display tracking-[0.3em] uppercase" style={{ fontSize:'22px', color:'var(--text-primary)', letterSpacing:'0.35em' }}>
            CORRODE
          </h1>
          <p className="text-xs mt-0.5 font-sans" style={{ color:'var(--text-muted)', letterSpacing:'0.15em' }}>
            THE BROWSER FROM 2035
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
          className="w-full max-w-md mb-6">
          <div className="flex items-center gap-3 rounded-full px-5 py-3 transition-all"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(12px)',
            }}
            onFocusCapture={e => e.currentTarget.style.border = '1px solid var(--border-focus)'}
            onBlurCapture={e => e.currentTarget.style.border = '1px solid var(--border)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ color:'var(--text-muted)', flexShrink:0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && navigate(query)}
              placeholder="Search or type a URL"
              autoFocus
              className="flex-1 bg-transparent outline-none font-sans text-sm"
              style={{ color:'var(--text-primary)', caretColor:'var(--ember-bright)' }}
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity:0, scale:0.8 }}
                  animate={{ opacity:1, scale:1 }}
                  exit={{ opacity:0, scale:0.8 }}
                  onClick={() => navigate(query)}
                  className="btn-forge px-4 py-1 rounded-full text-xs"
                >
                  Search
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Quote */}
        <motion.blockquote initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45 }}
          className="text-center max-w-xs mb-7">
          <p className="text-xs italic leading-relaxed" style={{ color:'var(--text-muted)', fontWeight:300 }}>
            "{quote.text}"
          </p>
          <p className="text-xs mt-1" style={{ color:'var(--text-muted)', opacity:0.6 }}>— {quote.author}</p>
        </motion.blockquote>

        {/* Recent sites */}
        {recentPages.length > 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
            className="w-full max-w-lg mb-5">
            <p className="text-xs uppercase tracking-[0.18em] mb-3 text-center font-display"
              style={{ color:'var(--text-muted)', fontSize:'9px' }}>Recently Visited</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {recentPages.slice(0,6).map((p, i) => (
                <motion.button key={p.url}
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 + i*0.04 }}
                  onClick={() => addTab(p.url)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all group"
                  style={{ background:'var(--bg-200)', border:'1px solid var(--border)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ember)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(180,60,20,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ background:'var(--bg-300)', border:'1px solid var(--border)' }}>
                    {p.favicon
                      ? <img src={p.favicon} className="w-5 h-5" alt="" />
                      : <span className="font-display text-sm" style={{ color:'var(--ember)' }}>
                          {(p.domain||'?')[0].toUpperCase()}
                        </span>
                    }
                  </div>
                  <span className="truncate w-full text-center" style={{ color:'var(--text-muted)', fontSize:'9px' }}>
                    {p.domain || p.title}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Rabbit hole */}
        {rabbitHole && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.7 }}
            className="w-full max-w-md">
            <div className="flex items-start gap-3 rounded-2xl px-4 py-3 transition-all"
              style={{ background:'var(--bg-200)', border:'1px solid var(--border)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background:'var(--bg-300)', border:'1px solid var(--border)' }}>
                <Compass size={13} style={{ color:'var(--ember)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider mb-0.5 font-sans" style={{ color:'var(--ember)', fontWeight:700, fontSize:'9px' }}>
                  Rabbit Hole
                </p>
                <p className="text-xs" style={{ color:'var(--text-secondary)' }}>{rabbitHole.topic}</p>
                {rabbitHole.reason && <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)', fontSize:'10px' }}>{rabbitHole.reason}</p>}
              </div>
              {rabbitHole.search_query && (
                <button onClick={() => navigate(rabbitHole.search_query)} style={{ color:'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color='var(--ember-bright)'}
                  onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
