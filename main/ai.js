/**
 * main/ai.js — Corrode Browser
 * All AI API calls. Keys never leave the main process.
 * Supports Groq (llama-3) and Google Gemini (free tier).
 * Responses are cached in memory to stay within free tier limits.
 */

const https = require('https')

const PROVIDER  = process.env.AI_PROVIDER || 'groq'
const GROQ_KEY  = process.env.GROQ_API_KEY
const GEMINI_KEY = process.env.GEMINI_API_KEY

// ── In-memory response cache (URL → result, TTL 30 min) ──────────────────
const cache = new Map()
const CACHE_TTL = 30 * 60 * 1000

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null }
  return entry.value
}
function setCache(key, value) { cache.set(key, { value, ts: Date.now() }) }

// ── HTTP helper (no axios dependency) ────────────────────────────────────

function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = https.request(
      { hostname, path, method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let raw = ''
        res.on('data', chunk => raw += chunk)
        res.on('end', () => {
          try { resolve(JSON.parse(raw)) }
          catch { reject(new Error('Invalid JSON: ' + raw.slice(0, 200))) }
        })
      }
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

// ── Provider implementations ──────────────────────────────────────────────

async function callGroq(systemPrompt, userMessage, maxTokens = 1024) {
  if (!GROQ_KEY) throw new Error('GROQ_API_KEY not set in .env')
  const res = await httpPost(
    'api.groq.com',
    '/openai/v1/chat/completions',
    { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    {
      model: 'llama3-8b-8192',  // Free, fast
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }
  )
  if (res.error) throw new Error(res.error.message)
  return res.choices[0].message.content.trim()
}

async function callGemini(systemPrompt, userMessage, maxTokens = 1024) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set in .env')
  const res = await httpPost(
    'generativelanguage.googleapis.com',
    `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    { 'Content-Type': 'application/json' },
    {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }
  )
  if (res.error) throw new Error(res.error.message)
  return res.candidates[0].content.parts[0].text.trim()
}

// Unified call — uses whichever provider is configured
async function callAI(systemPrompt, userMessage, maxTokens = 1024) {
  if (PROVIDER === 'gemini') return callGemini(systemPrompt, userMessage, maxTokens)
  return callGroq(systemPrompt, userMessage, maxTokens)
}

// ── Feature implementations ───────────────────────────────────────────────

/**
 * Summarize a visited page and extract key facts + topics.
 * Result is cached by URL to avoid redundant API calls.
 */
async function summarizePage(url, content) {
  const cached = getCached(`summary:${url}`)
  if (cached) return cached

  // Truncate content to ~6000 chars to stay within context limits
  const trimmed = content.slice(0, 6000)

  const system = `You are a knowledge extraction engine for a browser called Corrode.
Given webpage content, you extract and return ONLY valid JSON in this exact shape:
{
  "summary": "2-3 sentence summary of the page",
  "key_facts": ["fact 1", "fact 2", "fact 3"],
  "topics": ["topic1", "topic2", "topic3"],
  "mood": "informative|entertaining|alarming|neutral|persuasive"
}
Be concise. No extra text.`

  const result = await callAI(system, `URL: ${url}\n\nContent:\n${trimmed}`, 512)
  let parsed
  try {
    // Strip any accidental markdown fences
    parsed = JSON.parse(result.replace(/```json|```/g, '').trim())
  } catch {
    parsed = { summary: result, key_facts: [], topics: [], mood: 'neutral' }
  }

  setCache(`summary:${url}`, parsed)
  return parsed
}

/**
 * Chat about the current page. No caching — each question is unique.
 */
async function chatWithPage(content, question) {
  const trimmed = content.slice(0, 8000)
  const system = `You are an AI assistant embedded in Corrode browser.
The user is viewing a webpage. Answer their question about it concisely and honestly.
Page content: ${trimmed}`
  return callAI(system, question, 512)
}

/**
 * Scan a page for manipulation patterns.
 * Returns JSON array of highlighted spans with type and reason.
 */
async function detectManipulation(content) {
  const trimmed = content.slice(0, 5000)
  const system = `You are a manipulation detection engine.
Analyze the text for: emotional manipulation, factual distortion, dark UX patterns, misleading headlines.
Return ONLY valid JSON array like:
[{"text": "exact phrase from content", "type": "emotional|factual|dark_ux", "reason": "brief explanation"}]
Only flag genuine issues. Return empty array [] if clean. No extra text.`

  const result = await callAI(system, trimmed, 1024)
  try {
    return JSON.parse(result.replace(/```json|```/g, '').trim())
  } catch {
    return []
  }
}

/**
 * Generate a "Today You Learned" daily digest from browsing history.
 */
async function dailyDigest(entries) {
  if (!entries || entries.length === 0) {
    return { summary: 'No browsing data for today.', insights: [], topics: [], mood_inference: 'neutral' }
  }

  const context = entries.map(e => `- ${e.title} (${e.domain}): ${e.summary}`).join('\n')
  const system = `You are Corrode's daily digest engine. Generate a beautiful learning summary.
Return ONLY valid JSON:
{
  "headline": "catchy one-liner about today's browsing",
  "summary": "2-3 sentences summarizing what the user explored today",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "topics": ["topic1", "topic2"],
  "mood_inference": "curious|anxious|productive|distracted|focused",
  "rabbit_hole": "one fascinating follow-up topic to explore"
}`

  const result = await callAI(system, `Today's browsing:\n${context}`, 768)
  try {
    return JSON.parse(result.replace(/```json|```/g, '').trim())
  } catch {
    return { headline: 'Today\'s Digest', summary: result, insights: [], topics: [], mood_inference: 'neutral' }
  }
}

/**
 * Suggest a "rabbit hole" based on recent browsing history.
 */
async function suggestRabbitHole(history) {
  if (!history || history.length === 0) return null
  const context = history.slice(0, 10).map(p => p.title).join(', ')
  const system = `Based on these recent pages, suggest ONE fascinating rabbit hole topic to explore next.
Return ONLY a JSON object: {"topic": "...", "reason": "...", "search_query": "..."}`
  const result = await callAI(system, context, 256)
  try {
    return JSON.parse(result.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

module.exports = { summarizePage, chatWithPage, detectManipulation, dailyDigest, suggestRabbitHole }
