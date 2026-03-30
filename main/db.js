/**
 * main/db.js — Corrode Browser
 * SQLite via sql.js (pure JS/WASM — no native compilation needed).
 * Works on Android/arm64/SmartIDE with zero native build steps.
 */

const path = require('path')
const fs   = require('fs')
const { app } = require('electron')

const DB_PATH = path.join(app.getPath('userData'), 'corrode.db')

let db  = null
let SQL = null

async function getDB() {
  if (db) return db
  const initSqlJs = require('sql.js')
  SQL = await initSqlJs()
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH))
  } else {
    db = new SQL.Database()
  }
  initSchema()
  return db
}

function persist() {
  if (!db) return
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL, title TEXT, domain TEXT,
      summary TEXT, key_facts TEXT, topics TEXT,
      visited_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      time_spent INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, page_id INTEGER, content TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, page_id INTEGER,
      content TEXT NOT NULL, created_at INTEGER DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS focus_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT, domain TEXT NOT NULL UNIQUE, mode TEXT DEFAULT 'friction'
    );
  `)
  persist()
}

function qAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function run(sql, params = []) {
  db.run(sql, params)
  persist()
  return db.exec('SELECT last_insert_rowid() as id')[0]?.values?.[0]?.[0]
}

function tryParse(str, fallback) {
  try { return JSON.parse(str) } catch { return fallback }
}

async function savePage({ url, title, domain, summary, key_facts, topics, time_spent }) {
  await getDB()
  const today = new Date().toISOString().split('T')[0]
  const ex = qAll(`SELECT id FROM pages WHERE url=? AND date(visited_at,'unixepoch')=?`, [url, today])
  if (ex.length > 0) {
    run(`UPDATE pages SET title=?,summary=?,key_facts=?,topics=?,time_spent=time_spent+? WHERE id=?`,
      [title, summary, JSON.stringify(key_facts), JSON.stringify(topics), time_spent||0, ex[0].id])
    return ex[0].id
  }
  return run(`INSERT INTO pages(url,title,domain,summary,key_facts,topics,time_spent) VALUES(?,?,?,?,?,?,?)`,
    [url, title, domain, summary, JSON.stringify(key_facts), JSON.stringify(topics), time_spent||0])
}

async function searchPages(q) {
  await getDB()
  const like = `%${q.toLowerCase()}%`
  return qAll(`SELECT id,url,title,domain,summary,topics,visited_at FROM pages
    WHERE lower(title) LIKE ? OR lower(summary) LIKE ? OR lower(key_facts) LIKE ? OR lower(topics) LIKE ?
    ORDER BY visited_at DESC LIMIT 30`, [like,like,like,like])
    .map(r => ({ ...r, topics: tryParse(r.topics, []) }))
}

async function getRecentPages(limit = 20) {
  await getDB()
  return qAll(`SELECT id,url,title,domain,summary,topics,visited_at FROM pages ORDER BY visited_at DESC LIMIT ?`, [limit])
    .map(r => ({ ...r, topics: tryParse(r.topics, []) }))
}

async function getDigestEntries(date) {
  await getDB()
  const target = date || new Date().toISOString().split('T')[0]
  return qAll(`SELECT url,title,domain,summary,topics,time_spent,visited_at FROM pages
    WHERE date(visited_at,'unixepoch')=? ORDER BY visited_at ASC`, [target])
    .map(r => ({ ...r, topics: tryParse(r.topics, []) }))
}

async function saveFact({ page_id, content }) { await getDB(); return run('INSERT INTO facts(page_id,content) VALUES(?,?)', [page_id, content]) }
async function getFacts(pid) { await getDB(); return pid ? qAll('SELECT * FROM facts WHERE page_id=?', [pid]) : qAll('SELECT * FROM facts ORDER BY id DESC LIMIT 100') }
async function saveNote({ page_id, content }) { await getDB(); return run('INSERT INTO notes(page_id,content) VALUES(?,?)', [page_id, content]) }
async function getNotes(pid) {
  await getDB()
  return pid ? qAll('SELECT * FROM notes WHERE page_id=? ORDER BY created_at DESC', [pid])
             : qAll('SELECT n.*,p.url,p.title FROM notes n JOIN pages p ON n.page_id=p.id ORDER BY n.created_at DESC')
}
async function getFocusRules() { await getDB(); return qAll('SELECT * FROM focus_rules') }
async function saveFocusRule({ domain, mode='friction' }) { await getDB(); return run('INSERT OR REPLACE INTO focus_rules(domain,mode) VALUES(?,?)', [domain, mode]) }
async function deleteFocusRule(id) { await getDB(); return run('DELETE FROM focus_rules WHERE id=?', [id]) }

async function getGraphData() {
  await getDB()
  const pages = qAll('SELECT id,url,title,domain,topics FROM pages ORDER BY visited_at DESC LIMIT 200')
    .map(r => ({ ...r, topics: tryParse(r.topics, []) }))
  const nodes = pages.map(p => ({ id: p.id, url: p.url, title: p.title, domain: p.domain, topics: p.topics, weight: 1 }))
  const links = []
  for (let i = 0; i < pages.length; i++)
    for (let j = i+1; j < pages.length; j++) {
      const shared = pages[i].topics.filter(t => pages[j].topics.includes(t))
      if (shared.length > 0) links.push({ source: pages[i].id, target: pages[j].id, strength: shared.length })
    }
  return { nodes, links }
}

module.exports = {
  savePage, searchPages, getRecentPages, getDigestEntries,
  saveFact, getFacts, saveNote, getNotes,
  getFocusRules, saveFocusRule, deleteFocusRule, getGraphData,
}
