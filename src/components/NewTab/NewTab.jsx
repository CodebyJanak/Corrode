/**
 * src/components/NewTab/NewTab.jsx
 * Custom new tab page — clock, weather, recent sites, AI rabbit hole suggestion.
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Compass, Cloud, CloudRain, Sun, CloudSnow } from 'lucide-react'
import useBrowserStore from '../../store/useBrowserStore'

const QUOTES = [
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
  { text: "The universe is under no obligation to make sense to you.", author: "Neil deGrasse Tyson" },
  { text: "The most dangerous phrase in any language is 'we've always done it this way.'", author: "Grace Hopper" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Reality is merely an illusion, albeit a very persistent one.", author: "Einstein" },
]

function getWeatherIcon(code) {
  if (!code) return <Sun size={16}/>
  if (code >= 200 && code < 300) return <CloudRain size={16}/>
  if (code >= 300 && code < 600) return <CloudRain size={16}/>
  if (code >= 600 && code < 700) return <CloudSnow size={16}/>
  if (code >= 800) return <Sun size={16}/>
  return <Cloud size={16}/>
}

export default function NewTab() {
  const { recentPages, addTab } = useBrowserStore()
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState(null)
  const [rabbitHole, setRabbitHole] = useState(null)
  const [query, setQuery] = useState('')
  const quote = QUOTES[new Date().getDate() % QUOTES.length]

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Weather (OpenWeatherMap free tier, geolocation)
  useEffect(() => {
    if (!process.env.WEATHER_API_KEY) return
    navigator.geolocation?.getCurrentPosition(async ({ coords }) => {
      try {
        const r = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        )
        const d = await r.json()
        setWeather({ temp: Math.round(d.main?.temp), city: d.name, code: d.weather?.[0]?.id, desc: d.weather?.[0]?.description })
      } catch { /* no weather */ }
    })
  }, [])

  // AI rabbit hole suggestion
  useEffect(() => {
    if (recentPages.length > 0) {
      window.corrode?.ai.suggestRabbitHole(recentPages).then(r => setRabbitHole(r)).catch(() => {})
    }
  }, [recentPages.length])

  const hours   = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const seconds = time.getSeconds().toString().padStart(2, '0')

  function navigate(url) {
    if (!url.trim()) return
    const u = /^https?:\/\//.test(url) || /^[\w-]+\.[a-z]{2,}/.test(url)
      ? url.startsWith('http') ? url : `https://${url}`
      : `https://www.google.com/search?q=${encodeURIComponent(url)}`
    addTab(u)
  }

  return (
    <div className="h-full w-full bg-void flex flex-col items-center justify-center overflow-y-auto py-8 px-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(234,88,12,0.06) 0%, transparent 60%), #0a0a0a' }}>

      {/* Clock */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2"
      >
        <div className="font-mono text-7xl font-light text-[var(--text-primary)] tracking-tight select-none">
          <span>{hours}</span>
          <span className="text-rust-600 animate-pulse">:</span>
          <span>{minutes}</span>
          <span className="text-3xl text-[var(--text-muted)] ml-2">{seconds}</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Weather */}
      {weather && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mb-6 text-[var(--text-muted)]"
        >
          {getWeatherIcon(weather.code)}
          <span className="text-sm">{weather.temp}° · {weather.city} · {weather.desc}</span>
        </motion.div>
      )}

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-lg mb-8"
      >
        <div className="flex items-center gap-3 bg-void-200 border border-void-400 focus-within:border-rust-600 rounded-xl px-4 py-3 transition-colors shadow-lg focus-within:shadow-[0_0_0_3px_rgba(234,88,12,0.1)]">
          <span className="text-[var(--text-muted)] text-lg">⌕</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(query)}
            placeholder="Search or enter URL…"
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            autoFocus
          />
        </div>
      </motion.div>

      {/* Quote */}
      <motion.blockquote
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-md mb-10"
      >
        <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">"{quote.text}"</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">— {quote.author}</p>
      </motion.blockquote>

      {/* Recent sites */}
      {recentPages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-2xl mb-8"
        >
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-1">Recently visited</h3>
          <div className="grid grid-cols-4 gap-3">
            {recentPages.slice(0, 8).map((p, i) => (
              <motion.button
                key={p.url}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                onClick={() => addTab(p.url)}
                className="group bg-void-200 hover:bg-void-300 border border-void-400 hover:border-rust-700/50 rounded-xl p-3 text-left transition-all"
              >
                <div className="w-6 h-6 rounded bg-void-400 mb-2 flex items-center justify-center overflow-hidden">
                  {p.favicon
                    ? <img src={p.favicon} className="w-4 h-4" alt="" />
                    : <span className="text-xs text-[var(--text-muted)]">{(p.domain || 'X')[0].toUpperCase()}</span>
                  }
                </div>
                <p className="text-xs text-[var(--text-primary)] truncate leading-tight">{p.title || p.domain}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{p.domain}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Rabbit hole */}
      {rabbitHole && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-void-200 border border-rust-800/40 rounded-xl px-5 py-4 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-rust-900/40 flex items-center justify-center shrink-0">
              <Compass size={15} className="text-rust-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-rust-400 font-semibold mb-1">Suggested Rabbit Hole</p>
              <p className="text-sm text-[var(--text-primary)] font-medium">{rabbitHole.topic}</p>
              {rabbitHole.reason && <p className="text-xs text-[var(--text-muted)] mt-1">{rabbitHole.reason}</p>}
            </div>
            {rabbitHole.search_query && (
              <button
                onClick={() => navigate(rabbitHole.search_query)}
                className="flex items-center gap-1 text-xs text-rust-500 hover:text-rust-400 transition-colors shrink-0"
              >
                <ExternalLink size={12} />
                Explore
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
