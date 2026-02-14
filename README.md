# JST Server

Serveur web Node.js avec préprocesseur de templates `{{variables}}`.  
Compatible **local**, **Vercel** et importable via **npm**.

---

## Installation

```bash
npm install jst-server
```

Ou directement depuis GitHub :
```bash
npm install luilautre/jst
```

---

## Utilisation

### En ligne de commande (local)

```bash
npx jst          # port 3000 par défaut
npx jst 8080     # port au choix
```

### Dans un projet Node.js / Vercel

```js
const { creerApp } = require('jst-server');
const app = creerApp({ racine: __dirname });
module.exports = app; // pour Vercel
// ou : app.listen(3000); // pour un serveur local
```

---

## Fonctionnement

À chaque requête, JST Server :
1. Lit le fichier demandé
2. Remplace les `{{variables}}` avec le contenu de `variables.json`
3. Injecte les `{{include: fichier}}` 
4. Envoie le résultat au client — aucun fichier généré sur le disque

---

## variables.json

Définis tes variables globales dans un fichier `variables.json` à la racine :

```json
{
  "SiteTitle": "Mon Site",
  "ThisURL": "https://monsite.com",
  "SiteHeader": "<header><a href=\"{{ThisURL}}\">Accueil</a></header>",
  "SiteFooter": "<footer>&copy; 2025</footer>"
}
```

Les variables peuvent s'imbriquer (`{{ThisURL}}` dans `SiteHeader` est résolu automatiquement).

---

## {{include: fichier}}

Inclure un fichier entier dans une page :

```html
<head>
  {{include: partials/meta.html}}
  {{include: partials/style.css}}
</head>
```

---

## .jstignore

Les fichiers listés dans `.jstignore` sont servis **tels quels**, sans traitement :

```
variables.json
*.min.js
*.min.css
libs/
```

---

## Déploiement sur Vercel

1. Crée un fichier `api/index.js` :
```js
const path = require('path');
const { creerApp } = require('jst-server');
const app = creerApp({ racine: path.join(__dirname, '..', 'public') });
module.exports = app;
```

2. Ajoute un `vercel.json` :
```json
{
  "version": 2,
  "builds": [{ "src": "api/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "api/index.js" }]
}
```

3. Déploie :
```bash
vercel
```

---

## Structure recommandée

```
mon-projet/
├── api/
│   └── index.js       ← point d'entrée Vercel
├── public/            ← tes fichiers HTML/CSS/JS
│   ├── index.html
│   └── style.css
├── variables.json     ← variables globales
├── .jstignore         ← fichiers à ne pas traiter
└── vercel.json
```

---

## Auteur

[luilautre](https://github.com/luilautre)  
Licence MIT
