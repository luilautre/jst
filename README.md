# JST Server

Serveur web Node.js avec préprocesseur de templates `{{variables}}`.  
Compatible **local**, **Vercel** et importable via **npm**.  
Exemple : [https://github.com/luilautre/testJST/](luilautre/testJST)

---

## Installation

```bash
npm install @luilautre/jst
```

Ou directement depuis GitHub :
```bash
npm install luilautre/jst
```

---

## Utilisation

### 1. Middleware sur app Express existante (recommandé)

Applique JST comme middleware sur ton serveur Express :

```js
const express = require('express');
const path = require('path');
const { jstMiddleware } = require('@luilautre/jst');

const app = express();

// Applique JST sur tous les fichiers
app.use(jstMiddleware({
  racine: __dirname,                        // variables.json, functions.js ici
  public: path.join(__dirname, 'public')    // fichiers HTML/CSS/JS ici
}));

// Routes personnalisées après
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(3000);
```

JST traitera automatiquement tous les fichiers avant de les envoyer !

### 2. En ligne de commande (local)

```bash
npx jst          # port 3000 par défaut
npx jst 8080     # port au choix
```

### 3. App Express complète (legacy)

```js
const path = require('path');
const { creerApp } = require('@luilautre/jst');

const app = creerApp({
  racine: path.resolve('./'),
  public: path.join(path.resolve('./'), 'public')
});

module.exports = app; // pour Vercel

if (require.main === module) {
  app.listen(3000, () => console.log('Serveur sur http://localhost:3000'));
}
```

---

## Fonctionnement

À chaque requête, JST Server :
1. Lit le fichier demandé dans le dossier `public/`
2. Remplace les `{{variables}}` avec le contenu de `variables.json`
3. Remplace les `{{_constantes_}}` internes (date, URL, heure...)
4. Appelle les `{{fonctions()}}` déclarées dans `functions.js`
5. Injecte les `{{include: fichier}}`
6. Envoie le résultat au client — aucun fichier généré sur le disque

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

## Constantes internes

JST fournit des constantes automatiques utilisables dans tous les fichiers :

```
{{_thisURL_}}      URL de la requête courante
{{_thisFile_}}     Nom du fichier
{{_thisDir_}}      Dossier du fichier
{{_host_}}         Nom d'hôte
{{_protocol_}}     http ou https
{{_method_}}       GET, POST...
{{_ip_}}           IP du visiteur
{{_date_}}         Date (YYYY-MM-DD)
{{_time_}}         Heure (HH:MM:SS)
{{_datetime_}}     Date et heure ISO
{{_timestamp_}}    Timestamp Unix
{{_year_}}         Année
{{_month_}}        Mois
{{_day_}}          Jour
{{_weekday_}}      Jour de la semaine (ex: Lundi)
{{_env_}}          development ou production
{{_jstVersion_}}   Version de JST
```

---

## Fonctions

Déclare des fonctions dans `functions.js` à la racine :

```js
module.exports = {
  // Usage : {{lien(/contact.html, Contactez-nous)}}
  lien([href, texte]) {
    return `<a href="${href}">${texte || href}</a>`;
  },

  // Usage : {{header(Mon Site, /logo.png)}}
  header([titre, logo], contexte, vars) {
    return `<header><a href="${vars._protocol_}://${vars._host_}/">${titre}</a></header>`;
  },

  // Usage : {{dateFormatee(fr-FR)}}
  dateFormatee([locale]) {
    return new Date().toLocaleDateString(locale || 'fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
};
```

Chaque fonction reçoit `(args, contexte, variables)` et retourne une string HTML.

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

1. Crée `server.js` à la racine :
```js
const path = require('path');
const { creerApp } = require('@luilautre/jst');

const app = creerApp({
  racine: path.resolve('./'),
  public: path.join(path.resolve('./'), 'public')
});

module.exports = app;
```

2. Ajoute `vercel.json` :
```json
{
  "builds": [{
    "src": "server.js",
    "use": "@vercel/node",
    "config": {
      "includeFiles": ["variables.json", "public/**"]
    }
  }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

3. Structure du projet :
```
mon-projet/
├── server.js          ← point d'entrée
├── vercel.json
├── package.json
├── variables.json     ← variables globales
├── functions.js       ← fonctions JST (optionnel)
├── .jstignore         ← fichiers à ne pas traiter (optionnel)
└── public/            ← tes fichiers HTML/CSS/JS
    ├── index.html
    └── style.css
```

---

## Auteur

[luilautre](https://github.com/luilautre)  
Licence MIT
