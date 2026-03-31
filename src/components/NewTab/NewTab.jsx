/**
 * NewTab.jsx — Corrode Browser
 * Matches reference screenshots exactly:
 * - Full-screen dark oxidized texture background
 * - Large glowing gear centered in upper half
 * - Minimal frosted pill search bar below
 * - "Corrode Browser" text (optional, shown briefly)
 */
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, ExternalLink, Compass } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'
import { ai } from '../../platform'

const QUOTES = [
  "Rust never sleeps.",
  "The best way to predict the future is to invent it.",
  "Any sufficiently advanced technology is indistinguishable from magic.",
  "Reality is merely an illusion, albeit a very persistent one.",
  "The most dangerous phrase: 'we've always done it this way.'",
]

export default function NewTab() {
  const { recentPages, addTab, theme, toggleTheme } = useBrowserStore()
  const [query, setQuery]         = useState('')
  const [time, setTime]           = useState(new Date())
  const [rabbitHole, setRabbitHole] = useState(null)
  const [gearReady, setGearReady] = useState(false)
  const inputRef = useRef(null)
  const isDark = theme === 'dark'
  const quote = QUOTES[new Date().getDate() % QUOTES.length]

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (recentPages.length > 3) ai.suggestRabbitHole(recentPages).then(setRabbitHole).catch(() => {})
  }, [recentPages.length])

  function navigate(url) {
    const u = !url.trim() ? null
      : /^https?:\/\//.test(url) ? url
      : /^[\w-]+\.[a-z]{2,}/.test(url) ? `https://${url}`
      : `https://www.google.com/search?q=${encodeURIComponent(url)}`
    if (u) addTab(u)
  }

  const hh = time.getHours().toString().padStart(2,'0')
  const mm = time.getMinutes().toString().padStart(2,'0')

  return (
    <div className="h-full w-full relative overflow-hidden flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* ── Deep oxidized background layers ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base texture */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E"),
            radial-gradient(ellipse 100% 60% at 50% 0%, rgba(160,40,8,0.55) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 15% 50%, rgba(80,20,5,0.4) 0%, transparent 55%),
            radial-gradient(ellipse 50% 35% at 85% 70%, rgba(100,25,6,0.3) 0%, transparent 55%),
            radial-gradient(ellipse 80% 50% at 50% 100%, rgba(60,15,4,0.6) 0%, transparent 60%)
          `,
          backgroundColor: isDark ? '#0d0608' : '#2a1008',
        }}/>
        {/* Lava crack veins at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32" style={{
          background: 'radial-gradient(ellipse 90% 80% at 50% 100%, rgba(180,50,8,0.25) 0%, transparent 70%)',
        }}/>
        {/* Ember particles */}
        {[...Array(12)].map((_,i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: `${1 + (i%3)}px`, height: `${1 + (i%3)}px`,
            background: `rgba(${200+i*4},${60+i*3},10,0.7)`,
            left: `${8 + i*7}%`, top: `${15 + (i*17)%55}%`,
            animation: `emberPulse ${2+i*0.3}s ease-in-out ${i*0.25}s infinite`,
            filter: 'blur(0.5px)',
          }}/>
        ))}
      </div>

      {/* ── Theme + clock row ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-0 shrink-0">
        <span className="font-mono text-xs" style={{ color:'var(--text-muted)', letterSpacing:'0.1em' }}>
          {hh}<span style={{ color:'var(--ember)', animation:'emberPulse 1s ease-in-out infinite' }}>:</span>{mm}
        </span>
        <button onClick={toggleTheme} className="p-1.5 rounded-full transition-all"
          style={{ background:'rgba(40,15,8,0.6)', border:'1px solid var(--border)' }}>
          {isDark
            ? <Sun size={13} style={{ color:'var(--ember-bright)' }}/>
            : <Moon size={13} style={{ color:'var(--ember)' }}/>}
        </button>
      </div>

      {/* ── Main center content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6">

        {/* GEAR — large, centered, glowing — matches screenshots */}
        <motion.div
          initial={{ opacity:0, scale:0.6, y:-20 }}
          animate={{ opacity:1, scale:1, y:0 }}
          transition={{ duration:0.8, ease:[0.16,1,0.3,1] }}
          className="relative mb-8 flex items-center justify-center"
          style={{ width: 200, height: 200 }}
        >
          {/* Multi-layer glow behind gear */}
          <div className="absolute inset-0" style={{
            background:'radial-gradient(circle, rgba(220,80,10,0.5) 0%, rgba(160,40,8,0.25) 35%, transparent 65%)',
            transform:'scale(1.6)', filter:'blur(18px)', borderRadius:'50%',
          }}/>
          <div className="absolute inset-0" style={{
            background:'radial-gradient(circle, rgba(255,120,30,0.2) 0%, transparent 50%)',
            transform:'scale(1.2)', filter:'blur(8px)', borderRadius:'50%',
          }}/>
          <img
            src="/gear.png"
            alt="Corrode"
            className="relative z-10"
            style={{
              width:'100%', height:'100%', objectFit:'contain',
              filter: 'drop-shadow(0 0 30px rgba(201,74,10,0.8)) drop-shadow(0 0 60px rgba(160,40,8,0.4)) drop-shadow(0 8px 20px rgba(0,0,0,0.6))',
              opacity: gearReady ? 1 : 0,
              transition: 'opacity 0.5s ease',
              animation: 'gearFloat 5s ease-in-out infinite',
            }}
            onLoad={() => setGearReady(true)}
          />
          {!gearReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor:'var(--ember)', borderTopColor:'transparent' }}/>
            </div>
          )}
        </motion.div>

        {/* Search bar — exactly like reference screenshots */}
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.35, duration:0.5 }}
          className="w-full mb-8"
          style={{ maxWidth: 480 }}
        >
          <div
            className="flex items-center gap-3 rounded-full transition-all"
            style={{
              background: isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(200,100,30,0.3)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '10px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
            onFocusCapture={e => {
              e.currentTarget.style.border = '1px solid rgba(200,80,20,0.6)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.5), 0 0 0 3px rgba(180,60,15,0.15), inset 0 1px 0 rgba(255,255,255,0.06)'
            }}
            onBlurCapture={e => {
              e.currentTarget.style.border = '1px solid rgba(200,100,30,0.3)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
            }}
          >
            {/* Search icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color:'rgba(200,150,120,0.7)', flexShrink:0 }}>
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
              style={{ color: isDark ? 'rgba(240,220,200,0.9)' : 'rgba(40,15,8,0.9)', caretColor:'var(--ember-bright)',
                       letterSpacing:'0.01em' }}
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity:0, scale:0.8, x:8 }}
                  animate={{ opacity:1, scale:1, x:0 }}
                  exit={{ opacity:0, scale:0.8, x:8 }}
                  onClick={() => navigate(query)}
                  className="btn-forge rounded-full text-sm font-semibold"
                  style={{ padding:'4px 16px', fontSize:'13px' }}
                >
                  Search
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Quote */}
        <motion.p
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          className="text-center text-xs italic mb-6"
          style={{ color:'rgba(160,100,70,0.65)', maxWidth:300, fontWeight:300 }}
        >
          "{quote}"
        </motion.p>

        {/* Recent sites grid */}
        {recentPages.length > 0 && (
          <motion.div
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}
            className="w-full" style={{ maxWidth:480 }}
          >
            <p className="text-center mb-3" style={{ color:'rgba(150,90,60,0.6)', fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase' }}>
              Recent
            </p>
            <div className="grid grid-cols-5 gap-2">
              {recentPages.slice(0,5).map((p,i) => (
                <motion.button key={p.url}
                  initial={{ opacity:0, scale:0.9 }}
                  animate={{ opacity:1, scale:1 }}
                  transition={{ delay:0.6+i*0.05 }}
                  onClick={() => addTab(p.url)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all group"
                  style={{
                    background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(160,60,20,0.2)',
                    backdropFilter:'blur(8px)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(180,60,20,0.15)'; e.currentTarget.style.borderColor='rgba(200,80,20,0.4)'; e.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(160,60,20,0.2)'; e.currentTarget.style.transform='translateY(0)' }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ background:'rgba(40,15,8,0.5)', border:'1px solid rgba(120,45,15,0.4)' }}>
                    {p.favicon
                      ? <img src={p.favicon} className="w-5 h-5" alt="" onError={e=>e.target.style.display='none'}/>
                      : <span className="font-display text-sm" style={{ color:'var(--ember)' }}>{(p.domain||'?')[0].toUpperCase()}</span>
                    }
                  </div>
                  <span className="truncate w-full text-center" style={{ color:'rgba(180,120,80,0.7)', fontSize:'9px' }}>
                    {p.domain || p.title}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Rabbit hole */}
        {rabbitHole && (
          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.75 }}
            className="w-full mt-4 flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ maxWidth:480, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(140,50,15,0.25)', backdropFilter:'blur(12px)' }}>
            <Compass size={13} style={{ color:'var(--ember)', flexShrink:0 }}/>
            <div className="flex-1 min-w-0">
              <span style={{ fontSize:'9px', color:'var(--ember)', textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:700 }}>Rabbit Hole · </span>
              <span className="text-xs" style={{ color:'rgba(200,140,100,0.8)' }}>{rabbitHole.topic}</span>
            </div>
            {rabbitHole.search_query && (
              <button onClick={() => navigate(rabbitHole.search_query)} style={{ color:'var(--text-muted)' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--ember-bright)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                <ExternalLink size={12}/>
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Bottom "Corrode Browser" label ── */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:0.4 }} transition={{ delay:1 }}
        className="relative z-10 pb-5 flex items-center justify-center gap-2 shrink-0"
      >
        <img src="/gear.png" alt="" style={{ width:14, height:14, objectFit:'contain', filter:'drop-shadow(0 0 4px rgba(180,60,10,0.6))', opacity:0.6 }}/>
        <span className="font-display" style={{ color:'rgba(180,100,50,0.6)', fontSize:'11px', letterSpacing:'0.2em' }}>
          CORRODE BROWSER
        </span>
      </motion.div>
    </div>
  )
}
