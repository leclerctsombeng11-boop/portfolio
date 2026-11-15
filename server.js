#!/usr/bin/env node
/* Backend du portfolio — Node.js ≥ 18, AUCUNE dépendance (npm install inutile).
   Sert le site, expose l'API (/api/*) et le panneau d'administration (/admin). */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

/* ---------- Configuration (variables d'environnement ou fichier .env) ---------- */
const ROOT = __dirname;
try {
  for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}
const env = process.env;
const PORT = +env.PORT || 3000;
const DATA = path.resolve(env.DATA_DIR || path.join(ROOT, 'data'));
const UPLOADS = path.join(DATA, 'uploads');
const ADMIN_PASSWORD = env.ADMIN_PASSWORD || '';
const SECRET = env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const CORS = env.CORS_ORIGIN || '';          // ex. https://pseudo.github.io si le front est hébergé ailleurs
const TRUST_PROXY = env.TRUST_PROXY === '1'; // à activer derrière Nginx/Render/Railway… (lit X-Forwarded-For)
const WEBHOOK = env.NOTIFY_WEBHOOK || '';    // URL Slack/Discord/Make… prévenue à chaque nouveau message

/* ---------- Validation / nettoyage des données ---------- */
const str = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = (v, fn, max = 50) => (Array.isArray(v) ? v.slice(0, max).map(fn) : []);
const url = v => { v = str(v, 300); return /^https?:\/\/[^\s]+$/i.test(v) ? v : ''; };
const asset = v => { v = str(v, 300); return /^https?:\/\/[^\s]+$/i.test(v) || (/^(assets|uploads)\/[\w./-]+$/.test(v) && !v.includes('..')) ? v : ''; };
const list = (v, n = 40) => arr(v, s => str(s, n), 20).filter(Boolean);

function cleanSite(x) {
  if (!x || typeof x !== 'object') throw Object.assign(new Error('Données invalides.'), { status: 400 });
  const skills = {};
  if (x.skills && typeof x.skills === 'object')
    for (const [g, a] of Object.entries(x.skills).slice(0, 12)) if (str(g, 60)) skills[str(g, 60)] = list(a);
  const timeline = a => arr(a, e => ({ title: str(e.title, 150), where: str(e.where, 150), date: str(e.date, 60), text: str(e.text, 500) })).filter(e => e.title);
  return {
    name: str(x.name, 80), role: str(x.role, 150), city: str(x.city, 100), tagline: str(x.tagline, 700),
    about: arr(x.about, s => str(s, 1500), 10).filter(Boolean),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(x.email, 150)) ? str(x.email, 150) : '',
    github: url(x.github), linkedin: url(x.linkedin), whatsapp: str(x.whatsapp, 20).replace(/\D/g, ''), cv: asset(x.cv),
    skills,
    projects: arr(x.projects, p => ({
      title: str(p.title, 120), cat: str(p.cat, 40) || 'Autre', status: str(p.status, 30), year: str(p.year, 10), featured: !!p.featured,
      desc: str(p.desc, 700), stack: list(p.stack), link: url(p.link), repo: url(p.repo)
    }), 100).filter(p => p.title),
    certs: arr(x.certs, c => ({ title: str(c.title, 150), org: str(c.org, 150), date: str(c.date, 40), id: str(c.id, 100), link: url(c.link), img: asset(c.img) }), 100).filter(c => c.title),
    education: timeline(x.education), experience: timeline(x.experience)
  };
}

/* ---------- Stockage JSON (écriture atomique, sérialisée) ---------- */
const cache = {};
let queue = Promise.resolve();
async function load(name, fallback) {
  if (!(name in cache)) {
    try { cache[name] = JSON.parse(await fsp.readFile(path.join(DATA, name + '.json'), 'utf8')); }
    catch { cache[name] = fallback; }
  }
  return cache[name];
}
function save(name) {
  queue = queue.then(async () => {
    const f = path.join(DATA, name + '.json');
    await fsp.writeFile(f + '.tmp', JSON.stringify(cache[name], null, 2));
    await fsp.rename(f + '.tmp', f);
  }).catch(e => console.error('Écriture impossible :', name, e.message));
  return queue;
}
async function init() {
  await fsp.mkdir(UPLOADS, { recursive: true });
  if (!(await load('site', null))) { // 1er lancement : on reprend le contenu de assets/js/data.js
    const src = await fsp.readFile(path.join(ROOT, 'assets/js/data.js'), 'utf8');
    cache.site = cleanSite(vm.runInNewContext(src + '\n;SITE', {}));
    await save('site');
    console.log('Contenu initial importé depuis assets/js/data.js');
  }
  await load('messages', []); await load('stats', { total: 0, pages: {}, days: {} });
}

/* ---------- Utilitaires HTTP ---------- */
const SEC = {
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
};
function send(res, code, data, headers = {}) { res.writeHead(code, { ...SEC, ...headers }); res.end(data); }
const json = (res, code, obj) => send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
const fail = (status, message) => Object.assign(new Error(message), { status });
async function readBody(req, limit) {
  const parts = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) throw fail(413, 'Fichier ou message trop volumineux.'); parts.push(c); }
  return Buffer.concat(parts);
}
async function readJson(req, limit = 1e6) {
  try { return JSON.parse((await readBody(req, limit)).toString('utf8') || '{}'); }
  catch (e) { throw e.status ? e : fail(400, 'JSON invalide.'); }
}
const clientIp = req => (TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '?';

const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < windowMs);
  const over = a.length >= max; if (!over) a.push(now); hits.set(key, a); return over;
}
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.length || now - a[a.length - 1] > 36e5) hits.delete(k); }, 6e5).unref();

/* ---------- Authentification admin (jeton signé, 12 h) ---------- */
const sign = p => crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
const digest = s => crypto.createHash('sha256').update(s).digest();
const makeToken = () => { const p = String(Date.now() + 12 * 36e5); return p + '.' + sign(p); };
function validToken(t) {
  const [p, s] = String(t).split('.'); if (!p || !s) return false;
  const a = Buffer.from(sign(p)), b = Buffer.from(s);
  return a.length === b.length && crypto.timingSafeEqual(a, b) && +p > Date.now();
}
const requireAdmin = req => { if (!validToken((req.headers.authorization || '').replace(/^Bearer /, ''))) throw fail(401, 'Non autorisé.'); };

/* ---------- Routes API ---------- */
const PAGES = ['home', 'projects', 'certs', 'cv', 'contact'];
const MAGIC = { '.pdf': b => b.subarray(0, 4).toString() === '%PDF', '.png': b => b[0] === 0x89 && b.subarray(1, 4).toString() === 'PNG', '.jpg': b => b[0] === 0xff && b[1] === 0xd8, '.jpeg': b => b[0] === 0xff && b[1] === 0xd8, '.gif': b => b.subarray(0, 3).toString() === 'GIF', '.webp': b => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' };

async function api(req, res, pathname, query) {
  const m = req.method;
  if (pathname === '/api/health') return json(res, 200, { ok: true });
  if (pathname === '/api/site' && m === 'GET') return json(res, 200, cache.site);

  if (pathname === '/api/visit' && m === 'POST') { // compteur anonyme : aucune IP ni donnée personnelle conservée
    const { page } = await readJson(req, 1e3);
    if (PAGES.includes(page)) {
      const s = cache.stats, d = new Date().toISOString().slice(0, 10);
      s.total++; s.pages[page] = (s.pages[page] || 0) + 1; s.days[d] = (s.days[d] || 0) + 1;
      for (const k of Object.keys(s.days).sort().slice(0, -90)) delete s.days[k];
      save('stats');
    }
    return json(res, 200, { ok: true });
  }

  if (pathname === '/api/contact' && m === 'POST') {
    const b = await readJson(req, 2e4);
    if (b.website) return json(res, 200, { ok: true }); // champ piège : on répond OK sans rien enregistrer
    if (limited('contact:' + clientIp(req), 5, 36e5)) throw fail(429, 'Trop de messages envoyés. Réessayez plus tard.');
    const nom = str(b.nom, 100), mail = str(b.mail, 200), msg = str(b.msg, 3000);
    if (!nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) || msg.length < 5) throw fail(400, 'Vérifiez votre nom, votre email et votre message.');
    const all = cache.messages;
    all.unshift({ id: crypto.randomUUID(), nom, mail, msg, date: new Date().toISOString(), read: false });
    all.length = Math.min(all.length, 2000);
    await save('messages');
    if (WEBHOOK) {
      const text = `Nouveau message de ${nom} <${mail}> :\n${msg}`.slice(0, 1900);
      fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, content: text }) }).catch(() => {});
    }
    return json(res, 201, { ok: true });
  }

  if (pathname === '/api/admin/login' && m === 'POST') {
    if (!ADMIN_PASSWORD) throw fail(503, "Définissez ADMIN_PASSWORD dans .env pour activer l'administration.");
    if (limited('login:' + clientIp(req), 8, 15 * 6e4)) throw fail(429, 'Trop de tentatives. Réessayez dans 15 minutes.');
    const { password } = await readJson(req, 1e3);
    if (typeof password !== 'string' || !crypto.timingSafeEqual(digest(password), digest(ADMIN_PASSWORD))) throw fail(401, 'Mot de passe incorrect.');
    return json(res, 200, { token: makeToken() });
  }

  if (!pathname.startsWith('/api/admin/')) throw fail(404, 'Introuvable.');
  requireAdmin(req);

  if (pathname === '/api/admin/site' && m === 'PUT') {
    cache.site = cleanSite(await readJson(req)); await save('site'); return json(res, 200, cache.site);
  }
  if (pathname === '/api/admin/messages' && m === 'GET') return json(res, 200, cache.messages);
  const mm = pathname.match(/^\/api\/admin\/messages\/([\w-]+)$/);
  if (mm) {
    const i = cache.messages.findIndex(x => x.id === mm[1]); if (i < 0) throw fail(404, 'Message introuvable.');
    if (m === 'PATCH') { cache.messages[i].read = !!(await readJson(req, 1e3)).read; await save('messages'); return json(res, 200, cache.messages[i]); }
    if (m === 'DELETE') { cache.messages.splice(i, 1); await save('messages'); return json(res, 200, { ok: true }); }
  }
  if (pathname === '/api/admin/stats' && m === 'GET') {
    const s = cache.stats, week = Object.entries(s.days).sort().slice(-7).reduce((n, [, v]) => n + v, 0);
    return json(res, 200, { total: s.total, week, pages: s.pages });
  }
  if (pathname === '/api/admin/upload' && m === 'POST') { // corps brut du fichier, nom dans ?name=
    const ext = path.extname(str(query.get('name'), 100)).toLowerCase();
    if (!MAGIC[ext]) throw fail(400, 'Formats acceptés : PDF, PNG, JPG, WEBP, GIF.');
    const buf = await readBody(req, 8e6);
    if (!MAGIC[ext](buf)) throw fail(400, 'Le contenu ne correspond pas au format du fichier.');
    const base = path.basename(query.get('name'), path.extname(query.get('name'))).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'fichier';
    await fsp.writeFile(path.join(UPLOADS, base + ext), buf);
    return json(res, 201, { path: 'uploads/' + base + ext });
  }
  throw fail(404, 'Introuvable.');
}

/* ---------- Fichiers statiques ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon' };
async function fileInfo(p) {
  let base = ROOT, rel;
  if (p.startsWith('/uploads/')) { base = UPLOADS; rel = p.slice(9); }
  else {
    rel = p.slice(1) || 'index.html';
    if (!path.extname(rel)) rel += '.html';                       // /projets → projets.html
    if (!(rel.split('/')[0] === 'assets' || /^[\w-]+\.(html|txt|xml|ico)$/.test(rel))) return null; // jamais server.js, data/, .env, .git…
  }
  if (rel.split('/').some(s => s.startsWith('.'))) return null;
  const full = path.resolve(base, rel);
  if (!full.startsWith(base + path.sep)) return null;
  try { return (await fsp.stat(full)).isFile() ? full : null; } catch { return null; }
}
async function serve(req, res, pathname) {
  let p; try { p = decodeURIComponent(pathname); } catch { p = '/'; }
  let full = await fileInfo(p), code = 200;
  if (!full) { full = path.join(ROOT, '404.html'); code = 404; }
  const ext = path.extname(full);
  res.writeHead(code, { ...SEC, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600', ...(p.startsWith('/admin') ? { 'X-Robots-Tag': 'noindex' } : {}) });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(full).pipe(res);
}

/* ---------- Serveur ---------- */
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    if (u.pathname.startsWith('/api/')) {
      if (CORS) { res.setHeader('Access-Control-Allow-Origin', CORS); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE'); }
      if (req.method === 'OPTIONS') return send(res, 204, '');
      return await api(req, res, u.pathname, u.searchParams);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Méthode non autorisée');
    await serve(req, res, u.pathname);
  } catch (e) {
    if (!e.status) console.error(e);
    if (!res.headersSent) json(res, e.status || 500, { error: e.status ? e.message : 'Erreur serveur.' }); else res.end();
  }
});

init().then(() => server.listen(PORT, () => {
  console.log(`Portfolio : http://localhost:${PORT}   |   Admin : http://localhost:${PORT}/admin`);
  if (!ADMIN_PASSWORD) console.warn("⚠ ADMIN_PASSWORD n'est pas défini : l'administration est désactivée (copiez .env.example en .env).");
  else if (ADMIN_PASSWORD.length < 10) console.warn('⚠ Mot de passe admin court : utilisez au moins 10 caractères.');
}));
