# Portfolio de Leclerc — site web multi-pages

Site statique (HTML/CSS/JS, aucune installation requise) : Accueil, Projets, Certifications, CV, Contact, page 404.

## 1. Personnaliser (5 minutes)
1. Ouvrez `assets/js/data.js` : tout le contenu s’y trouve (identité, projets, certifications, parcours, contacts).
2. Remplacez `email` et ajoutez vos liens `github`, `linkedin`, `whatsapp` (format `237600000000`).
3. Déposez votre CV en PDF dans `assets/docs/` sous le nom `CV-Leclerc.pdf`.
4. Images de certificats : placez-les dans `assets/img/` puis indiquez `img: "assets/img/mon-certificat.jpg"`.
5. Ajoutez un projet en copiant un bloc `{ title: ..., }` dans la liste `projects` (mettez `link` et `repo` quand ils existent).

## 2. Tester en local
```
cd portfolio-leclerc
python3 -m http.server 8000
```
Puis ouvrez http://localhost:8000 (ou double-cliquez simplement sur `index.html`).

## 3. Déployer gratuitement (3 options)

### Option A — GitHub Pages (recommandée, sert aussi à présenter votre code)
1. Créez un compte sur github.com puis un dépôt public nommé `votre-pseudo.github.io` (ou n’importe quel nom).
2. Dans le dossier du site :
```
git init
git add .
git commit -m "Mon portfolio"
git branch -M main
git remote add origin https://github.com/VOTRE-PSEUDO/VOTRE-DEPOT.git
git push -u origin main
```
3. Sur GitHub : **Settings → Pages → Source : Deploy from a branch → main / (root) → Save**.
4. Après 1 à 2 minutes, le site est en ligne sur `https://VOTRE-PSEUDO.github.io/VOTRE-DEPOT/`.

### Option B — Netlify (le plus simple, sans Git)
1. Allez sur app.netlify.com, créez un compte.
2. **Add new site → Deploy manually**, puis glissez-déposez le **dossier** `portfolio-leclerc`.
3. Le site est en ligne immédiatement. Vous pouvez changer le nom dans **Site configuration → Change site name**.

### Option C — Cloudflare Pages
1. dash.cloudflare.com → **Workers & Pages → Create → Pages → Upload assets**.
2. Déposez le dossier, puis **Deploy**.

## 4. Nom de domaine personnalisé (facultatif)
1. Achetez un domaine (ex. `leclerc.dev`, `leclerc.tech`) chez Namecheap, OVH, Gandi, etc.
2. Dans Netlify : **Domain management → Add a domain**. Dans GitHub Pages : **Settings → Pages → Custom domain**.
3. Chez votre registrar, créez les enregistrements DNS indiqués par la plateforme (CNAME pour `www`, A/ALIAS pour le domaine nu). Le HTTPS est activé automatiquement.

## 5. Mises à jour
- GitHub Pages : modifiez les fichiers, puis `git add . && git commit -m "maj" && git push`.
- Netlify : reglissez le dossier dans **Deploys**, ou connectez le dépôt GitHub pour un déploiement automatique.

## 6. Conseils
- Formulaire de contact : il ouvre le client e-mail du visiteur. Pour recevoir les messages directement, utilisez Formspree ou Netlify Forms.
- Référencement : gardez des titres clairs et ajoutez `sitemap.xml` avec votre vraie adresse une fois le domaine choisi.
- Ne publiez pas d’informations sensibles (numéro de matricule, adresse personnelle, pièces d’identité).
