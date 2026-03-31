/**
 * WebviewArea.jsx — Corrode Browser
 *
 * Proxy fallback chain for web/Android mode:
 * 1. Direct iframe (works for sites that allow embedding)
 * 2. cors-anywhere (herokuapp)
 * 3. allorigins
 * 4. corsproxy.io
 * 5. Friendly error page with direct-open link
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import useBrowserStore from '../../store/useBrowserStore'
import { isElectron, db, ai } from '../../platform'
import NewTab from '../NewTab/NewTab'
import PageChat from './PageChat'

const SPECIAL = ['corrode://newtab', 'corrode://graph', 'corrode://digest']

// Ordered list of proxy strategies to try
const PROXIES = [
  (url) => url,                                                                        // 1. direct
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,                        // 2. corsproxy.io
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,      // 3. codetabs
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,           // 4. allorigins
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,                            // 5. thingproxy
]

// ── Electron webview ───────────────────────────────────────────────────────
function ElectronWebview({ tab, updateTab, addRecentPage, manipulationDetectorOn }) {
  const wvRef = useRef(null)

  useEffect(() => {
    const wv = wvRef.current
    if (!wv || wv._wired) return
    wv._wired = true
    wv.addEventListener('did-start-loading', () => updateTab(tab.id, { loading: true }))
    wv.addEventListener('did-stop-loading', () => {
      updateTab(tab.id, { loading: false, url: wv.getURL(), title: wv.getTitle(), canGoBack: wv.canGoBack(), canGoForward: wv.canGoForward() })
    })
    wv.addEventListener('page-favicon-updated', e => { if (e.favicons?.[0]) updateTab(tab.id, { favicon: e.favicons[0] }) })
    wv.addEventListener('page-title-updated', e => updateTab(tab.id, { title: e.title }))
    wv.addEventListener('did-finish-load', async () => {
      const url = wv.getURL()
      if (!url || SPECIAL.includes(url)) return
      try {
        const content = await wv.executeJavaScript(`document.body?.innerText?.slice(0,10000)||''`)
        if (content) {
          const domain = new URL(url).hostname
          const aiRes = await ai.summarizePage(url, content)
          if (aiRes) {
            db.savePage({ url, title: wv.getTitle(), domain, summary: aiRes.summary, key_facts: aiRes.key_facts, topics: aiRes.topics })
            addRecentPage({ url, title: wv.getTitle(), domain, summary: aiRes.summary, topics: aiRes.topics })
          }
        }
      } catch {}
    })
  }, [])

  return (
    <webview ref={wvRef} src={tab.url || 'about:blank'}
      className="w-full h-full" allowpopups="true" />
  )
}

// ── Web/Android iframe with proxy fallback chain ───────────────────────────
function IframeTab({ tab, updateTab, addRecentPage }) {
  const [proxyIndex, setProxyIndex] = useState(0)
  const [allFailed, setAllFailed] = useState(false)
  const [loading, setLoading]     = useState(true)
  const iframeRef = useRef(null)
  const timerRef  = useRef(null)

  // Reset when URL changes
  useEffect(() => {
    setProxyIndex(0)
    setAllFailed(false)
    setLoading(true)
    updateTab(tab.id, { loading: true })
  }, [tab.url])

  // Timeout — if iframe hasn't fired onLoad in 8s, try next proxy
  useEffect(() => {
    if (allFailed || !loading) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => tryNextProxy(), 8000)
    return () => clearTimeout(timerRef.current)
  }, [proxyIndex, loading, allFailed])

  function tryNextProxy() {
    clearTimeout(timerRef.current)
    if (proxyIndex + 1 >= PROXIES.length) {
      setAllFailed(true)
      setLoading(false)
      updateTab(tab.id, { loading: false })
    } else {
      setProxyIndex(i => i + 1)
      setLoading(true)
    }
  }

  function handleLoad() {
    clearTimeout(timerRef.current)
    // Check if iframe actually loaded something (not just a proxy error page)
    try {
      const doc = iframeRef.current?.contentDocument
      // If we can read the title it's same-origin or proxy worked
      const title = doc?.title
      if (title && title !== 'Error' && !title.includes('500') && !title.includes('nginx')) {
        setLoading(false)
        setAllFailed(false)
        updateTab(tab.id, { loading: false, title: title || tab.url })
        try {
          const domain = new URL(tab.url).hostname
          addRecentPage({ url: tab.url, title: title || domain, domain, summary: '', topics: [] })
        } catch {}
        return
      }
    } catch {
      // Cross-origin — can't read title, but iframe loaded = probably success
      setLoading(false)
      setAllFailed(false)
      updateTab(tab.id, { loading: false })
      return
    }
    // Title looks like an error page — try next proxy
    tryNextProxy()
  }

  function handleError() {
    clearTimeout(timerRef.current)
    tryNextProxy()
  }

  if (!tab.url || SPECIAL.includes(tab.url)) return null

  const src = PROXIES[proxyIndex]?.(tab.url) || tab.url

  if (allFailed) return <CannotLoadPage url={tab.url} />

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Loading bar */}
      {loading && <div className="absolute top-0 left-0 right-0 z-10 progress-bar" />}

      {/* Proxy indicator — only show if not on direct */}
      {proxyIndex > 0 && !loading && (
        <div className="flex items-center gap-2 px-3 py-1 text-xs shrink-0"
          style={{ background:'var(--bg-200)', borderBottom:'1px solid var(--border)', color:'var(--text-muted)' }}>
          <span style={{ color:'var(--ember)' }}>⚡</span>
          Loading via proxy {proxyIndex}/{PROXIES.length - 1} — site blocked direct embedding
          <button onClick={() => window.open(tab.url, '_blank')}
            className="ml-auto underline" style={{ color:'var(--ember)' }}>
            Open directly ↗
          </button>
        </div>
      )}

      <iframe
        key={`${tab.url}-${proxyIndex}`}
        ref={iframeRef}
        src={src}
        className="w-full flex-1 border-none"
        onLoad={handleLoad}
        onError={handleError}
        title={tab.title || tab.url}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        style={{ background: '#fff' }}
      />
    </div>
  )
}

// ── Cannot load page ───────────────────────────────────────────────────────
function CannotLoadPage({ url }) {
  let domain = url
  try { domain = new URL(url).hostname } catch {}

  return (
    <div className="w-full h-full flex flex-col items-center justify-center rust-texture px-8 text-center">
      <img src="/gear.png" alt="" className="w-14 h-14 mb-4 animate-ember-pulse"
        style={{ filter:'drop-shadow(0 0 12px rgba(201,74,10,0.5))', objectFit:'contain' }} />
      <h2 className="font-display text-sm mb-2" style={{ color:'var(--ember-bright)', letterSpacing:'0.1em' }}>
        SITE BLOCKED EMBEDDING
      </h2>
      <p className="text-xs mb-1 max-w-xs leading-relaxed" style={{ color:'var(--text-muted)' }}>
        <strong style={{ color:'var(--text-secondary)' }}>{domain}</strong> refuses to load inside any iframe or proxy.
      </p>
      <p className="text-xs mb-6 max-w-xs leading-relaxed" style={{ color:'var(--text-muted)' }}>
        This is a web-mode limitation. The desktop build (Electron) loads every site perfectly.
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <a href={url} target="_blank" rel="noreferrer"
          className="btn-forge px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
          ↗ Open {domain} in device browser
        </a>
        <p className="text-xs mt-2" style={{ color:'var(--text-muted)' }}>
          Build the desktop app with GitHub Actions for full browsing — see BUILD_GUIDE.md
        </p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function WebviewArea() {
  const { tabs, activeTabId, updateTab, addRecentPage, manipulationDetectorOn } = useBrowserStore()

  useEffect(() => {
    const reload = () => {
      const tab = tabs.find(t => t.id === activeTabId)
      if (!tab || SPECIAL.includes(tab.url)) return
      // Force remount by nudging URL
      updateTab(activeTabId, { url: tab.url })
    }
    window.addEventListener('webview:back',    () => history.back())
    window.addEventListener('webview:forward', () => history.forward())
    window.addEventListener('webview:reload',  reload)
    window.addEventListener('webview:navigate', e => updateTab(activeTabId, { url: e.detail, loading: true }))
    return () => {
      window.removeEventListener('webview:back',    () => history.back())
      window.removeEventListener('webview:forward', () => history.forward())
      window.removeEventListener('webview:reload',  reload)
      window.removeEventListener('webview:navigate', e => updateTab(activeTabId, { url: e.detail }))
    }
  }, [activeTabId, tabs])

  return (
    <div className="flex-1 relative overflow-hidden" style={{ background:'var(--bg-base)' }}>
      {tabs.map(tab => {
        const isActive  = tab.id === activeTabId
        const isSpecial = SPECIAL.includes(tab.url) || !tab.url

        return (
          <div key={tab.id} className="absolute inset-0"
            style={{ display: isActive ? 'flex' : 'none', flexDirection:'column' }}>
            {isSpecial ? (
              <NewTab />
            ) : isElectron ? (
              <ElectronWebview tab={tab} updateTab={updateTab}
                addRecentPage={addRecentPage} manipulationDetectorOn={manipulationDetectorOn} />
            ) : (
              <IframeTab tab={tab} updateTab={updateTab} addRecentPage={addRecentPage} />
            )}
          </div>
        )
      })}
      <PageChat />
    </div>
  )
}
