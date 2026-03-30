/**
 * src/hooks/useWebview.js
 * Utility hook for interacting with the active webview element.
 */

import { useRef, useCallback } from 'react'

export function useWebview() {
  const ref = useRef(null)

  const executeScript = useCallback(async (script) => {
    if (!ref.current) return null
    try { return await ref.current.executeJavaScript(script) }
    catch { return null }
  }, [])

  const getPageText = useCallback(async (maxChars = 8000) => {
    return executeScript(`document.body?.innerText?.slice(0, ${maxChars}) || ''`)
  }, [executeScript])

  const getPageHTML = useCallback(async () => {
    return executeScript(`document.documentElement.outerHTML`)
  }, [executeScript])

  return { ref, executeScript, getPageText, getPageHTML }
}
