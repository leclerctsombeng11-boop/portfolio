const $ = (s, r = document) => r.querySelector(s);
const h = (t, c, x, a) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (a) for (const k in a) e.setAttribute(k, a[k]); return e; };
const add = (p, ...k) => { k.forEach(x => x && p.appendChild(x)); return p; };
const link = (href, text, cls, ext) => h("a", cls, text, Object.assign({ href }, ext ? { target: "_blank", rel: "noopener" } : {}));
const tags = a => add(h("div", "tags"), ...a.map(t => h("span", "tag", t)));
const sec = (title, sub, ...k) => { const s = h("section", "wrap sec"); add(s, h("h2", null, title)); if (sub) add(s, h("p", "sub", sub)); return add(s, ...k); };
const NAV = [["index.html", "Accueil", "home"], ["projets.html", "Projets", "projects"], ["certifications.html", "Certifications", "certs"], ["cv.html", "CV", "cv"], ["contact.html", "Contact", "contact"]];
const API = (typeof API_BASE === "string" ? API_BASE : "").replace(/\/$/, "");
let S = SITE;            // contenu de secours (data.js) ; remplacé par celui du backend s'il répond
let online = false;

/* ---------- Backend ---------- */
async function api(p, opt = {}, ms = 8000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(API + p, Object.assign({}, opt, { signal: c.signal }));
    const d = await r.json().catch(() => null);
    if (!r.ok) throw new Error((d && d.error) || "Erreur " + r.status);
    return d;
  } finally { clearTimeout(t); }
}
async function loadSite() {
  try { const d = await api("/api/site", {}, 2500); if (d && d.name) { S = d; online = true; } } catch (e) { /* site statique ou backend injoignable : data.js */ }
  S.certs = (S.certs || []).filter(c => !/^nom de votre/i.test(c.title)); // masque les exemples non remplis
}

/* ---------- Thème ---------- */
function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem("theme", t); } catch (e) {} const b = $("#theme"); if (b) b.textContent = t === "dark" ? "☀" : "☾"; }
(function () { let t; try { t = localStorage.getItem("theme"); } catch (e) {} setTheme(t || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")); })();

/* ---------- Composants ---------- */
function header(page) {
  const nav = h("nav", "links", null, { id: "menu", "aria-label": "Navigation principale" });
  NAV.forEach(([u, n, p]) => { const a = link(u, n); if (p === page) { a.className = "on"; a.setAttribute("aria-current", "page"); } nav.appendChild(a); });
  const burger = h("button", "ico burger", "☰", { "aria-label": "Menu", "aria-expanded": "false", "aria-controls": "menu" });
  burger.onclick = () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); };
  nav.onclick = e => { if (e.target.tagName === "A") { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); } };
  const th = h("button", "ico", "☾", { "aria-label": "Changer de thème", id: "theme" });
  th.onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  const el = add(h("header", "top"), add(h("div", "wrap bar"), link("index.html", S.name, "brand"), nav, add(h("div", "tools"), th, burger)));
  addEventListener("scroll", () => el.classList.toggle("scrolled", scrollY > 8), { passive: true });
  return el;
}
function footer() {
  const f = h("footer", "foot"), w = h("div", "wrap"), soc = h("div", "soc");
  [["GitHub", S.github], ["LinkedIn", S.linkedin], ["Email", S.email && "mailto:" + S.email]].forEach(([n, u]) => u && soc.appendChild(link(u, n, "", !u.startsWith("mailto"))));
  return add(f, add(w, h("p", null, "© " + new Date().getFullYear() + " " + S.name + " — " + S.city), soc));
}
const slug = s => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
function projectCard(p) {
  const c = h("article", "card rv" + (p.featured ? " feat" : ""));
  add(c, add(h("div", "row"), h("span", "badge", p.cat), h("span", "status st-" + slug(p.status), p.status + (p.year ? " · " + p.year : ""))), h("h3", null, p.title), h("p", "muted", p.desc), tags(p.stack));
  const l = h("div", "btns sm");
  if (p.link) l.appendChild(link(p.link, "Voir en ligne →", "", true));
  if (p.repo) l.appendChild(link(p.repo, "Code source", "", true));
  return l.children.length ? add(c, l) : c;
}
function certCard(c) {
  const d = h("article", "card rv");
  if (c.img) add(d, h("img", "cert", null, { src: c.img, alt: c.title, loading: "lazy" }));
  add(d, h("h3", null, c.title), h("p", "muted", c.org + (c.date ? " · " + c.date : "")));
  if (c.id) add(d, h("p", "muted", "ID : " + c.id));
  return c.link ? add(d, link(c.link, "Vérifier la certification →", "", true)) : d;
}
const timeline = a => add(h("div", "tl"), ...a.map(x => add(h("div", "it rv"), h("b", null, x.title), h("span", "muted", [x.where, x.date].filter(Boolean).join(" · ")), x.text && h("p", null, x.text))));
const skillsGrid = () => add(h("div", "grid"), ...Object.entries(S.skills).map(([g, a]) => add(h("div", "card rv"), h("h3", null, g), tags(a))));
const empty = t => h("p", "muted empty", t);

function countUp(el, n) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || n < 2) return (el.textContent = n);
  const t0 = performance.now(); el.textContent = 0;
  (function f(t) { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
}

/* ---------- Pages ---------- */
const pages = {
  home() {
    const top = Object.values(S.skills).flat().slice(0, 6);
    const card = add(h("aside", "me card"), h("div", "avatar", (S.name || "?").trim().charAt(0).toUpperCase(), { "aria-hidden": "true" }), h("b", null, S.name), h("span", "muted", S.role), h("span", "muted", "📍 " + S.city), tags(top));
    const hero = add(h("section", "wrap hero"),
      add(h("div"), h("p", "eyebrow", S.role + " · " + S.city), h("h1", null, "Bonjour, je suis " + S.name + "."), h("p", "lead", S.tagline),
        add(h("div", "btns"), link("projets.html", "Voir mes projets", "btn"), link("contact.html", "Me contacter", "btn o"), link("cv.html", "Mon CV", "btn o"))), card);
    const nTech = new Set(Object.values(S.skills).flat()).size;
    const stats = add(h("div", "wrap stats"), ...[[S.projects.length, "Projets"], [S.certs.length, "Certifications"], [nTech, "Compétences"]].map(([n, l]) => { const b = h("b", null, n); requestAnimationFrame(() => countUp(b, n)); return add(h("div", "stat"), b, h("span", null, l)); }));
    const feat = S.projects.filter(p => p.featured).slice(0, 3);
    return [hero, stats,
      sec("À propos", null, ...S.about.map(t => h("p", "prose", t))),
      sec("Projets à la une", "Une sélection de mes réalisations.", add(h("div", "grid"), ...(feat.length ? feat : S.projects.slice(0, 3)).map(projectCard)), add(h("div", "btns"), link("projets.html", "Tous les projets →", "btn o"))),
      sec("Compétences", null, skillsGrid())];
  },
  projects() {
    const list = h("div", "grid"), count = h("p", "muted count", null, { "aria-live": "polite" });
    const cats = ["Tous", ...new Set(S.projects.map(p => p.cat))], stats = ["Tous", ...new Set(S.projects.map(p => p.status).filter(Boolean))];
    let cat = decodeURIComponent(location.hash.slice(1)), st = "Tous", q = "";
    if (!cats.includes(cat)) cat = "Tous";
    const fl = h("div", "filters", null, { role: "group", "aria-label": "Catégories" });
    const draw = () => {
      list.innerHTML = "";
      const r = S.projects.filter(p => (cat === "Tous" || p.cat === cat) && (st === "Tous" || p.status === st) && (p.title + p.desc + p.stack.join(" ")).toLowerCase().includes(q));
      r.length ? r.forEach(p => list.appendChild(projectCard(p))) : list.appendChild(empty("Aucun projet ne correspond à votre recherche."));
      count.textContent = r.length + " projet" + (r.length > 1 ? "s" : ""); observe();
    };
    cats.forEach(c => { const b = h("button", c === cat ? "on" : "", c, { "aria-pressed": c === cat }); b.onclick = () => { [...fl.children].forEach(x => { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); }); b.classList.add("on"); b.setAttribute("aria-pressed", "true"); cat = c; history.replaceState(null, "", c === "Tous" ? location.pathname : "#" + encodeURIComponent(c)); draw(); }; fl.appendChild(b); });
    const sel = h("select", "sel", null, { "aria-label": "Statut" });
    stats.forEach(s => sel.appendChild(h("option", null, s === "Tous" ? "Tous les statuts" : s, { value: s })));
    sel.onchange = () => { st = sel.value; draw(); };
    const s = h("input", "search", null, { type: "search", placeholder: "Rechercher un projet ou une technologie…", "aria-label": "Rechercher" });
    s.oninput = () => { q = s.value.trim().toLowerCase(); draw(); };
    draw();
    return [sec("Projets & applications", "Tout ce que j’ai conçu et développé.", add(h("div", "tools2"), fl, add(h("div", "tools3"), sel, s)), count, list)];
  },
  certs() { return [sec("Certifications", "Formations et certifications obtenues.", S.certs.length ? add(h("div", "grid"), ...S.certs.map(certCard)) : empty("Les certifications seront bientôt ajoutées."))]; },
  cv() {
    const pr = h("button", "btn o", "Imprimer"); pr.onclick = () => print();
    const dl = add(h("div", "btns"), S.cv && link(S.cv, "Télécharger le CV (PDF)", "btn", true), pr);
    return [sec("Curriculum vitæ", S.role + " — " + S.city, dl, h("h3", "h3s", "Formation"), timeline(S.education), h("h3", "h3s", "Expérience"), timeline(S.experience), h("h3", "h3s", "Compétences"), skillsGrid())];
  },
  contact() {
    const f = h("form", "form", null, { novalidate: "" }), msgBox = h("p", "note", null, { role: "status", "aria-live": "polite" });
    const fld = (l, n, t, extra) => add(h("label"), h("span", null, l), h(t === "textarea" ? "textarea" : "input", null, null, Object.assign({ name: n, id: n, required: "", maxlength: t === "textarea" ? 3000 : 200 }, t === "textarea" ? {} : { type: t || "text" }, extra)));
    const trap = add(h("label", "trap", null, { "aria-hidden": "true" }), h("input", null, null, { name: "website", tabindex: "-1", autocomplete: "off" }));
    const btn = h("button", "btn", "Envoyer", { type: "submit" });
    add(f, fld("Nom", "nom", "text", { autocomplete: "name" }), fld("Email", "mail", "email", { autocomplete: "email" }), fld("Message", "msg", "textarea"), trap, btn, msgBox);
    const say = (t, ok) => { msgBox.textContent = t; msgBox.className = "note " + (ok ? "ok" : "ko"); };
    f.onsubmit = async e => {
      e.preventDefault(); const v = n => f.elements[n].value.trim();
      if (!v("nom") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("mail")) || v("msg").length < 5) return say("Vérifiez votre nom, votre email et votre message (5 caractères minimum).", false);
      if (online) {
        btn.disabled = true; say("Envoi en cours…", true);
        try { await api("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: v("nom"), mail: v("mail"), msg: v("msg"), website: v("website") }) }); f.reset(); return say("Merci ! Votre message a bien été envoyé, je vous répondrai rapidement.", true); }
        catch (err) { say(err.message + " — vous pouvez aussi m’écrire directement par email.", false); }
        finally { btn.disabled = false; }
        return;
      }
      location.href = "mailto:" + S.email + "?subject=" + encodeURIComponent("Contact portfolio — " + v("nom")) + "&body=" + encodeURIComponent(v("msg") + "\n\n" + v("nom") + " (" + v("mail") + ")");
    };
    const info = add(h("div", "card"), h("h3", null, "Coordonnées"), h("p", "muted", S.city));
    [["Email", S.email && "mailto:" + S.email, S.email], ["GitHub", S.github, S.github], ["LinkedIn", S.linkedin, S.linkedin], ["WhatsApp", S.whatsapp && "https://wa.me/" + S.whatsapp, S.whatsapp]].forEach(([n, u, x]) => x && add(info, add(h("p"), h("b", null, n + " : "), link(u, x, "", !u.startsWith("mailto")))));
    if (S.email && navigator.clipboard) { const cp = h("button", "btn o sm", "Copier l’email"); cp.onclick = () => navigator.clipboard.writeText(S.email).then(() => { cp.textContent = "Copié ✓"; setTimeout(() => cp.textContent = "Copier l’email", 1800); }); add(info, cp); }
    return [sec("Contact", "Un projet, une collaboration, une opportunité ? Écrivez-moi.", add(h("div", "two"), f, info))];
  },
  404() { return [add(h("section", "wrap hero one"), add(h("div"), h("h1", null, "404"), h("p", "lead", "Cette page n’existe pas."), add(h("div", "btns"), link("index.html", "Retour à l’accueil", "btn"))))]; }
};

let io; function observe() { if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 }); document.querySelectorAll(".rv:not(.in)").forEach(e => io.observe(e)); }

/* ---------- Démarrage ---------- */
(async function () {
  const page = document.body.dataset.page, app = $("#app");
  await loadSite();
  const ld = h("script", null, JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: S.name, jobTitle: S.role, address: S.city, email: S.email || undefined, sameAs: [S.github, S.linkedin].filter(Boolean) }), { type: "application/ld+json" });
  document.head.appendChild(ld);
  add(app, link("#main", "Aller au contenu", "skip"), header(page), add(h("main", null, null, { id: "main" }), ...pages[page]()), footer());
  setTheme(document.documentElement.dataset.theme);
  observe();
  if (online && page !== "404" && navigator.sendBeacon) navigator.sendBeacon(API + "/api/visit", new Blob([JSON.stringify({ page })], { type: "application/json" }));
})();
