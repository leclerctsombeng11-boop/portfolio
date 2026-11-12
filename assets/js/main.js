const S = SITE, $ = (s, r = document) => r.querySelector(s);
const h = (t, c, x, a) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (a) for (const k in a) e.setAttribute(k, a[k]); return e; };
const add = (p, ...k) => { k.forEach(x => x && p.appendChild(x)); return p; };
const link = (href, text, cls, ext) => h("a", cls, text, Object.assign({ href }, ext ? { target: "_blank", rel: "noopener" } : {}));
const tags = a => add(h("div", "tags"), ...a.map(t => h("span", "tag", t)));
const sec = (title, sub, ...k) => { const s = h("section", "wrap sec"); add(s, h("h2", null, title)); if (sub) add(s, h("p", "sub", sub)); return add(s, ...k); };
const NAV = [["index.html", "Accueil", "home"], ["projets.html", "Projets", "projects"], ["certifications.html", "Certifications", "certs"], ["cv.html", "CV", "cv"], ["contact.html", "Contact", "contact"]];

function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem("theme", t); } catch (e) {} }
(function () { let t; try { t = localStorage.getItem("theme"); } catch (e) {} setTheme(t || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")); })();

function header(page) {
  const nav = h("nav", "links", null, { id: "menu" });
  NAV.forEach(([u, n, p]) => { const a = link(u, n); if (p === page) a.className = "on"; nav.appendChild(a); });
  const burger = h("button", "ico burger", "☰", { "aria-label": "Menu", "aria-expanded": "false" });
  burger.onclick = () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); };
  const th = h("button", "ico", "◐", { "aria-label": "Changer de thème" });
  th.onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  return add(h("header", "top"), add(h("div", "wrap bar"), link("index.html", S.name, "brand"), nav, add(h("div", "tools"), th, burger)));
}
function footer() {
  const f = h("footer", "foot"), w = h("div", "wrap");
  const soc = add(h("div", "soc"));
  [["GitHub", S.github], ["LinkedIn", S.linkedin], ["Email", S.email && "mailto:" + S.email]].forEach(([n, u]) => u && soc.appendChild(link(u, n, "", !u.startsWith("mailto"))));
  return add(f, add(w, h("p", null, "© " + new Date().getFullYear() + " " + S.name + " — " + S.city), soc));
}
function projectCard(p) {
  const c = h("article", "card rv");
  add(c, add(h("div", "row"), h("span", "badge", p.cat), h("span", "muted", p.status + (p.year ? " · " + p.year : ""))), h("h3", null, p.title), h("p", "muted", p.desc), tags(p.stack));
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

const pages = {
  home() {
    const hero = add(h("section", "wrap hero"), h("p", "eyebrow", S.role + " · " + S.city), h("h1", null, "Bonjour, je suis " + S.name + "."), h("p", "lead", S.tagline),
      add(h("div", "btns"), link("projets.html", "Voir mes projets", "btn"), link("contact.html", "Me contacter", "btn o"), link("cv.html", "Mon CV", "btn o")));
    const nTech = new Set(Object.values(S.skills).flat()).size;
    const stats = add(h("div", "wrap stats"), ...[[S.projects.length, "Projets"], [S.certs.length, "Certifications"], [nTech, "Compétences"]].map(([n, l]) => add(h("div", "stat"), h("b", null, n), h("span", null, l))));
    const feat = S.projects.filter(p => p.featured).slice(0, 3);
    return [hero, stats,
      sec("À propos", null, ...S.about.map(t => h("p", "prose", t))),
      sec("Projets à la une", "Une sélection de mes réalisations.", add(h("div", "grid"), ...feat.map(projectCard)), add(h("div", "btns"), link("projets.html", "Tous les projets →", "btn o"))),
      sec("Compétences", null, skillsGrid())];
  },
  projects() {
    const list = h("div", "grid"), cats = ["Tous", ...new Set(S.projects.map(p => p.cat))];
    let cat = "Tous", q = "";
    const draw = () => { list.innerHTML = ""; const r = S.projects.filter(p => (cat === "Tous" || p.cat === cat) && (p.title + p.desc + p.stack.join(" ")).toLowerCase().includes(q)); r.length ? r.forEach(p => list.appendChild(projectCard(p))) : list.appendChild(h("p", "muted", "Aucun projet trouvé.")); observe(); };
    const fl = h("div", "filters");
    cats.forEach((c, i) => { const b = h("button", i ? "" : "on", c); b.onclick = () => { [...fl.children].forEach(x => x.classList.remove("on")); b.classList.add("on"); cat = c; draw(); }; fl.appendChild(b); });
    const s = h("input", "search", null, { type: "search", placeholder: "Rechercher un projet ou une technologie…", "aria-label": "Rechercher" });
    s.oninput = () => { q = s.value.trim().toLowerCase(); draw(); };
    draw();
    return [sec("Projets & applications", "Tout ce que j’ai conçu et développé.", add(h("div", "tools2"), fl, s), list)];
  },
  certs() { return [sec("Certifications", "Formations et certifications obtenues.", add(h("div", "grid"), ...S.certs.map(certCard)))]; },
  cv() {
    const dl = add(h("div", "btns"), link(S.cv, "Télécharger le CV (PDF)", "btn", true), (() => { const b = h("button", "btn o", "Imprimer"); b.onclick = () => print(); return b; })());
    return [sec("Curriculum vitæ", S.role + " — " + S.city, dl, h("h3", "h3s", "Formation"), timeline(S.education), h("h3", "h3s", "Expérience"), timeline(S.experience), h("h3", "h3s", "Compétences"), skillsGrid())];
  },
  contact() {
    const f = h("form", "form");
    const fld = (l, n, t) => { const i = h(t || "input", null, null, { name: n, required: "", id: n }); return add(h("label"), h("span", null, l), i); };
    add(f, fld("Nom", "nom"), fld("Email", "mail"), fld("Message", "msg", "textarea"), h("button", "btn", "Envoyer", { type: "submit" }));
    f.onsubmit = e => { e.preventDefault(); const v = n => f.elements[n].value; location.href = "mailto:" + S.email + "?subject=" + encodeURIComponent("Contact portfolio — " + v("nom")) + "&body=" + encodeURIComponent(v("msg") + "\n\n" + v("nom") + " (" + v("mail") + ")"); };
    const info = add(h("div", "card"), h("h3", null, "Coordonnées"), h("p", "muted", S.city));
    [["Email", S.email && "mailto:" + S.email, S.email], ["GitHub", S.github, S.github], ["LinkedIn", S.linkedin, S.linkedin], ["WhatsApp", S.whatsapp && "https://wa.me/" + S.whatsapp, S.whatsapp]].forEach(([n, u, v]) => v && add(info, add(h("p"), h("b", null, n + " : "), link(u, v, "", !u.startsWith("mailto")))));
    return [sec("Contact", "Un projet, une collaboration, une opportunité ? Écrivez-moi.", add(h("div", "two"), f, info))];
  },
  404() { return [add(h("section", "wrap hero"), h("h1", null, "404"), h("p", "lead", "Cette page n’existe pas."), add(h("div", "btns"), link("index.html", "Retour à l’accueil", "btn")))]; }
};
let io; function observe() { if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 }); document.querySelectorAll(".rv:not(.in)").forEach(e => io.observe(e)); }
const page = document.body.dataset.page, app = $("#app");
add(app, header(page), add(h("main"), ...pages[page]()), footer());
observe();
