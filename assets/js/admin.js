const h = (t, c, x, a) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (a) for (const k in a) e.setAttribute(k, a[k]); return e; };
const add = (p, ...k) => { k.forEach(x => x && p.appendChild(x)); return p; };
const root = document.getElementById("root");
let token = sessionStorage.getItem("tk"), site, skills, about, tab = "messages", dirty = false, msgs = [], stats = {};

async function call(p, opt = {}) {
  const r = await fetch(p, Object.assign({}, opt, { headers: Object.assign({ Authorization: "Bearer " + token }, opt.headers) }));
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && token) { logout(); throw new Error("Session expirée, reconnectez-vous."); }
  if (!r.ok) throw new Error(d.error || "Erreur " + r.status);
  return d;
}
function toast(t) { const e = add(h("div", "toast"), document.createTextNode(t)); e.setAttribute("role", "status"); document.body.appendChild(e); setTimeout(() => e.remove(), 2800); }
function logout() { token = null; sessionStorage.removeItem("tk"); draw(); }
const prep = d => { site = d; skills = Object.entries(d.skills).map(([group, items]) => ({ group, items })); about = d.about.map(t => ({ t })); dirty = false; };
const collect = () => Object.assign({}, site, { skills: Object.fromEntries(skills.filter(s => s.group).map(s => [s.group, s.items])), about: about.map(a => a.t) });
addEventListener("beforeunload", e => { if (dirty) e.preventDefault(); });

/* ---------- Champs ---------- */
function upload(input, accept) {
  const f = h("input", null, null, { type: "file", accept }), b = h("button", "btn o", "Téléverser", { type: "button" });
  b.onclick = () => f.click();
  f.onchange = async () => {
    const file = f.files[0]; if (!file) return;
    try { const r = await call("/api/admin/upload?name=" + encodeURIComponent(file.name), { method: "POST", body: file }); input.value = r.path; input.dispatchEvent(new Event("input")); toast("Fichier envoyé : " + r.path); } catch (e) { toast(e.message); }
  };
  return b;
}
function field(obj, [key, label, type, opts]) {
  const w = h("label", "fld" + (type === "check" ? " chk" : "")), lab = h("span", null, label);
  let i;
  if (type === "area") { i = h("textarea"); i.value = obj[key] || ""; }
  else if (type === "select") { i = h("select"); opts.forEach(o => i.appendChild(h("option", null, o, { value: o }))); i.value = obj[key] || opts[0]; obj[key] = i.value; }
  else if (type === "check") { i = h("input", null, null, { type: "checkbox" }); i.checked = !!obj[key]; }
  else { i = h("input", null, null, { type: "text" }); i.value = type === "list" ? (obj[key] || []).join(", ") : obj[key] || ""; }
  i.addEventListener("input", () => {
    obj[key] = type === "check" ? i.checked : type === "list" ? i.value.split(",").map(s => s.trim()).filter(Boolean) : i.value;
    dirty = true; $bar();
  });
  if (type === "check") return add(w, i, lab);
  add(w, lab);
  if (type === "file") return add(w, add(h("div", "file"), i, upload(i, key === "cv" ? ".pdf" : "image/*")));
  return add(w, i);
}
const $bar = () => { const b = document.getElementById("dirty"); if (b) b.textContent = dirty ? "Modifications non enregistrées" : ""; };

function listEditor(arr, fields, newItem, noun) {
  const box = h("div");
  const label = it => it.title || it.group || it.t || "(sans titre)";
  const render = () => {
    box.innerHTML = "";
    arr.forEach((it, n) => {
      const sum = h("summary", null, label(it)), d = add(h("details", "item"), sum);
      d.addEventListener("input", () => { sum.textContent = label(it); });
      fields.forEach(f => d.appendChild(field(it, f)));
      const mv = (k) => { const m = n + k; if (m < 0 || m >= arr.length) return; [arr[n], arr[m]] = [arr[m], arr[n]]; dirty = true; $bar(); render(); };
      const up = h("button", null, "↑", { type: "button", "aria-label": "Monter" }), dn = h("button", null, "↓", { type: "button", "aria-label": "Descendre" }), rm = h("button", "del", "Supprimer", { type: "button" });
      up.onclick = () => mv(-1); dn.onclick = () => mv(1);
      rm.onclick = () => { if (confirm("Supprimer « " + label(it) + " » ?")) { arr.splice(n, 1); dirty = true; $bar(); render(); } };
      box.appendChild(add(d, add(h("div", "ctl"), up, dn, rm)));
    });
    const a = h("button", "btn o", "+ Ajouter " + noun, { type: "button" });
    a.onclick = () => { arr.push(newItem()); dirty = true; $bar(); render(); box.querySelectorAll("details.item")[arr.length - 1].open = true; };
    box.appendChild(a);
  };
  render(); return box;
}

/* ---------- Onglets ---------- */
const TL = [["title", "Intitulé"], ["where", "Lieu"], ["date", "Période"], ["text", "Détails", "area"]];
const TABS = {
  profile: () => add(h("div"),
    ...[["name", "Nom"], ["role", "Titre"], ["city", "Ville"], ["tagline", "Accroche (page d’accueil)", "area"], ["email", "Email"], ["github", "GitHub (URL)"], ["linkedin", "LinkedIn (URL)"], ["whatsapp", "WhatsApp (ex. 237600000000)"], ["cv", "CV (PDF)", "file"]].map(f => field(site, f)),
    h("h3", null, "À propos (paragraphes)"), listEditor(about, [["t", "Paragraphe", "area"]], () => ({ t: "" }), "un paragraphe")),
  skills: () => listEditor(skills, [["group", "Groupe"], ["items", "Compétences (séparées par des virgules)", "list"]], () => ({ group: "", items: [] }), "un groupe"),
  projects: () => listEditor(site.projects, [["title", "Titre"], ["cat", "Catégorie (Web, Jeu, Desktop…)"], ["status", "Statut", "select", ["Conception", "En cours", "Terminé"]], ["year", "Année"], ["featured", "Afficher à la une", "check"], ["desc", "Description", "area"], ["stack", "Technologies (virgules)", "list"], ["link", "Lien en ligne (URL)"], ["repo", "Code source (URL)"]], () => ({ title: "", cat: "Web", status: "En cours", year: String(new Date().getFullYear()), featured: false, desc: "", stack: [], link: "", repo: "" }), "un projet"),
  certs: () => listEditor(site.certs, [["title", "Intitulé"], ["org", "Organisme"], ["date", "Date"], ["id", "Identifiant"], ["link", "Lien de vérification (URL)"], ["img", "Image du certificat", "file"]], () => ({ title: "", org: "", date: "", id: "", link: "", img: "" }), "une certification"),
  journey: () => add(h("div"), h("h3", null, "Formation"), listEditor(site.education, TL, () => ({ title: "", where: "", date: "", text: "" }), "une formation"), h("h3", null, "Expérience"), listEditor(site.experience, TL, () => ({ title: "", where: "", date: "", text: "" }), "une expérience"))
};
function messagesTab() {
  const box = h("div"), k = (n, l) => add(h("div", "stat"), h("b", null, n), h("span", null, l));
  add(box, add(h("div", "kpis"), k(stats.total || 0, "Visites"), k(stats.week || 0, "7 derniers jours"), k(msgs.length, "Messages")));
  if (!msgs.length) add(box, h("p", "muted", "Aucun message pour le moment."));
  msgs.forEach(m => {
    const c = h("article", "msg" + (m.read ? "" : " new"));
    const rd = h("button", "mini", m.read ? "Marquer non lu" : "Marquer lu"), del = h("button", "mini del", "Supprimer");
    rd.onclick = async () => { try { await call("/api/admin/messages/" + m.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: !m.read }) }); m.read = !m.read; draw(); } catch (e) { toast(e.message); } };
    del.onclick = async () => { if (!confirm("Supprimer ce message ?")) return; try { await call("/api/admin/messages/" + m.id, { method: "DELETE" }); msgs = msgs.filter(x => x !== m); draw(); } catch (e) { toast(e.message); } };
    const rep = h("a", "mini", "Répondre", { href: "mailto:" + m.mail + "?subject=" + encodeURIComponent("Re: votre message") });
    add(box, add(c, add(h("header"), h("b", null, m.nom + " · " + m.mail), h("span", "muted", new Date(m.date).toLocaleString("fr-FR"))), h("p", null, m.msg), add(h("div", "acts"), rep, rd, del)));
  });
  return box;
}

async function save() {
  try { prep(await call("/api/admin/site", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(collect()) })); toast("Enregistré ✓ — le site est à jour."); draw(); } catch (e) { toast(e.message); }
}

function draw() {
  root.innerHTML = "";
  if (!token) {
    const f = h("form", null, null), pw = h("input", null, null, { type: "password", placeholder: "Mot de passe", autocomplete: "current-password", "aria-label": "Mot de passe", required: "" }), err = h("p", "note ko", null, { role: "alert" });
    f.onsubmit = async e => { e.preventDefault(); try { const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw.value }) }), d = await r.json(); if (!r.ok) throw new Error(d.error); token = d.token; sessionStorage.setItem("tk", token); boot(); } catch (x) { err.textContent = x.message; } };
    return add(root, add(h("div", "card login"), h("h1", null, "Administration"), add(f, pw, h("button", "btn", "Connexion", { type: "submit" }), err)));
  }
  const unread = msgs.filter(m => !m.read).length;
  const names = { messages: "Messages" + (unread ? " (" + unread + ")" : ""), profile: "Profil", skills: "Compétences", projects: "Projets", certs: "Certifications", journey: "Parcours" };
  const tabs = h("div", "tabs", null, { role: "tablist" });
  Object.entries(names).forEach(([k, n]) => { const b = h("button", k === tab ? "on" : "", n, { role: "tab", "aria-selected": k === tab }); b.onclick = () => { tab = k; draw(); }; tabs.appendChild(b); });
  const out = h("button", "btn o sm", "Déconnexion"); out.onclick = logout;
  const wrap = add(h("div", "adm"), add(h("div", "adm-top"), h("h1", null, "Administration"), add(h("div", "btns"), h("a", "btn o sm", "Voir le site", { href: "/", target: "_blank", rel: "noopener" }), out)), tabs);
  add(wrap, tab === "messages" ? messagesTab() : TABS[tab]());
  if (tab !== "messages") { const s = h("button", "btn", "Enregistrer"); s.onclick = save; add(wrap, add(h("div", "bar2"), s, h("span", "muted", dirty ? "Modifications non enregistrées" : "", { id: "dirty" }))); }
  add(root, wrap);
}
async function boot() {
  if (!token) return draw();
  try { const [s, m, st] = await Promise.all([fetch("/api/site").then(r => r.json()), call("/api/admin/messages"), call("/api/admin/stats")]); prep(s); msgs = m; stats = st; draw(); } catch (e) { if (token) { toast(e.message); } }
}
boot();
