/**
 * src/platform.js — Corrode Browser
 * Unified platform bridge.
 * On Electron: delegates to window.corrode (IPC → main process, secure).
 * On Android/Web: uses direct JS implementations.
 *
 * Import this everywhere instead of calling window.corrode directly.
 * Usage: import { db, ai } from './platform'
 */

import * as webDB from './db-web.js'

// Detect platform
export const isElectron = !!(window.corrode)
export const isAndroid  = !isElectron && /Android/i.test(navigator.userAgent)
export const isWeb      = !isElectron && !isAndroid

// ── DB ────────────────────────────────────────────────────────────────────
// On Electron: IPC calls to main process (secure, Node.js SQLite)
// On Android/Web: sql.js + IndexedDB

export const db = isElectron ? window.corrode.db : webDB

// ── AI ────────────────────────────────────────────────────────────────────
// On Electron: IPC calls to main process (API keys stay secure in main)
// On Android/Web: direct fetch calls (user must provide key in settings)

const AI_KEY_STORAGE = 'corrode_ai_key'
const AI_PROVIDER_STORAGE = 'corrode_ai_provider'

function getStoredKey()      { return localStorage.getItem(AI_KEY_STORAGE) || '' }
function getStoredProvider() { return localStorage.getItem(AI_PROVIDER_STORAGE) || 'groq' }

export function saveAIKey(key, provider) {
  localStorage.setItem(AI_KEY_STORAGE, key)
  localStorage.setItem(AI_PROVIDER_STORAGE, provider)
}

export function hasAIKey() { return !!getStoredKey() }

async function callGroqDirect(systemPrompt, userMessage, maxTokens = 512) {
  const key = getStoredKey()
  if (!key) throw new Error('No API key set. Open Settings to add your Groq key.')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ]
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content.trim()
}

async function callGeminiDirect(systemPrompt, userMessage, maxTokens = 512) {
  const key = getStoredKey()
  if (!key) throw new Error('No API key set. Open Settings to add your Gemini key.')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: maxTokens }
      })
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates[0].content.parts[0].text.trim()
}

async function callAIDirect(system, user, maxTokens = 512) {
  const provider = getStoredProvider()
  if (provider === 'gemini') return callGeminiDirect(system, user, maxTokens)
  return callGroqDirect(system, user, maxTokens)
}

function tryParseJSON(str, fallback) {
  try { return JSON.parse(str.replace(/```json|```/g, '').trim()) } catch { return fallback }
}

// Web AI implementations (same logic as main/ai.js but run in browser)
const webAI = {
  async summarizePage(url, content) {
    const system = `You are a knowledge extraction engine. Return ONLY valid JSON:
{"summary":"2-3 sentence summary","key_facts":["fact1","fact2"],"topics":["topic1","topic2"],"mood":"neutral"}`
    const result = await callAIDirect(system, `URL: ${url}\n\nContent:\n${content.slice(0, 6000)}`, 512)
    return tryParseJSON(result, { summary: result, key_facts: [], topics: [], mood: 'neutral' })
  },
  async chatWithPage(content, question) {
    const system = `You are an AI assistant. The user is viewing a webpage. Answer their question concisely.\nPage content: ${content.slice(0, 8000)}`
    return callAIDirect(system, question, 512)
  },
  async detectManipulation(content) {
    const system = `Detect manipulation in text. Return ONLY JSON array:
[{"text":"exact phrase","type":"emotional|factual|dark_ux","reason":"brief explanation"}]
Return [] if clean.`
    const result = await callAIDirect(system, content.slice(0, 5000), 1024)
    return tryParseJSON(result, [])
  },
  async dailyDigest(entries) {
    if (!entries?.length) return { headline: 'Nothing yet', summary: '', insights: [], topics: [], mood_inference: 'neutral' }
    const context = entries.map(e => `- ${e.title} (${e.domain}): ${e.summary}`).join('\n')
    const system = `Generate a daily digest. Return ONLY JSON:
{"headline":"catchy one-liner","summary":"2-3 sentences","insights":["..."],"topics":["..."],"mood_inference":"curious|productive|distracted","rabbit_hole":"follow-up topic"}`
    const result = await callAIDirect(system, `Today's browsing:\n${context}`, 768)
    return tryParseJSON(result, { headline: 'Today', summary: result, insights: [], topics: [], mood_inference: 'neutral' })
  },
  async suggestRabbitHole(history) {
    if (!history?.length) return null
    const context = history.slice(0, 10).map(p => p.title).join(', ')
    const system = `Suggest a rabbit hole topic. Return ONLY JSON: {"topic":"...","reason":"...","search_query":"..."}`
    const result = await callAIDirect(system, context, 256)
    return tryParseJSON(result, null)
  }
}

export const ai = isElectron ? window.corrode.ai : webAI

// ── Window controls ────────────────────────────────────────────────────────
// Only meaningful on Electron — no-ops on Android

export const windowControls = {
  minimize: () => window.corrode?.minimize(),
  maximize: () => window.corrode?.maximize(),
  close:    () => window.corrode?.close(),
}
