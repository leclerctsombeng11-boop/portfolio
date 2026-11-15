# Portfolio de Leclerc — site + backend

Site multi-pages (Accueil, Projets, Certifications, CV, Contact) avec un **backend Node.js sans dépendance** :
messages de contact enregistrés, compteur de visites anonyme et **panneau d'administration** (`/admin`) pour modifier tout le contenu sans toucher au code.

## Démarrage rapide
Prérequis : [Node.js 18+](https://nodejs.org). Aucun `npm install` nécessaire.
```
cp .env.example .env        # puis éditez .env : définissez ADMIN_PASSWORD (10 caractères minimum)
node server.js              # ou : npm start
```
- Site : http://localhost:3000
- Administration : http://localhost:3000/admin

Au premier lancement, le contenu de `assets/js/data.js` est importé dans `data/site.json`. **Ensuite, le contenu se modifie dans `/admin`** (profil, compétences, projets, certifications, parcours, CV et images à téléverser).

## Ce que fait le backend
| Route | Rôle |
|---|---|
| `GET /api/site` | Contenu du site (lu par le frontend) |
| `POST /api/contact` | Enregistre un message (validation, anti-spam par champ piège, 5 messages/heure/IP) |
| `POST /api/visit` | Compteur de visites anonyme (aucune IP ni cookie stockés) |
| `POST /api/admin/login` | Connexion admin (jeton signé 12 h, 8 tentatives/15 min/IP) |
| `PUT /api/admin/site` · `GET/PATCH/DELETE /api/admin/messages` · `GET /api/admin/stats` · `POST /api/admin/upload` | Administration (jeton requis) |

Les données sont dans `DATA_DIR` (par défaut `./data`) : `site.json`, `messages.json`, `stats.json`, `uploads/`.
Pensez à **sauvegarder ce dossier**. Pour être prévenu à chaque message, renseignez `NOTIFY_WEBHOOK` (Slack, Discord, Make…).

## Repli sans backend
Si l'API ne répond pas (GitHub Pages, double-clic sur `index.html`…), le site affiche automatiquement le contenu de `assets/js/data.js`
et le formulaire de contact ouvre le client e-mail. Gardez donc `data.js` à jour si vous utilisez aussi cet hébergement statique.

## Déploiement
Le backend a besoin d'un hébergeur **Node.js avec disque persistant** : sinon messages et modifications sont perdus à chaque redéploiement.
Options : VPS (`node server.js` + Nginx/Caddy + pm2/systemd), Fly.io ou Railway avec un volume, ou Docker :
```
docker build -t portfolio .
docker run -d -p 3000:3000 -v portfolio-data:/data -e ADMIN_PASSWORD="votre-mot-de-passe" portfolio
```
Derrière un proxy HTTPS, mettez `TRUST_PROXY=1`. **Utilisez toujours HTTPS** pour `/admin`.

Garder le front sur GitHub Pages et l'API ailleurs est possible : dans `assets/js/config.js` mettez `API_BASE = "https://votre-api"`
et, côté serveur, `CORS_ORIGIN=https://votre-pseudo.github.io`. (L'administration reste accessible sur l'adresse du serveur.)

## Sécurité (déjà en place)
Contenu validé et nettoyé côté serveur (URL `http(s)` uniquement), aucun fichier sensible servi (`server.js`, `.env`, `data/`),
fichiers téléversés vérifiés (type + signature, 8 Mo max), en-têtes CSP/nosniff, écriture des données atomique.
Ne publiez pas d'informations sensibles (matricule, adresse personnelle, pièces d'identité).

## Structure
```
server.js            backend (API + fichiers statiques)
admin.html           panneau d'administration  (assets/js/admin.js, assets/css/admin.css)
*.html               pages publiques           (assets/js/main.js, assets/css/style.css)
assets/js/data.js    contenu initial + contenu de secours
assets/js/config.js  adresse de l'API (vide = même serveur)
```
